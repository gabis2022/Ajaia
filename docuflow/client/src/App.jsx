import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [documents, setDocuments] = useState({ owned: [], shared: [] });
  const [activeDocId, setActiveDocId] = useState(null);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  }, []);

  useEffect(() => {
    if (user) loadDocuments();
  }, [user, loadDocuments]);

  function handleLogin(loggedUser, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActiveDocId(null);
    setDocuments({ owned: [], shared: [] });
  }

  async function handleNewDoc() {
    try {
      const doc = await api.createDocument('Untitled Document');
      await loadDocuments();
      setActiveDocId(doc.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteDoc(id) {
    try {
      await api.deleteDocument(id);
      if (activeDocId === id) setActiveDocId(null);
      await loadDocuments();
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <Sidebar
        user={user}
        documents={documents}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onNewDoc={handleNewDoc}
        onDeleteDoc={handleDeleteDoc}
        onDocsChange={loadDocuments}
        onLogout={handleLogout}
      />
      <main className="editor-area">
        {activeDocId ? (
          <Editor
            key={activeDocId}
            docId={activeDocId}
            user={user}
            onDocsChange={loadDocuments}
          />
        ) : (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c8ccd0" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h2>No document selected</h2>
            <p>Create a new document or select one from the sidebar.</p>
            <button className="btn-primary" style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }} onClick={handleNewDoc}>
              New Document
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
