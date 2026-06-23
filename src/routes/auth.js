const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const sql = getDb();
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    if (existing[0]) return res.status(409).json({ success: false, error: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`INSERT INTO users (email, password_hash) VALUES (${email.toLowerCase().trim()}, ${hash}) RETURNING id, email`;
    const user = rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token, user: { id: user.id, email: user.email } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });

    const sql = getDb();
    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, email: req.user.email } });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'current_password and new_password are required' });
    if (new_password.length < 8) return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });

    const sql = getDb();
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${req.user.id}`;
    if (!rows[0] || !(await bcrypt.compare(current_password, rows[0].password_hash))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${req.user.id}`;
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const sql = getDb();
    const rows = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;

    // Always return success to prevent email enumeration
    if (!rows[0]) return res.json({ success: true, message: 'If this email exists, a reset link was sent' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${rows[0].id}, ${tokenHash}, ${expiresAt})
    `;

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SYSTEM_EMAIL_FROM, pass: process.env.SYSTEM_EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Mail Automation" <${process.env.SYSTEM_EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click below to set a new password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
    });

    res.json({ success: true, message: 'If this email exists, a reset link was sent' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'token and password are required' });
    if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;

    const record = rows[0];
    if (!record || record.used || new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
    }

    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${record.user_id}`;
    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${record.id}`;

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
