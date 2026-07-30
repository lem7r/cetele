/**
 * Çetele API — integration tests (node:test, no external deps).
 *
 * Boots the real Express app on an ephemeral port against a throwaway SQLite
 * database (seeded with the demo accounts) and exercises the HTTP endpoints.
 *
 * Run from the cetele-backend folder:
 *     npm test
 * (equivalently: node --test)
 *
 * Notes:
 *  - Uses a temp DB via CETELE_DB so your real cetele.db is never touched.
 *  - The seeded demo accounts all share the dev password "cetele".
 *  - The per-IP login limiter is global, so the rate-limit test runs LAST and
 *    seeded logins are done once and reused.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Configure a disposable, demo-seeded DB BEFORE requiring the server.
const DB = path.join(os.tmpdir(), `cetele-test-${process.pid}-${Date.now()}.db`);
process.env.CETELE_DB = DB;
process.env.SEED_DEMO = "1";
process.env.RL_SIGNUP_MAX = "1000"; // tests create many accounts; keep the login limiter at its default so its own test still fires
if (process.env.NODE_ENV === "production") delete process.env.NODE_ENV;

const { app } = require("../server.js");

let base, srv;
const tokens = {}; // reused seeded-account tokens

before(async () => {
  await new Promise((res) => { srv = app.listen(0, res); });
  base = `http://127.0.0.1:${srv.address().port}`;
  // Log the seeded accounts we reuse, once, to keep login-limiter pressure low.
  tokens.yusuf = (await api("POST", "/api/auth/login", { body: { username: "yusuf", password: "cetele" } })).body.token;
  tokens.okan = (await api("POST", "/api/auth/login", { body: { username: "okan", password: "cetele" } })).body.token;
  // pre-create a stranger account so later tests don't sign up after the login limiter is hammered
  const strangerR = await api("POST", "/api/auth/signup", { body: { username: uniq(), name: "Stranger", password: "secret123" } });
  tokens.stranger = strangerR.body.token;
});

after(async () => {
  await new Promise((res) => srv.close(res));
  for (const ext of ["", "-wal", "-shm", "-journal"]) { try { fs.unlinkSync(DB + ext); } catch {} }
});

async function api(method, p, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(base + p, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch { /* empty body */ }
  return { status: r.status, body: json };
}

const uniq = () => "t" + Math.random().toString(36).slice(2, 9);
async function signup(extra = {}) {
  const username = uniq();
  const r = await api("POST", "/api/auth/signup", { body: { username, name: "Test " + username, password: "secret123", ...extra } });
  return { username, status: r.status, body: r.body };
}

