const express = require('express');
const db = require('../db/schema');
const requireAuth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const shares = db.prepare(`
    SELECT u.id, u.email FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(req.params.documentId);

  res.json(shares);
});

router.post('/', (req, res) => {
  const { documentId } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can share' });

  const target = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  try {
    db.prepare('INSERT INTO document_shares (document_id, shared_with_id) VALUES (?, ?)').run(documentId, target.id);
    res.status(201).json({ success: true, sharedWith: { id: target.id, email: target.email } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Document already shared with this user' });
    }
    throw err;
  }
});

router.delete('/:userId', (req, res) => {
  const { documentId, userId } = req.params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?').run(documentId, userId);
  res.json({ success: true });
});

module.exports = router;
