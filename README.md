# DocuFlow

A lightweight collaborative document editor built as a take-home assignment for Ajaia LLC.

**Live demo:** https://ajaia-production-9b47.up.railway.app

---

## What it does

- Create, rename, and delete documents
- Rich-text editing: bold, italic, underline, H1/H2 headings, bullet lists, numbered lists
- Auto-saves every 2 seconds with a visible status indicator
- Upload a `.txt` or `.md` file to turn it into an editable document
- Share documents with other users by email — shared docs appear in a separate sidebar section
- Documents persist across server restarts

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 5 |
| Editor | TipTap (ProseMirror-based) |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (localStorage) |
| Deployment | Railway |

---

## Local setup

### Prerequisites
- Node.js 18 or higher
- npm

### 1. Clone the repo

```bash
git clone https://github.com/gabas2022/Ajaia.git
cd Ajaia/docuflow
```

### 2. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start the server

```bash
cd server
npm start
# API running on http://localhost:3001
```

### 4. Start the client

Open a second terminal:

```bash
cd client
npm run dev
# App running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Test credentials

| Email | Password |
|---|---|
| alice@test.com | password123 |
| bob@test.com | password123 |

Both accounts are seeded automatically when the server starts for the first time. No registration needed.

---

## Testing the sharing flow

1. Log in as **alice@test.com**
2. Create a document and click **Share**
3. Enter `bob@test.com` and click Share
4. Log out, log in as **bob@test.com**
5. Alice's document appears under **Shared with me** in the sidebar

---

## File upload

- Supported formats: `.txt` and `.md` only
- Maximum size: 2MB
- Uploading creates a new document pre-filled with the file contents
- Unsupported file types and oversized files show a clear error in the UI

---

## Running tests

```bash
cd server
npm test
```

6 integration tests covering the share endpoint: auth enforcement, happy path, duplicate share, missing email, unknown user, and listing shares.

---

## Project structure

```
docuflow/
  client/                  React + Vite frontend
    src/
      api.js               Fetch wrapper with auth headers
      App.jsx              Root component and state
      components/
        Login.jsx          Login form
        Sidebar.jsx        Document list + file upload
        Editor.jsx         TipTap editor + toolbar + auto-save
        SharePanel.jsx     Share modal
  server/                  Express API
    db/schema.js           SQLite setup and user seeding
    middleware/auth.js     JWT verification
    routes/auth.js         POST /api/auth/login
    routes/documents.js    Document CRUD + file upload
    routes/shares.js       Share management
    tests/share.test.js    Integration tests
    index.js               App entry point
  README.md
  ARCHITECTURE.md          Technical decisions and tradeoffs
  AI_WORKFLOW.md           How AI tools were used
  SUBMISSION.md            Deliverables checklist
```

---

## Environment variables (production)

| Variable | Description |
|---|---|
| `NODE_ENV` | Set to `production` to serve the built client from Express |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string |
| `PORT` | Port to listen on (Railway sets this automatically) |
