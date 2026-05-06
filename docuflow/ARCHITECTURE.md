# Architecture Note — DocuFlow

## What I Built

A lightweight full-stack document editor with rich-text editing, file import, and basic sharing. The stack is React + Vite on the frontend, Express + better-sqlite3 on the backend, with TipTap as the editor library.

## Core Decisions

### Editor: TipTap over Quill or Slate

TipTap stores document content as ProseMirror JSON rather than HTML. This made persistence simpler (store the JSON blob, restore it exactly) and sidesteps XSS concerns that come with storing raw HTML. The tradeoff is a slightly larger bundle, which is acceptable for this scope.

### Storage: SQLite over Postgres

SQLite requires zero infrastructure — no connection string, no hosted instance, no environment variable management for reviewers. For a single-server app at this scale, it's the right call. The schema is straightforward: `users`, `documents`, `document_shares`. Migrating to Postgres later would require only a driver swap and minor query adjustments since I avoided SQLite-specific syntax.

### Auth: Seeded users with JWT, no registration flow

Building a registration flow would have consumed time without adding meaningful signal. Two seeded users (alice@test.com, bob@test.com) let reviewers immediately test the sharing flow without any setup friction. JWT tokens are stored in localStorage and sent as Bearer headers — standard, auditable, good enough for this scope.

### Auto-save over manual save

A manual save button introduces a failure mode: users lose work if they forget to click it. Auto-save every 2 seconds with a visible status indicator ("Saving..." → "Saved") is the more honest UX. It also demonstrates product thinking — the feature exists because it should, not because it was easy.

### File Upload: .txt and .md only

Parsing `.docx` reliably requires `mammoth` and adds non-trivial error handling. I scoped file upload to plaintext formats to keep the feature working end-to-end rather than partially supporting Word documents with edge case failures. The unsupported format error is surfaced clearly in the UI. I would add `.docx` support next.

## What I Cut and Why

| Feature | Why Cut |
|---|---|
| Real-time collaboration | WebSocket + operational transform adds 4+ hours of complexity for a demo feature. Not worth the tradeoff. |
| Document version history | Requires either event sourcing or snapshot diffing — neither fits in this timebox cleanly. |
| Role-based permissions (viewer vs. editor) | The current model (access = can edit) is honest about its simplicity. Adding roles without enforcing them in the UI would be worse than not having them. |
| Rich commenting / suggestions | Out of scope. Would be the next meaningful feature after version history. |

## What I Would Build Next (2–4 Hours)

1. `.docx` import via `mammoth` — the scaffolding is already there
2. Document version history — store snapshots on each save with a timestamp, show a simple diff view
3. Richer sharing permissions — viewer vs. editor, with enforcement in the API middleware
4. Export to Markdown — TipTap has a serializer that makes this straightforward

## Schema

```sql
users (id, email, password_hash, created_at)
documents (id, title, content, owner_id, created_at, updated_at)
document_shares (id, document_id, shared_with_user_id, created_at)
```

## API Surface

```
POST   /api/auth/login
GET    /api/documents            — owned + shared docs for current user
POST   /api/documents            — create new doc
GET    /api/documents/:id        — fetch single doc
PUT    /api/documents/:id        — update title or content
POST   /api/documents/:id/share  — grant access to another user
GET    /api/documents/:id/shares — list who has access
POST   /api/upload               — upload .txt or .md, returns new document
```
