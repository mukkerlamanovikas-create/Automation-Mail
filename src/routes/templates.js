const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/templates
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const templates = await sql`
      SELECT id, name, subject, pdf_filename, is_default, created_at, updated_at
      FROM email_templates
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
    `;
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
});

// POST /api/templates
router.post('/', async (req, res, next) => {
  try {
    const { name, subject, body, pdf_data, pdf_filename } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ success: false, error: 'name, subject, and body are required' });
    }

    const pdfBuffer = pdf_data ? Buffer.from(pdf_data, 'base64') : null;
    const sql = getDb();
    const rows = await sql`
      INSERT INTO email_templates (user_id, name, subject, body, pdf_data, pdf_filename)
      VALUES (${req.user.id}, ${name}, ${subject}, ${body}, ${pdfBuffer}, ${pdf_filename || null})
      RETURNING id, name, subject, pdf_filename, is_default, created_at, updated_at
    `;
    res.status(201).json({ success: true, template: rows[0] });
  } catch (err) { next(err); }
});

// GET /api/templates/:id  (includes pdf_data as base64)
router.get('/:id', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, subject, body, pdf_data, pdf_filename, is_default, created_at, updated_at
      FROM email_templates WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Template not found' });

    const t = rows[0];
    res.json({
      success: true,
      data: {
        ...t,
        pdf_data: t.pdf_data ? Buffer.from(t.pdf_data).toString('base64') : null,
      },
    });
  } catch (err) { next(err); }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res, next) => {
  try {
    const sql = getDb();
    const exists = await sql`SELECT id FROM email_templates WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    if (!exists[0]) return res.status(404).json({ success: false, error: 'Template not found' });

    const { name, subject, body, pdf_data, pdf_filename } = req.body;
    const pdfBuffer = pdf_data ? Buffer.from(pdf_data, 'base64') : null;

    const rows = await sql`
      UPDATE email_templates
      SET name = ${name}, subject = ${subject}, body = ${body},
          pdf_data = ${pdfBuffer}, pdf_filename = ${pdf_filename || null},
          updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING id, name, subject, pdf_filename, is_default, created_at, updated_at
    `;
    res.json({ success: true, template: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`DELETE FROM email_templates WHERE id = ${req.params.id} AND user_id = ${req.user.id} RETURNING id`;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/templates/:id/duplicate
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO email_templates (user_id, name, subject, body, pdf_data, pdf_filename)
      SELECT user_id, 'Copy of ' || name, subject, body, pdf_data, pdf_filename
      FROM email_templates WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING id, name, subject, pdf_filename, is_default, created_at, updated_at
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Template not found' });
    res.status(201).json({ success: true, template: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/templates/:id/set-default
router.put('/:id/set-default', async (req, res, next) => {
  try {
    const sql = getDb();
    const exists = await sql`SELECT id FROM email_templates WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    if (!exists[0]) return res.status(404).json({ success: false, error: 'Template not found' });

    await sql`UPDATE email_templates SET is_default = FALSE WHERE user_id = ${req.user.id}`;
    await sql`UPDATE email_templates SET is_default = TRUE WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
