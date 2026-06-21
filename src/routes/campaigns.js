const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { nameFromEmail } = require('../lib/nameGenerator');

const router = express.Router();
router.use(requireAuth);

// GET /api/campaigns
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const campaigns = await sql`
      SELECT c.id, c.name, c.status, c.total_recipients, c.sent_count, c.failed_count, c.pending_count,
             c.created_at, c.completed_at,
             ga.label AS gmail_label, ga.email AS gmail_email,
             et.name AS template_name
      FROM campaigns c
      JOIN gmail_accounts ga ON ga.id = c.gmail_account_id
      JOIN email_templates et ON et.id = c.template_id
      WHERE c.user_id = ${req.user.id}
      ORDER BY c.created_at DESC
    `;
    res.json({ success: true, data: campaigns });
  } catch (err) { next(err); }
});

// POST /api/campaigns
router.post('/', async (req, res, next) => {
  try {
    const { name, gmail_account_id, template_id, recipients } = req.body;
    if (!name || !gmail_account_id || !template_id || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'name, gmail_account_id, template_id, and recipients[] are required' });
    }

    // Verify ownership
    const sql = getDb();
    const acct = await sql`SELECT id FROM gmail_accounts WHERE id = ${gmail_account_id} AND user_id = ${req.user.id}`;
    if (!acct[0]) return res.status(404).json({ success: false, error: 'Gmail account not found' });

    const tmpl = await sql`SELECT id FROM email_templates WHERE id = ${template_id} AND user_id = ${req.user.id}`;
    if (!tmpl[0]) return res.status(404).json({ success: false, error: 'Template not found' });

    // Deduplicate (first occurrence wins) and generate missing names
    const seen = new Set();
    const cleaned = [];
    for (const r of recipients) {
      const email = (r.email || '').toLowerCase().trim();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      cleaned.push({ name: (r.name || '').trim() || nameFromEmail(email), email });
    }

    if (cleaned.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid recipients after deduplication' });
    }

    // Create campaign
    const campRows = await sql`
      INSERT INTO campaigns (user_id, name, gmail_account_id, template_id, total_recipients, pending_count)
      VALUES (${req.user.id}, ${name}, ${gmail_account_id}, ${template_id}, ${cleaned.length}, ${cleaned.length})
      RETURNING id, name, status, total_recipients, sent_count, failed_count, pending_count, created_at
    `;
    const campaign = campRows[0];

    // Bulk insert all recipients in a single query via unnest
    const names  = cleaned.map(r => r.name);
    const emails = cleaned.map(r => r.email);
    await sql`
      INSERT INTO campaign_recipients (campaign_id, name, email)
      SELECT ${campaign.id}, name, email
      FROM unnest(${names}::text[], ${emails}::text[]) AS t(name, email)
    `;

    res.status(201).json({ success: true, campaign });
  } catch (err) { next(err); }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT c.id, c.name, c.status, c.total_recipients, c.sent_count, c.failed_count, c.pending_count,
             c.created_at, c.completed_at,
             ga.label AS gmail_label, ga.email AS gmail_email,
             et.name AS template_name, et.subject AS template_subject
      FROM campaigns c
      JOIN gmail_accounts ga ON ga.id = c.gmail_account_id
      JOIN email_templates et ON et.id = c.template_id
      WHERE c.id = ${req.params.id} AND c.user_id = ${req.user.id}
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, campaign: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      UPDATE campaigns SET status = 'paused'
      WHERE id = ${req.params.id} AND user_id = ${req.user.id} AND status = 'active'
      RETURNING id, status
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found or not active' });
    res.json({ success: true, campaign: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/resume
router.post('/:id/resume', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      UPDATE campaigns SET status = 'active'
      WHERE id = ${req.params.id} AND user_id = ${req.user.id} AND status = 'paused'
      RETURNING id, status
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found or not paused' });
    res.json({ success: true, campaign: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
