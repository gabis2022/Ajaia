# DocuFlow

A lightweight collaborative document editor with rich-text editing, file upload, and document sharing.

## Stack

- **Frontend**: React 18 + Vite 5, TipTap editor
- **Backend**: Express + better-sqlite3
- **Auth**: JWT (stored in localStorage)
- **Database**: SQLite (`server/docuflow.db`, auto-created)

## Setup & Run

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the server (terminal 1)

```bash
cd server
npm start
# Running on http://localhost:3001
```

### 3. Start the client (terminal 2)

```bash
cd client
npm run dev
# Running on http://localhost:5173
```

Open http://localhost:5173.

## Test Credentials

| Email | Password |
|-------|----------|
| alice@test.com | password123 |
| bob@test.com | password123 |

Both accounts are seeded automatically on first server start.

## Running Tests

```bash
cd server
npm test
```

Tests cover the share endpoint: auth enforcement, share creation, duplicate handling, and listing.

## File Upload

- Supported types: `.txt`, `.md` only
- Maximum size: 2MB
- Uploads create a new document in the sidebar

## Sharing Flow

1. Open a document you own
2. Click **Share** in the header
3. Enter `bob@test.com` (or any seeded user's email)
4. The document appears in Bob's **Shared with me** sidebar section
5. Bob can read and edit; only Alice can manage shares or delete

## Architecture Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md).
