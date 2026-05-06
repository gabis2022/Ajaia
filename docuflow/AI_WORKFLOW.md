# AI Workflow Note — DocuFlow

## Tools Used

- **Claude Code** — primary scaffolding, backend routes, database schema, test file
- **Claude.ai (claude.ai chat)** — architecture planning, tradeoff reasoning, document drafting
- **GitHub Copilot** — inline autocomplete throughout, especially for repetitive Express boilerplate

## Where AI Materially Sped Up My Work

**Scaffolding the project structure (saved ~30 min)**
Claude Code generated the full directory structure, Express boilerplate, SQLite initialization, and seeded user logic in one pass. I reviewed the output before running it — the structure was sound and I used it as-is.

**TipTap integration (saved ~20 min)**
I asked Claude to wire up TipTap with the specific extensions I needed (Bold, Italic, Underline, Heading, BulletList, OrderedList). The initial output worked. I adjusted the toolbar styling to match the rest of the UI, which Claude didn't have context on.

**JWT middleware (saved ~15 min)**
The auth middleware skeleton was correct on the first pass. I verified it by reading through the logic manually — token extraction from the Authorization header, error responses, attaching the user to req.user. No changes needed.

## Where I Changed or Rejected AI Output

**The sharing endpoint returned the wrong shape**
Claude generated a POST /api/documents/:id/share endpoint that returned `{ success: true }` with no document or share metadata. I changed this to return the full share record including the recipient's email, because the frontend needed to immediately display who had been granted access without a second round-trip. This was a product judgment call, not a bug — the AI output was technically functional but not useful.

**Auto-save debounce was missing**
The initial TipTap onUpdate handler called the save API on every keystroke with no debounce. I caught this by reading the code before running it. Hammering the API on every character would have caused visible lag and unnecessary writes. I added a 2-second debounce, which is the behavior I described in the spec.

**The empty state UI was a blank div**
Claude generated an empty document list as a `<div></div>` with no content. I replaced it with an actual empty state message explaining what to do. Small thing, but empty screens are a product quality signal.

**The test coverage was shallow**
The generated test file tested only the happy path for the share endpoint. I added a test for the case where the target email doesn't exist (should return 404) and a test for sharing a document you don't own (should return 403). These are the cases that matter in production.

## How I Verified Correctness and Reliability

- Read every generated file before running it — I didn't execute any AI output blind
- Tested the full sharing flow manually end-to-end: logged in as Alice, created a doc, shared it with Bob, logged in as Bob, confirmed it appeared under "Shared with me"
- Ran the test suite and confirmed all tests passed
- Checked that documents persisted across a server restart by stopping and restarting the server mid-session
- Validated file upload rejection by attempting to upload a .pdf and confirming the error appeared correctly in the UI

## Honest Assessment

AI handled the structural and boilerplate work well. It was weakest on product details — the places where the right answer depends on UX intent rather than code correctness. Those gaps (the sharing response shape, the debounce, the empty state) are exactly where I added the most value. The AI got me to a working skeleton faster; I made it a coherent product.
