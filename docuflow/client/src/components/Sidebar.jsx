import { useRef, useState } from 'react';
import { api } from '../api';

export default function Sidebar({ user, documents, activeDocId, onSelectDoc, onNewDoc, onDeleteDoc, onDocsChange, onLogout }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md'].includes(ext)) {
      setUploadError('Only .txt and .md files are supported');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File exceeds the 2MB limit');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const doc = await api.uploadFile(file);
      await onDocsChange();
      onSelectDoc(doc.id);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const allDocs = [...(documents.owned || []), ...(documents.shared || [])];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>DocuFlow</h1>
        <span className="user-email">{user.email}</span>
      </div>

      <div className="sidebar-actions">
        <button className="btn-primary" onClick={onNewDoc}>+ New Document</button>
        <button
          className="btn-secondary upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : '↑ Upload .txt / .md'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {uploadError && <p className="error-msg" style={{ fontSize: 12 }}>{uploadError}</p>}
      </div>

      <div className="sidebar-docs">
        {documents.owned?.length > 0 && (
          <>
            <p className="doc-section-title">My Documents</p>
            {documents.owned.map((doc) => (
              <DocItem
                key={doc.id}
                doc={doc}
                active={activeDocId === doc.id}
                onSelect={() => onSelectDoc(doc.id)}
                onDelete={() => onDeleteDoc(doc.id)}
                isOwned
              />
            ))}
          </>
        )}

        {documents.shared?.length > 0 && (
          <>
            <p className="doc-section-title" style={{ marginTop: 12 }}>Shared with me</p>
            {documents.shared.map((doc) => (
              <DocItem
                key={doc.id}
                doc={doc}
                active={activeDocId === doc.id}
                onSelect={() => onSelectDoc(doc.id)}
                isOwned={false}
              />
            ))}
          </>
        )}

        {allDocs.length === 0 && (
          <p style={{ padding: '16px', fontSize: 13, color: '#6a737d' }}>
            No documents yet. Create one to get started.
          </p>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  );
}

function DocItem({ doc, active, onSelect, onDelete, isOwned }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`doc-item ${active ? 'active' : ''}`}
      onClick={onSelect}
      onMouseLeave={() => setShowMenu(false)}
    >
      <span className="doc-item-title" title={doc.title}>{doc.title}</span>
      {!isOwned && <span className="badge-shared">Shared</span>}
      {isOwned && (
        <button
          className="doc-menu-btn"
          onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
          title="Options"
        >
          ⋯
        </button>
      )}
      {showMenu && (
        <div className="doc-menu" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { onDelete(); setShowMenu(false); }}>Delete</button>
        </div>
      )}
    </div>
  );
}
