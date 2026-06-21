const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function sendMail({ fromEmail, fromPassword, to, toName, subject, bodyTemplate, pdfBuffer, pdfFilename }) {
  if (!EMAIL_RE.test(fromEmail)) throw new Error('Invalid sender email');
  if (!EMAIL_RE.test(to)) throw new Error(`Invalid recipient email: ${to}`);

  const text = personalise(bodyTemplate, toName, to);
  const html = toHtml(text);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: fromEmail, pass: fromPassword },
  });

  const mailOptions = {
    from: `"Email Automation" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  };

  if (pdfBuffer && pdfFilename) {
    mailOptions.attachments = [{
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];
  }

  await transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