// ---------- auth ----------
test("health check responds ok", async () => {
  const r = await api("GET", "/api/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

test("signup returns a token and a recovery code", async () => {
  const r = await signup();
  assert.equal(r.status, 200);
  assert.ok(r.body.token, "token present");
  assert.ok(r.body.recoveryCode, "recovery code present");
  assert.ok(r.body.user && r.body.user.id, "user id present");
});

test("signup rejects a duplicate username", async () => {
  const username = uniq();
  await api("POST", "/api/auth/signup", { body: { username, name: "A", password: "secret123" } });
  const dup = await api("POST", "/api/auth/signup", { body: { username, name: "B", password: "secret123" } });
  assert.equal(dup.status, 409);
});

test("signup rejects a too-short password", async () => {
  const r = await api("POST", "/api/auth/signup", { body: { username: uniq(), name: "A", password: "123" } });
  assert.equal(r.status, 400);
});

test("login succeeds for a seeded demo account", async () => {
  const r = await api("POST", "/api/auth/login", { body: { username: "selin", password: "cetele" } });
  assert.equal(r.status, 200);
  assert.ok(r.body.token);
});

test("login fails with the wrong password", async () => {
  const r = await api("POST", "/api/auth/login", { body: { username: "selin", password: "wrong-pw" } });
  assert.equal(r.status, 401);
});

// ---------- #5 numeric bounds ----------
test("numeric goal bounds are clamped on create", async () => {
  const u = await signup();
  const token = u.body.token, uid = u.body.user.id;
  await api("POST", "/api/goals", { token, body: {
    title: "Bounds " + u.username, type: "numeric", unit: "min", category: "personal",
    target: 99, dailyMin: -5, step: 0, vis: { type: "private" },
  } });
  const goals = await api("GET", `/api/users/${uid}/goals`, { token });
  const g = (goals.body || []).find((x) => x.title.startsWith("Bounds"));
  assert.ok(g, "goal created");
  assert.equal(g.target, 7, "target clamped to 1..7");
  assert.equal(g.dailyMin, 0, "dailyMin clamped to >= 0");
  assert.ok(g.step >= 1, "step clamped to >= 1");
});

// ---------- wall post + delete ----------
test("a wall note can be posted, read, and deleted by its author", async () => {
  const a = await signup();
  const text = "Keep it up! " + a.username;
  const posted = await api("POST", "/api/users/u_yusuf/wall", { token: a.body.token, body: { text } });
  assert.equal(posted.status, 200);
  assert.ok(posted.body.id, "note id returned");

  const wall = await api("GET", "/api/users/u_yusuf/wall");
  assert.ok((wall.body || []).some((n) => n.text === text), "note appears on the wall");

  const del = await api("DELETE", `/api/wall/${posted.body.id}`, { token: a.body.token });
  assert.equal(del.status, 200);
  const wall2 = await api("GET", "/api/users/u_yusuf/wall");
  assert.ok(!(wall2.body || []).some((n) => n.text === text), "note removed after delete");
});

// ---------- #1 visibility: personal goal sharing ----------
test("personal goal visibility is enforced for other viewers", async () => {
  const owner = await signup();
  const viewer = await signup();
  const oid = owner.body.user.id;

  await api("POST", "/api/goals", { token: owner.body.token, body: {
    title: "Open " + owner.username, type: "binary", category: "personal", vis: { type: "everyone" },
  } });
  await api("POST", "/api/goals", { token: owner.body.token, body: {
    title: "Secret " + owner.username, type: "binary", category: "personal", vis: { type: "private" },
  } });

  const seen = await api("GET", `/api/users/${oid}/goals`, { token: viewer.body.token });
  const titles = (seen.body || []).map((g) => g.title);
  assert.ok(titles.some((t) => t.startsWith("Open")), "everyone-visible goal is seen");
  assert.ok(!titles.some((t) => t.startsWith("Secret")), "private goal is hidden");
});

// ---------- #6 invite-code regenerate ----------
test("a mentor can regenerate a cohort invite code", async () => {
  const r = await api("POST", "/api/cohorts/northstar/invite/regenerate", { token: tokens.yusuf });
  assert.equal(r.status, 200);
  assert.ok(r.body.inviteCode && /^[A-Z0-9]+-\d{3}$/.test(r.body.inviteCode), "invite code has NAME-### format: " + r.body.inviteCode);
});

test("a mentee cannot regenerate a cohort invite code", async () => {
  const r = await api("POST", "/api/cohorts/northstar/invite/regenerate", { token: tokens.okan });
  assert.equal(r.status, 403);
});

// ---------- #1 history-summary permission ----------
test("history summary is visible to the member themselves", async () => {
  const r = await api("GET", "/api/users/u_okan/history-summary", { token: tokens.okan });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.weekly) && r.body.weekly.length === 8, "8 weekly buckets");
});

test("history summary is visible to a mentor of the member", async () => {
  const r = await api("GET", "/api/users/u_okan/history-summary", { token: tokens.yusuf });
  assert.equal(r.status, 200);
});

test("history summary is blocked for an unrelated viewer", async () => {
  const r = await api("GET", "/api/users/u_okan/history-summary", { token: tokens.stranger });
  assert.equal(r.status, 403);
});

// ---------- rate limiting (MUST run last: the login limiter is global per-IP) ----------
test("repeated bad logins eventually hit the rate limit", async () => {
  let saw429 = false;
  for (let i = 0; i < 15; i++) {
    const r = await api("POST", "/api/auth/login", { body: { username: "nobody", password: "x" } });
    if (r.status === 429) { saw429 = true; break; }
  }
  assert.ok(saw429, "a 429 is returned once the per-IP login limit is exceeded");
});
