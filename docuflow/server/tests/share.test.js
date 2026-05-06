const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const app = require('../index');
const db = require('../db/schema');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'docuflow_secret_dev';

let server;
let baseUrl;
let aliceToken;
let aliceId;
let docId;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Share endpoint', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, resolve);
    });
    const { port } = server.address();
    baseUrl = `http://localhost:${port}`;

    const alice = db.prepare('SELECT * FROM users WHERE email = ?').get('alice@test.com');
    aliceId = alice.id;
    aliceToken = jwt.sign({ id: alice.id, email: alice.email }, JWT_SECRET);

    const result = db.prepare(
      'INSERT INTO documents (owner_id, title, content) VALUES (?, ?, ?)'
    ).run(aliceId, 'Share Test Doc', '{}');
    docId = result.lastInsertRowid;
  });

  after(async () => {
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
    await new Promise((resolve) => server.close(resolve));
  });

  it('returns 401 without auth token', async () => {
    const { status } = await request('POST', `/api/documents/${docId}/shares`, { email: 'bob@test.com' });
    assert.equal(status, 401);
  });

  it('returns 400 when email is missing', async () => {
    const { status } = await request('POST', `/api/documents/${docId}/shares`, {}, aliceToken);
    assert.equal(status, 400);
  });

  it('shares a document successfully', async () => {
    const { status, body } = await request('POST', `/api/documents/${docId}/shares`, { email: 'bob@test.com' }, aliceToken);
    assert.equal(status, 201);
    assert.equal(body.sharedWith.email, 'bob@test.com');
  });

  it('returns 400 when sharing with same user again', async () => {
    const { status, body } = await request('POST', `/api/documents/${docId}/shares`, { email: 'bob@test.com' }, aliceToken);
    assert.equal(status, 400);
    assert.ok(body.error.includes('already shared'));
  });

  it('lists shares for a document', async () => {
    const { status, body } = await request('GET', `/api/documents/${docId}/shares`, null, aliceToken);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.some((s) => s.email === 'bob@test.com'));
  });

  it('returns 404 for unknown user email', async () => {
    const { status } = await request('POST', `/api/documents/${docId}/shares`, { email: 'nobody@test.com' }, aliceToken);
    assert.equal(status, 404);
  });
});
