# Submission

## What's included

| File / Folder | Description |
|---|---|
| `server/` | Express API with SQLite persistence |
| `client/` | React + Vite frontend with TipTap editor |
| `README.md` | Setup instructions and test credentials |
| `ARCHITECTURE.md` | Prioritization decisions and tradeoffs |
| `AI_WORKFLOW.md` | AI tool usage and verification approach |
| `SUBMISSION.md` | This file |

## Live deployment
**https://ajaia-production-9b47.up.railway.app**

## Test credentials

| Email | Password |
|---|---|
| alice@test.com | password123 |
| bob@test.com | password123 |

## What is working

- Login with seeded users, JWT auth, 401 on unauthenticated requests
- Create, rename, and delete documents (owner only)
- TipTap rich-text editor: bold, italic, underline, H1, H2, bullet list, numbered list
- Auto-save every 2 seconds with visible Saving → Saved status indicator
- SQLite persistence — documents survive server restart
- File upload: `.txt` and `.md` only, 2MB limit, file-type and size errors shown in UI
- Sharing: owner shares via email, shared docs appear in recipient's "Shared with me" sidebar section with a badge
- Owner sees who they've shared with and can remove access
- Shared users can edit documents
- Empty state UI when no documents exist
- 6/6 integration tests pass on the share endpoint

## What is incomplete / would build next

- **Walkthrough video** — link to be added after recording
- **Document version history** — would store snapshots in a `document_versions` table on each save
- **Real-time collaboration** — would add Socket.IO with a shared document state broadcast
- **Export to Markdown/PDF** — TipTap has a Markdown serializer; PDF would use a headless browser
