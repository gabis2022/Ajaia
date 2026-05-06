const express = require('express');
const multer = require('multer');
const db = require('../db/schema');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.use(requireAuth);

router.get('/', (req, res) => {
  const owned = db.prepare(`
    SELECT d.*, 'owned' as relationship
    FROM documents d WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  const shared = db.prepare(`
    SELECT d.*, 'shared' as relationship, u.email as owner_email
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ owned, shared });
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['txt', 'md'].includes(ext)) {
    return res.status(400).json({ error: 'Only .txt and .md files are supported' });
  }

  const text = req.file.buffer.toString('utf8');
  const lines = text.split('\n');
  const content = {
    type: 'doc',
    content: lines.map(line => ({
      type: 'paragraph',
      content: line.trim() ? [{ type: 'text', text: line }] : [],
    })),
  };

  const title = req.file.originalname.replace(/\.(txt|md)$/i, '');
  const result = db.prepare(
    'INSERT INTO documents (owner_id, title, content) VALUES (?, ?, ?)'
  ).run(req.user.id, title, JSON.stringify(content));

  res.status(201).json(db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid));
});

router.get('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const hasAccess = doc.owner_id === req.user.id ||
    db.prepare('SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with_id = ?')
      .get(req.params.id, req.user.id);

  if (!hasAccess) return res.status(403).json({ error: 'Forbidden' });
  res.json(doc);
});

router.post('/', (req, res) => {
  const { title = 'Untitled Document', content = '{"type":"doc","content":[{"type":"paragraph"}]}' } = req.body;
  const result = db.prepare(
    'INSERT INTO documents (owner_id, title, content) VALUES (?, ?, ?)'
  ).run(req.user.id, title, content);
  res.status(201).json(db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const canEdit = doc.owner_id === req.user.id ||
    db.prepare('SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with_id = ?')
      .get(req.params.id, req.user.id);
  if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

  const { title, content } = req.body;
  const updates = [];
  const values = [];
  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (content !== undefined) { updates.push('content = ?'); values.push(content); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
