import { useState, useEffect } from 'react';
import { api } from '../api';

export default function SharePanel({ docId, onClose }) {
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShares();
  }, [docId]);

  async function loadShares() {
    try {
      const data = await api.getShares(docId);
      setShares(data);
    } catch {}
  }

  async function handleShare(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { sharedWith } = await api.shareDocument(docId, email.trim());
      setEmail('');
      setSuccess(`Shared with ${sharedWith.email}`);
      loadShares();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId) {
    try {
      await api.removeShare(docId, userId);
      loadShares();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="share-panel-overlay" onClick={onClose}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Share document</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="share-input-row" onSubmit={handleShare}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="Enter email address"
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={loading || !email.trim()} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
            {loading ? '…' : 'Share'}
          </button>
        </form>

        {error && <p className="error-msg" style={{ marginBottom: 8 }}>{error}</p>}
        {success && <p style={{ color: '#2ea44f', fontSize: 13, marginBottom: 8 }}>{success}</p>}

        {shares.length > 0 && (
          <div className="share-list">
            <p className="share-list-title">Shared with</p>
            {shares.map((s) => (
              <div key={s.id} className="share-list-item">
                <span>{s.email}</span>
                <button className="remove-share-btn" onClick={() => handleRemove(s.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {shares.length === 0 && (
          <p style={{ fontSize: 13, color: '#6a737d', marginTop: 8 }}>
            Not shared with anyone yet.
          </p>
        )}
      </div>
    </div>
  );
}
