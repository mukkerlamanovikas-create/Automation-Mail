const express = require('express');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { encrypt, decrypt } = require('../lib/crypto');

const router = express.Router();

router.use(requireAuth);

// GET /api/gmail-accounts
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const accounts = await sql`
      SELECT ga.id, ga.label, ga.email, ga.created_at,
             COALESCE(dec.sent_count, 0) AS sent_today
      FROM gmail_accounts ga
      LEFT JOIN daily_email_counts dec
        ON dec.gmail_account_id = ga.id AND dec.date = CURRENT_DATE
      WHERE ga.user_id = ${req.user.id}
      ORDER BY ga.created_at ASC
    `;
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
});

// POST /api/gmail-accounts
router.post('/', async (req, res, next) => {
  try {
    const { label, email, password } = req.body;
    if (!label || !email || !password) {
      return res.status(400).json({ success: false, error: 'label, email, and password are required' });
    }

    const { ciphertext, iv, authTag } = encrypt(password);
    const sql = getDb();
    const rows = await sql`
      INSERT INTO gmail_accounts (user_id, label, email, encrypted_password, iv, auth_tag)
      VALUES (${req.user.id}, ${label}, ${email.toLowerCase().trim()}, ${ciphertext}, ${iv}, ${authTag})
      RETURNING id, label, email, created_at
    `;
    res.status(201).json({ success: true, account: rows[0] });
  } catch (err) {
    if (err.message?.includes('unique')) {
      return res.status(409).json({ success: false, error: 'This Gmail account is already saved' });
    }
    next(err);
  }
});

// PUT /api/gmail-accounts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { label, password } = req.body;
    const sql = getDb();

    const rows = await sql`SELECT id FROM gmail_accounts WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Account not found' });

    if (password) {
      const { ciphertext, iv, authTag } = encrypt(password);
      await sql`
        UPDATE gmail_accounts
        SET label = ${label}, encrypted_password = ${ciphertext}, iv = ${iv}, auth_tag = ${authTag}
        WHERE id = ${req.params.id}
      `;
    } else if (label) {
      await sql`UPDATE gmail_accounts SET label = ${label} WHERE id = ${req.params.id}`;
    }

    const updated = await sql`SELECT id, label, email, created_at FROM gmail_accounts WHERE id = ${req.params.id}`;
    res.json({ success: true, account: updated[0] });
  } catch (err) { next(err); }
});

// DELETE /api/gmail-accounts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`DELETE FROM gmail_accounts WHERE id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id`;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Account not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/gmail-accounts/:id/test
router.post('/:id/test', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT email, encrypted_password, iv, auth_tag
      FROM gmail_accounts WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Account not found' });

    const { email, encrypted_password, iv, auth_tag } = rows[0];
    const password = decrypt({ ciphertext: encrypted_password, iv, authTag: auth_tag });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: email, pass: password },
    });

    await transporter.verify();
    res.json({ success: true, message: 'Connection verified successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: `Connection failed: ${err.message}` });
  }
});

module.exports = router;
