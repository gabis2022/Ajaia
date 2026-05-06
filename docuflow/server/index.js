const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
}
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/documents/:documentId/shares', require('./routes/shares'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`DocuFlow server on http://localhost:${PORT}`));
}
