# AI Workflow Note

## Tools used
- **Claude Code (claude-sonnet-4-6)** — primary implementation tool, used via the Claude Code CLI/IDE extension

## Where AI materially sped up work

**Scaffolding in parallel.** The full directory structure, server routes, and React components were written simultaneously across multiple tool calls rather than sequentially. Manually typing 15+ files in sequence would have consumed a large chunk of the timebox. AI collapsed this to minutes.

**TipTap integration.** TipTap's API has a few sharp edges (the `isLoadingContent` flag to suppress auto-save during `setContent`, `onMouseDown` instead of `onClick` on toolbar buttons to prevent focus loss, `mergeParams: true` on nested Express routers). AI recalled these patterns without needing to re-read the docs.

**Test scaffolding.** Writing a node:test integration test that spins up an `http.createServer(app)` on a random port and tears it down cleanly is boilerplate I would normally look up. AI produced it from a description.

## What I changed or rejected from AI output

- **Removed `cursor: not-allowed` on all disabled states** — AI initially applied it everywhere including non-interactive elements. Trimmed to buttons only.
- **Switched toolbar handlers from `onClick` to `onMouseDown`** — AI's first draft used `onClick`, which steals focus from the editor before the command fires. Corrected to `onMouseDown` + `e.preventDefault()`.
- **Tightened the CORS origin list** — AI defaulted to `origin: '*'`. Changed to an explicit allowlist of the dev ports.
- **Rejected a `useCallback` over-wrap** — AI initially wrapped every handler in `useCallback` regardless of need. Removed the ones with no meaningful dependency array to keep the code readable.

## How I verified correctness

1. **`npm test`** — 6/6 integration tests green on the share endpoint covering auth enforcement, happy path, duplicate, 404, and list.
2. **`npm run build`** — Vite production build with zero errors or type warnings confirmed no broken imports.
3. **Manual walkthrough** — Started both dev servers, logged in as alice, created a document, typed formatted content, uploaded a .txt file, shared with bob, logged in as bob, verified the shared doc appeared, edited it, and confirmed auto-save fired.
4. **Edge cases tested manually** — empty document state, wrong file extension (rejected with UI error), file over 2MB (rejected), sharing with self (rejected), sharing with unknown email (404 error in panel).
