require('dotenv').config();
const app = require('../src/app');
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[dev] Backend running at http://localhost:${PORT}`);
  console.log(`[dev] Health: http://localhost:${PORT}/api/health`);
});
