// Local development server — wraps the Vercel serverless handler in Express
const express = require('express');
const cors = require('cors');
const handler = require('./api/send-email');

const app = express();

app.use(cors());
// 50 MB limit to accommodate base64-encoded PDFs during local dev
app.use(express.json({ limit: '50mb' }));

app.post('/api/send-email', handler);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[backend] Local dev server running at http://localhost:${PORT}`);
  console.log(`[backend] POST http://localhost:${PORT}/api/send-email`);
});
