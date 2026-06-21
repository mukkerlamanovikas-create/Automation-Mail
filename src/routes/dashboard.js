const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const DAILY_LIMIT = 350;

router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const uid = req.user.id;

    const [totals, todayRows, accountRows, recentCampaigns] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int                                                               AS total_campaigns,
          COALESCE(SUM(sent_count), 0)::int                                          AS total_sent,
          COALESCE(SUM(CASE WHEN status IN ('active','paused') THEN pending_count ELSE 0 END), 0)::int AS pending_emails,
          COALESCE(SUM(failed_count), 0)::int                                        AS failed_emails
        FROM campaigns WHERE user_id = ${uid}
      `,
      sql`
        SELECT COALESCE(SUM(dec.sent_count), 0)::int AS sent_today
        FROM daily_email_counts dec
        JOIN gmail_accounts ga ON ga.id = dec.gmail_account_id
        WHERE ga.user_id = ${uid} AND dec.date = CURRENT_DATE
      `,
      sql`
        SELECT ga.id, ga.label, ga.email,
               COALESCE(dec.sent_count, 0)::int                         AS today_sent,
               (${DAILY_LIMIT} - COALESCE(dec.sent_count, 0))::int     AS remaining
        FROM gmail_accounts ga
        LEFT JOIN daily_email_counts dec
          ON dec.gmail_account_id = ga.id AND dec.date = CURRENT_DATE
        WHERE ga.user_id = ${uid}
        ORDER BY ga.created_at ASC
      `,
      sql`
        SELECT c.id, c.name, c.status, c.total_recipients, c.sent_count,
               c.failed_count, c.pending_count, c.created_at, c.completed_at,
               ga.email AS gmail_email, et.name AS template_name
        FROM campaigns c
        JOIN gmail_accounts ga ON ga.id = c.gmail_account_id
        JOIN email_templates et ON et.id = c.template_id
        WHERE c.user_id = ${uid}
        ORDER BY c.created_at DESC
        LIMIT 10
      `,
    ]);

    const { total_campaigns, total_sent, pending_emails, failed_emails } = totals[0];
    const sent_today = todayRows[0].sent_today;
    const remaining_daily_limit = accountRows.reduce((s, a) => s + Math.max(0, a.remaining), 0);

    res.json({
      success: true,
      data: {
        total_campaigns,
        total_sent,
        sent_today,
        pending_emails,
        failed_emails,
        remaining_daily_limit,
        active_accounts: accountRows.length,
        accounts: accountRows,
        recent_campaigns: recentCampaigns,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
