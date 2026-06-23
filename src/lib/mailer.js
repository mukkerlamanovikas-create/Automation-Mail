const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Neon's HTTP driver returns BYTEA as a hex string (\x89504e47...) not a Buffer
function toBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (typeof data === 'string') {
    if (data.startsWith('\\x')) return Buffer.from(data.slice(2), 'hex');
    return Buffer.from(data, 'base64'); // fallback
  }
  return Buffer.from(data);
}

const MIME_MAP = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
};

function mimeType(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function personalise(template, name, email) {
  return template
    .replace(/\{\{name\}\}/gi, name || email)
    .replace(/\{\{email\}\}/gi, email);
}

function toHtml(text) {
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;line-height:1.6">${
    text.split('\n').map(l => `<p style="margin:0 0 8px">${l || '&nbsp;'}</p>`).join('')
  }</div>`;
}

function createTransporter(fromEmail, fromPassword) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: fromEmail, pass: fromPassword },
  });
}

async function sendMail({ fromEmail, fromLabel, fromPassword, to, toName, subject, bodyTemplate, pdfBuffer, pdfFilename, transporter }) {
  if (!EMAIL_RE.test(fromEmail)) throw new Error('Invalid sender email');
  if (!EMAIL_RE.test(to)) throw new Error(`Invalid recipient email: ${to}`);

  const text = personalise(bodyTemplate, toName, to);
  const html = toHtml(text);

  if (!transporter) transporter = createTransporter(fromEmail, fromPassword);

  const mailOptions = {
    from: `"${fromLabel || 'Email Automation'}" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  };

  if (pdfBuffer && pdfFilename) {
    mailOptions.attachments = [{
      filename: pdfFilename,
      content: toBuffer(pdfBuffer),
      contentType: mimeType(pdfFilename),
    }];
  }

  await transporter.sendMail(mailOptions);
}

module.exports = { sendMail, createTransporter };
