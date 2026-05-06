# Architecture Notes

## What I prioritized and why

### Editor-first depth over breadth
TipTap was chosen because it wraps ProseMirror behind a clean React API and ships StarterKit with everything needed (bold, italic, headings, lists) in a single bundle. Adding Underline required only one extra extension. This let me spend time on the editing UX rather than editor wiring.

### SQLite over Postgres
For a single-reviewer demo, `better-sqlite3` gives zero-config persistence — no Docker, no connection strings, no migration tooling. The synchronous API also simplifies Express route handlers (no async/await noise in CRUD paths). The schema is simple enough that switching to Postgres later would be a one-file change.

### JWT in localStorage vs cookies
Simpler for a demo with two hardcoded users. In production I'd use HttpOnly cookies to prevent XSS token theft.

### Vite proxy to avoid CORS
Rather than open-ended CORS on the server, the Vite dev server proxies `/api/*` to `localhost:3001`. This is the standard production pattern too — a reverse proxy (nginx/Caddy) in front of both services.

### Auto-save with debounce (2s)
TipTap's `onUpdate` fires on every keystroke. A 2-second debounce keeps the server call rate low while still feeling responsive. A loading flag (`isLoadingContent`) prevents the debounce from firing when we programmatically set content on document load.

## What I cut and why

| Cut | Reason |
|-----|--------|
| Registration flow | Two seeded accounts cover the sharing demo without adding auth complexity |
| Role-based permissions | Owner vs collaborator distinction is clear; full RBAC would require a permissions table and UI that doesn't fit the timebox |
| Real-time collab (WebSockets) | Out of scope for 4-6 hours; auto-save gives "last writer wins" which is sufficient for a demo |
| Export to PDF | Nice stretch goal, deprioritized to ship solid core |
| Conflict resolution / versioning | No version history; last save wins |

## File structure

```
docuflow/
  server/
    db/schema.js          SQLite setup + seeding
    middleware/auth.js    JWT verification
    routes/auth.js        POST /api/auth/login
    routes/documents.js   CRUD + file upload
    routes/shares.js      Share management (nested under documents/:id)
    tests/share.test.js   node:test integration tests
    index.js              Express app + error handler
  client/
    src/
      api.js              Fetch wrapper with auth headers
      App.jsx             Root: auth gate, doc list, active doc state
      components/
        Login.jsx         Login form with demo account buttons
        Sidebar.jsx       Doc list (owned + shared), upload button
        Editor.jsx        TipTap editor, toolbar, auto-save, title rename
        SharePanel.jsx    Share modal: add/remove collaborators
    vite.config.js        Proxy /api → localhost:3001
```
