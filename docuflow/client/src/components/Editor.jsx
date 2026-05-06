import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { api } from '../api';
import SharePanel from './SharePanel';

export default function Editor({ docId, user, onDocsChange }) {
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showShare, setShowShare] = useState(false);
  const [loadError, setLoadError] = useState('');
  const saveTimer = useRef(null);
  const isLoadingContent = useRef(false);

  const saveContent = useCallback(async (content) => {
    try {
      await api.updateDocument(docId, { content: JSON.stringify(content) });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [docId]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    onUpdate: ({ editor }) => {
      if (isLoadingContent.current) return;
      setSaveStatus('saving');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveContent(editor.getJSON()), 2000);
    },
  });

  useEffect(() => {
    async function loadDoc() {
      setLoadError('');
      try {
        const d = await api.getDocument(docId);
        setDoc(d);
        setTitle(d.title);
        if (editor) {
          isLoadingContent.current = true;
          try {
            const content = typeof d.content === 'string' ? JSON.parse(d.content) : d.content;
            editor.commands.setContent(content || { type: 'doc', content: [{ type: 'paragraph' }] });
          } catch {
            editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
          } finally {
            isLoadingContent.current = false;
          }
          setSaveStatus('saved');
        }
      } catch (e) {
        setLoadError(e.message || 'Failed to load document');
      }
    }
    if (editor) loadDoc();
    return () => clearTimeout(saveTimer.current);
  }, [docId, editor]);

  async function handleTitleBlur() {
    if (!title.trim() || title === doc?.title) return;
    try {
      await api.updateDocument(docId, { title: title.trim() });
      setDoc((d) => ({ ...d, title: title.trim() }));
      onDocsChange();
    } catch {}
  }

  const isOwner = doc?.owner_id === user.id;

  if (loadError) {
    return (
      <div className="editor-container">
        <div className="empty-state">
          <p style={{ color: '#d73a49' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!doc || !editor) {
    return (
      <div className="editor-container">
        <div className="empty-state"><p style={{ color: '#6a737d' }}>Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <input
          className="doc-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          placeholder="Untitled Document"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isOwner && (
            <span style={{ fontSize: 12, color: '#6a737d', background: '#e8f0fe', padding: '4px 10px', borderRadius: 12 }}>
              Shared by {doc.owner_email || 'someone'}
            </span>
          )}
          {isOwner && (
            <button className="share-btn" onClick={() => setShowShare(true)}>Share</button>
          )}
        </div>
      </div>

      <div className="editor-toolbar">
        <ToolbarBtn editor={editor} action="toggleBold" mark="bold" label={<strong>B</strong>} title="Bold (Ctrl+B)" />
        <ToolbarBtn editor={editor} action="toggleItalic" mark="italic" label={<em>I</em>} title="Italic (Ctrl+I)" />
        <ToolbarBtn
          editor={editor}
          action="toggleUnderline"
          mark="underline"
          label={<span style={{ textDecoration: 'underline' }}>U</span>}
          title="Underline (Ctrl+U)"
        />
        <span className="toolbar-sep" />
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
          title="Heading 1"
        >H1</button>
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          title="Heading 2"
        >H2</button>
        <span className="toolbar-sep" />
        <button
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          title="Bullet list"
        >• List</button>
        <button
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          title="Numbered list"
        >1. List</button>

        <span
          className={`save-status ${saveStatus}`}
          style={{ marginLeft: 'auto' }}
        >
          {saveStatus === 'saving' && '● Saving…'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && '⚠ Save failed'}
        </span>
      </div>

      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>

      {showShare && <SharePanel docId={docId} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function ToolbarBtn({ editor, action, mark, label, title }) {
  return (
    <button
      className={`toolbar-btn ${editor.isActive(mark) ? 'active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus()[action]().run(); }}
      title={title}
    >
      {label}
    </button>
  );
}
