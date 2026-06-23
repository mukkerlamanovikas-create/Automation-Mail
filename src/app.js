const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const gmailAccountsRoutes = require('./routes/gmailAccounts');
const templatesRoutes = require('./routes/templates');
const campaignsRoutes = require('./routes/campaigns');
const dashboardRoutes = require('./routes/dashboard');
const workerRoutes = require('./routes/worker');

const app = express();

app.use(cors({ origin: process.env.APP_URL || true }));
app.use(express.json({ limit: '10mb' })); // 10mb for base64 PDF payloads
app.use((req, _res, next) => { console.log('[req]', req.method, req.path); next(); });

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/gmail-accounts', gmailAccountsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/worker', workerRoutes);

app.use(errorHandler);

module.exports = app;
