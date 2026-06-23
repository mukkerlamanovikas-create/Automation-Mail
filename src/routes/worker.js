const express = require('express');
const { getDb } = require('../db');
const { decrypt } = require('../lib/crypto');
const { sendMail, createTransporter } = require('../lib/mailer');

const router = express.Router();

const DAILY_LIMIT = 400;  // max emails sent per day across all accounts
// 35 emails × 8s = 280s — stays within Vercel's 300s function timeout per invocation
const MAX_BATCH = parseInt(process.env.WORKER_BATCH_SIZE || '35', 10);
// 8-second gap between sends; set WORKER_GAP_MS=0 in test environments to skip
const getGap = () => parseInt(process.env.WORKER_GAP_MS || '8000', 10);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function isAuthorised(req) {
  if (req.headers['x-vercel-cron'] === '1') return true;
  if (req.query.secret && req.query.secret === process.env.WORKER_SECRET) return true;
  try {
    const jwt = require('jsonwebtoken');
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (token) { jwt.verify(token, process.env.JWT_SECRET); return true; }
  } catch { /* fall through */ }
  return false;
}

async function processQueue(req, res) {
  if (!isAuthorised(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  const sql = getDb();

  // How many emails have already been sent today (across all accounts)?
  const [{ sent_today }] = await sql`
    SELECT COALESCE(SUM(sent_count), 0)::int AS sent_today
    FROM daily_email_counts
    WHERE date = CURRENT_DATE
  `;
  if (sent_today >= DAILY_LIMIT) {
    return res.json({ success: true, processed: 0, message: `Daily limit of ${DAILY_LIMIT} already reached` });
  }

  // Only reset stale 'processing' rows (> 10 min old) — avoids clobbering a concurrent run
  await sql`
    UPDATE campaign_recipients SET status = 'pending'
    WHERE status = 'processing' AND queued_at < NOW() - INTERVAL '10 minutes'
  `;

  // Cache credentials and templates per invocation to avoid repeated DB round-trips
  const credCache = new Map();
  const tmplCache = new Map();
  const transporterCache = new Map();
  let totalProcessed = 0;
  // Don't exceed the daily cap even across multiple concurrent invocations
  const batchCap = Math.min(MAX_BATCH, DAILY_LIMIT - sent_today);

  // Keep pulling the next pending email until none remain
  while (true) {
    // Get next email across all active campaigns (oldest campaign first, FIFO within it)
    // Only pick from accounts that haven't hit today's 350-email limit
    const [row] = await sql`
      SELECT
        cr.id          AS recipient_id,
        cr.name,
        cr.email,
        cr.retry_count,
        cr.campaign_id,
        c.gmail_account_id,
        c.template_id
      FROM campaign_recipients cr
      JOIN campaigns c ON c.id = cr.campaign_id
      WHERE cr.status = 'pending'
        AND c.status  = 'active'
        AND (
          SELECT COALESCE(SUM(sent_count), 0)
          FROM daily_email_counts
          WHERE gmail_account_id = c.gmail_account_id
            AND date = CURRENT_DATE
        ) < ${DAILY_LIMIT}
      ORDER BY c.created_at ASC, cr.id ASC
      LIMIT 1
    `;

    if (!row || totalProcessed >= batchCap) break;

    // Atomically claim it so a parallel invocation can't double-send
    const [claimed] = await sql`
      UPDATE campaign_recipients SET status = 'processing'
      WHERE id = ${row.recipient_id} AND status = 'pending'
      RETURNING id
    `;
    if (!claimed) continue; // race — another worker got it first, try next

    // Load Gmail credentials (cached per account for this run)
    if (!credCache.has(row.gmail_account_id)) {
      const [acct] = await sql`
        SELECT email, encrypted_password, iv, auth_tag
        FROM gmail_accounts WHERE id = ${row.gmail_account_id}
      `;
      if (!acct) {
        await sql`DELETE FROM campaign_recipients WHERE id = ${row.recipient_id}`;
        continue;
      }
      try {
        const gmailPassword = decrypt({ ciphertext: acct.encrypted_password, iv: acct.iv, authTag: acct.auth_tag });
        credCache.set(row.gmail_account_id, { gmailEmail: acct.email, gmailPassword });
        transporterCache.set(row.gmail_account_id, createTransporter(acct.email, gmailPassword));
      } catch {
        await sql`UPDATE campaign_recipients SET status = 'pending' WHERE id = ${row.recipient_id}`;
        break;
      }
    }

    // Load template with PDF data (cached per template for this run)
    if (!tmplCache.has(row.template_id)) {
      const [tmpl] = await sql`
        SELECT subject, body, pdf_data, pdf_filename
        FROM email_templates WHERE id = ${row.template_id}
      `;
      if (!tmpl) {
        await sql`DELETE FROM campaign_recipients WHERE id = ${row.recipient_id}`;
        continue;
      }
      tmplCache.set(row.template_id, {
        subject: tmpl.subject,
        body: tmpl.body,
        pdfBuffer: tmpl.pdf_data ? Buffer.from(tmpl.pdf_data) : null,
        pdfFilename: tmpl.pdf_filename,
      });
    }

    const { gmailEmail, gmailPassword } = credCache.get(row.gmail_account_id);
    const { subject, body, pdfBuffer, pdfFilename } = tmplCache.get(row.template_id);

    try {
      await sendMail({
        fromEmail: gmailEmail,
        fromPassword: gmailPassword,
        to: row.email,
        toName: row.name,
        subject,
        bodyTemplate: body,
        pdfBuffer,
        pdfFilename,
        transporter: transporterCache.get(row.gmail_account_id),
      });

      // On success: delete recipient row immediately (don't retain email address)
      await sql`DELETE FROM campaign_recipients WHERE id = ${row.recipient_id}`;
      await sql`
        INSERT INTO daily_email_counts (gmail_account_id, date, sent_count)
        VALUES (${row.gmail_account_id}, CURRENT_DATE, 1)
        ON CONFLICT (gmail_account_id, date)
        DO UPDATE SET sent_count = daily_email_counts.sent_count + 1
      `;
      await sql`
        UPDATE campaigns
        SET sent_count   = sent_count + 1,
            pending_count = GREATEST(pending_count - 1, 0)
        WHERE id = ${row.campaign_id}
      `;
      totalProcessed++;

    } catch (err) {
      // On failure: retry up to 3 times, then delete
      const retries = (row.retry_count || 0) + 1;
      if (retries >= 3) {
        await sql`DELETE FROM campaign_recipients WHERE id = ${row.recipient_id}`;
        await sql`
          UPDATE campaigns
          SET failed_count  = failed_count + 1,
              pending_count = GREATEST(pending_count - 1, 0)
          WHERE id = ${row.campaign_id}
        `;
      } else {
        await sql`
          UPDATE campaign_recipients
          SET status = 'pending', retry_count = ${retries}, error_msg = ${err.message}
          WHERE id = ${row.recipient_id}
        `;
      }
    }

    // Mark campaign completed when all recipients are gone
    const [{ cnt }] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM campaign_recipients WHERE campaign_id = ${row.campaign_id}
    `;
    if (cnt === 0) {
      await sql`
        UPDATE campaigns
        SET status = 'completed', completed_at = NOW()
        WHERE id = ${row.campaign_id} AND status = 'active'
      `;
    }

    // Wait 8 seconds before sending the next email
    await sleep(getGap());
  }

  const totalSentToday = sent_today + totalProcessed;

  // If we hit the batch cap and there's still daily capacity, fire the next batch immediately.
  // This self-chains until all pending emails are sent or the 400/day limit is reached —
  // no external cron needed beyond the single 9 AM trigger.
  const shouldChain = totalProcessed >= MAX_BATCH && totalSentToday < DAILY_LIMIT;
  if (shouldChain && process.env.APP_URL && process.env.WORKER_SECRET) {
    const nextUrl = `${process.env.APP_URL}/api/worker/process?secret=${process.env.WORKER_SECRET}`;
    fetch(nextUrl).catch(() => {}); // fire and forget — don't await
  }

  res.json({ success: true, processed: totalProcessed, daily_sent: totalSentToday, daily_limit: DAILY_LIMIT, chained: shouldChain });
}

router.get('/process', processQueue);
router.post('/process', processQueue);

module.exports = router;
