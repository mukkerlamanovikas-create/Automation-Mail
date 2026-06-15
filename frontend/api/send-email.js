const nodemailer = require('nodemailer');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    gmailEmail,
    gmailPassword,
    to,
    toName,
    subject,
    bodyTemplate,
    pdfBase64,
    pdfFileName,
  } = req.body || {};

  // --- Validation ---
  if (!gmailEmail || !gmailPassword || !to || !subject || !bodyTemplate) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: gmailEmail, gmailPassword, to, subject, bodyTemplate',
    });
  }

  if (!EMAIL_RE.test(gmailEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid sender email address' });
  }

  if (!EMAIL_RE.test(to)) {
    return res.status(400).json({ success: false, error: `Invalid recipient email: ${to}` });
  }

  // Reject oversized PDFs (base64 ~33% overhead; keep raw < 3 MB)
  if (pdfBase64 && pdfBase64.length > 4_000_000) {
    return res.status(413).json({
      success: false,
      error: 'PDF attachment is too large (max ~3 MB). Vercel free tier limits request payload to 4.5 MB.',
    });
  }

  // --- Build personalised body ---
  const personalised = bodyTemplate
    .replace(/\{\{name\}\}/gi, toName || to)
    .replace(/\{\{email\}\}/gi, to);

  const htmlBody = personalised
    .split('\n')
    .map(line => `<p style="margin:0 0 8px">${line || '&nbsp;'}</p>`)
    .join('');

  // --- Nodemailer ---
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    const mailOptions = {
      from: `"Email Automation" <${gmailEmail}>`,
      to,
      subject,
      text: personalised,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;line-height:1.6">${htmlBody}</div>`,
    };

    if (pdfBase64 && pdfFileName) {
      mailOptions.attachments = [
        {
          filename: pdfFileName,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Email sent to ${to}`,
    });
  } catch (err) {
    console.error('[send-email] Nodemailer error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
