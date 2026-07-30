// Çetele API server — Express + better-sqlite3.
// Run: npm install && npm run start   (DB auto-creates and seeds on first launch)

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const seed = require("./seed");

const DB_PATH = process.env.CETELE_DB || path.join(__dirname, "cetele.db");  // CETELE_DB lets tests use a throwaway database
const db = new Database(DB_PATH);

// ----- persistent error logging (append-only JSON lines under ./logs) -----
const LOG_DIR = path.join(__dirname, "logs");
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch { /* best effort */ }
function logError(kind, err, req) {
  const entry = {
    t: new Date().toISOString(), kind,
    msg: err && (err.message || String(err)),
    stack: err && err.stack,
    method: req && req.method, path: req && req.originalUrl, ip: req && req.ip,
  };
  try { fs.appendFileSync(path.join(LOG_DIR, "server-errors.log"), JSON.stringify(entry) + "\n"); } catch { /* disk issue — fall through to console */ }
  console.error(`[${entry.t}] ${kind}: ${entry.msg || "unknown error"}${entry.path ? ` (${entry.method} ${entry.path})` : ""}`);
}
process.on("uncaughtException", (err) => logError("uncaughtException", err));   // log; keep serving (single manual process)
process.on("unhandledRejection", (err) => logError("unhandledRejection", err)); // catches async route rejections Express 4 misses

// ----- auth: scrypt password hashing + opaque bearer sessions -----
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "cetele";   // dev-only shared password for seeded accounts
// Demo accounts (weak shared password) must NEVER be seeded into a production DB.
const SEED_DEMO = process.env.SEED_DEMO === "1" || (process.env.SEED_DEMO !== "0" && process.env.NODE_ENV !== "production");
const SESSION_TTL_DAYS = 30;
// Trim, strip control characters, and cap length. Single-line by default; multiline keeps \n and \t.
function cleanText(v, max = 280, multiline = false) {
  let s = String(v == null ? "" : v);
  s = multiline
    ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // keep \n (\u000A) and \t (\u0009)
    : s.replace(/[\u0000-\u001F\u007F]/g, " ");                         // single-line: drop all control chars incl newlines
  s = s.replace(/[ \t]{2,}/g, " ").trim();
  return s.length > max ? s.slice(0, max) : s;
}
const clampInt = (v, lo, hi, d) => { v = Math.round(Number(v)); if (!Number.isFinite(v)) return d; return Math.max(lo, Math.min(hi, v)); };
const hashPassword = (pw, salt = crypto.randomBytes(16).toString("hex")) => ({ salt, hash: crypto.scryptSync(String(pw), salt, 64).toString("hex") });
const verifyPassword = (pw, salt, hash) => {
  if (!salt || !hash) return false;
  const h = crypto.scryptSync(String(pw), salt, 64);
  const known = Buffer.from(hash, "hex");
  return h.length === known.length && crypto.timingSafeEqual(h, known);
};
const newToken = () => crypto.randomBytes(32).toString("hex");
function createSession(userId) {
  const token = newToken();
  const now = new Date();
  const exp = new Date(now.getTime() + SESSION_TTL_DAYS * 86400000);
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)").run(token, userId, now.toISOString(), exp.toISOString());
  return token;
}
function userIdForToken(token) {
  if (!token) return null;
  const s = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token);
  if (!s) return null;
  if (new Date(s.expires_at) < new Date()) { db.prepare("DELETE FROM sessions WHERE token = ?").run(token); return null; }
  return s.user_id;
}
const publicUser = (u) => u && ({ id: u.id, username: u.username, name: u.name, avatar: u.avatar, bio: u.bio, nameChangesLeft: u.name_changes_left });

// ----- activity feed + notifications generation -----
const nowSec = () => Math.floor(Date.now() / 1000);
const userName = (id) => { const u = db.prepare("SELECT name FROM users WHERE id = ?").get(id); return u ? u.name : "Someone"; };
function addFeed({ author, scope, cohortId, kind, goal, detail, key }) {
  const id = "fe_" + crypto.randomBytes(5).toString("hex");
  try {
    db.prepare("INSERT INTO feed_items (id,author_id,scope,cohort_id,kind,goal,detail,mins_ago,cheers,created_at,event_key) VALUES (?,?,?,?,?,?,?,0,0,?,?)")
      .run(id, author, scope, cohortId || null, kind, goal || "", detail || "", nowSec(), key || null);
  } catch { /* UNIQUE(event_key): this event was already emitted */ }
}
function notify(userId, kind, actorId, text, ref) {
  if (!userId || userId === actorId) return; // never notify yourself
  db.prepare("INSERT INTO notifications (user_id,kind,actor_id,text,ref) VALUES (?,?,?,?,?)").run(userId, kind, actorId, text, ref || null);
  sendPush(userId, "Çetele", text, ref);     // mirror in-app notifications to the device when push is enabled
}
function onJoin(cohortId, userId) {
  const cname = (db.prepare("SELECT name FROM cohorts WHERE id = ?").get(cohortId) || {}).name || "the cohort";
  addFeed({ author: userId, scope: "cohort", cohortId, kind: "join", goal: "", detail: `joined ${cname}`, key: `join:${cohortId}:${userId}` });
  db.prepare("SELECT user_id FROM cohort_members WHERE cohort_id = ? AND role = 'mentor'").all(cohortId)
    .forEach((m) => notify(m.user_id, "join", userId, `${userName(userId)} joined ${cname}`, cohortId));
}

// ----- calendar helpers (per-user timezone + a 4am "grace" day boundary) -----
const isoOf = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDaysIso = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return isoOf(d); };
const DAY_START_HOUR = 4;                        // a logical day starts at 4am local — late-night logs count to the prior day
const SERVER_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; } })();
function tzToday(tz, at = new Date()) {
  const shifted = new Date(at.getTime() - DAY_START_HOUR * 3600000);
  try {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz || SERVER_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(shifted);
    const g = (t) => p.find((x) => x.type === t).value;
    return `${g("year")}-${g("month")}-${g("day")}`;
  } catch { return isoOf(shifted); }
}
const todayIso = (tz) => tzToday(tz || SERVER_TZ);
const weekIso = (today = todayIso()) => { const start = addDaysIso(today, -new Date(today + "T00:00:00").getDay()); return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i)); };
const EDIT_WINDOW_DAYS = 2;
const dateMet = (type, dailyMin, value) => (type === "binary" ? value >= 1 : value >= dailyMin);
function computeStreak(goalId, userId, type, dailyMin, today = todayIso()) {
  const metOn = (iso) => { const r = db.prepare("SELECT value FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(goalId, userId, iso); return r ? dateMet(type, dailyMin, r.value) : false; };
  let cur = metOn(today) ? today : addDaysIso(today, -1);
  let n = 0;
  while (metOn(cur)) { n++; cur = addDaysIso(cur, -1); }
  return n;
}
const userTz = (id) => { const u = db.prepare("SELECT tz FROM users WHERE id = ?").get(id); return (u && u.tz) || SERVER_TZ; };
db.pragma("foreign_keys = ON");

// --- schema + seed (idempotent) ---
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// --- 1.28 migrations (idempotent; safe to run on an existing database) ---
const safeAlter = (sql) => { try { db.exec(sql); } catch { /* already applied */ } };
safeAlter("ALTER TABLE users ADD COLUMN recovery_hash TEXT");
safeAlter("ALTER TABLE users ADD COLUMN recovery_salt TEXT");
db.exec(`
  CREATE TABLE IF NOT EXISTS friend_requests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id    TEXT NOT NULL REFERENCES users(id),
    to_id      TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    UNIQUE(from_id, to_id)
  );
  CREATE INDEX IF NOT EXISTS idx_freq_to ON friend_requests(to_id);
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
`);

// --- web push (Web Push API / VAPID). Optional: enabled when `web-push` is installed. ---
// For local/self-distribution these keys are fine inline; for a real deployment set
// VAPID_PUBLIC / VAPID_PRIVATE env vars (and rotate these) instead.
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || "BCBLFei191-B4iLS1kduyOK9l7ciwN2VgLJkN3zUqw9B5QYAyajp1PzKjZFwUvEWOFhlhPz1c1m3M9B5ilYVS94";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || "8Bpwd8MfnfNia-kC_6dhjOVGy5vuLcXGa3iGPIP_6DM";
let webpush = null;
try { webpush = require("web-push"); webpush.setVapidDetails("mailto:hello@cetele.app", VAPID_PUBLIC, VAPID_PRIVATE); }
catch { console.log("web-push not installed — run `npm install web-push` in cetele-backend to enable push delivery."); }
function sendPush(userId, title, body, ref) {
  if (!webpush) return;
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?").all(userId);
  if (!subs.length) return;
  const payload = JSON.stringify({ title, body, ref: ref || null });
  for (const s of subs) {
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      .catch((e) => { if (e && (e.statusCode === 404 || e.statusCode === 410)) db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(s.id); });
  }
}

// --- account recovery codes (offline password reset; no email infra required) ---
const genRecoveryCode = () => { const a = crypto.randomBytes(6).toString("hex").toUpperCase(); return `${a.slice(0,4)}-${a.slice(4,8)}-${a.slice(8,12)}`; };
const setRecovery = (userId) => { const code = genRecoveryCode(); const { salt, hash } = hashPassword(code); db.prepare("UPDATE users SET recovery_hash = ?, recovery_salt = ? WHERE id = ?").run(hash, salt, userId); return code; };

const seeded = db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0;
if (!seeded && SEED_DEMO) {
  console.warn("⚠  Seeding ~19 DEMO accounts that all share a known dev password. Do NOT expose this database publicly. Set NODE_ENV=production (or SEED_DEMO=0) to start with an empty database.");
  const insUser = db.prepare(
    "INSERT INTO users (id,username,name,avatar,bio,tz,password_hash,salt) VALUES (@id,@username,@name,@avatar,@bio,@tz,@password_hash,@salt)"
  );
  const insCohort = db.prepare(
    "INSERT INTO cohorts (id,name,full_name,description,theme,invite_code,marks,target) VALUES (@id,@name,@full_name,@description,@theme,@invite_code,@marks,@target)"
  );
  const insMember = db.prepare(
    "INSERT INTO cohort_members (cohort_id,user_id,role,week_pct,streak,logged_today,trend) VALUES (?,?,?,?,?,?,?)"
  );
  const insGoal = db.prepare(
    "INSERT INTO goals (id,owner_id,title,icon,category,cohort_id,type,unit,daily_min,step,target,streak,vis_type,vis_people) VALUES (@id,@owner_id,@title,@icon,@category,@cohort_id,@type,@unit,@daily_min,@step,@target,@streak,@vis_type,@vis_people)"
  );
  const insLog = db.prepare(
    "INSERT INTO daily_logs (goal_id,user_id,log_date,value,met) VALUES (?,?,?,?,?)"
  );
  const insFriend = db.prepare("INSERT INTO friends (user_id,friend_id) VALUES (?,?)");
  const insWall = db.prepare("INSERT INTO wall_notes (member_id,from_id,text) VALUES (?,?,?)");
  const insFeed = db.prepare(
    "INSERT INTO feed_items (id,author_id,scope,cohort_id,kind,goal,detail,mins_ago,cheers,created_at,event_key) VALUES (?,?,?,?,?,?,?,?,?,?,NULL)"
  );
  const tx = db.transaction(() => {
    seed.users.forEach((u) => { const { salt, hash } = hashPassword(DEMO_PASSWORD); insUser.run({ avatar: null, bio: "", tz: SERVER_TZ, ...u, password_hash: hash, salt }); });
    seed.cohorts.forEach((c) => insCohort.run(c));
    seed.members.forEach((m) => insMember.run(...m));
    seed.goals.forEach((g) => insGoal.run({ ...g, vis_people: JSON.stringify(g.vis_people || []) }));
    seed.logs.forEach((l) => insLog.run(...l));
    seed.friends.forEach((f) => insFriend.run(...f));
    seed.wallNotes.forEach((w) => insWall.run(...w));
    seed.feedItems.forEach((f) => insFeed.run(...f, Math.floor(Date.now()/1000) - (f[7] * 60)));
  });
  tx();
  console.log("Seeded database.");
} else if (!seeded) {
  console.log("Production mode (no demo seed): starting with an empty database — only real sign-ups will exist.");
}

// --- helpers ---
const app = express();
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1); // set when behind a reverse proxy so req.ip is the client
app.use(cors());
app.use(express.json({ limit: "64kb" }));   // cap request bodies

// ----- tiny in-memory rate limiter (no external dependency) -----
const rlBuckets = new Map();
const rlSweep = setInterval(() => { const now = Date.now(); for (const [k, b] of rlBuckets) if (b.reset < now) rlBuckets.delete(k); }, 5 * 60 * 1000);
if (rlSweep.unref) rlSweep.unref();
// `name` gives a stable bucket per endpoint (so param-bearing routes can't be bypassed by varying the params);
// `key` chooses the identity (IP for auth, userId for authenticated writes).
function rateLimit({ windowMs, max, name, key, message }) {
  return (req, res, next) => {
    const who = key ? key(req) : (req.ip || "?");
    const id = `${name || req.path}|${who}`;
    const now = Date.now();
    let b = rlBuckets.get(id);
    if (!b || b.reset < now) { b = { count: 0, reset: now + windowMs }; rlBuckets.set(id, b); }
    b.count++;
    if (b.count > max) {
      const retryAfter = Math.ceil((b.reset - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: message || "Too many attempts. Please wait a bit and try again.", retryAfter });
    }
    next();
  };
}
const userKey = (req) => req.userId || req.ip || "?";
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });   // 10 sign-in/reset attempts per IP / 15 min
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: Number(process.env.RL_SIGNUP_MAX) || 8 });   // 8 new accounts per IP / hour (raise via RL_SIGNUP_MAX for tests)
// Per-user spam limits on authenticated writes:
const wallLimiter = rateLimit({ windowMs: 60 * 1000, max: 12, name: "wall", key: userKey, message: "You're posting too fast. Give it a moment." });
const friendLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, name: "friendreq", key: userKey, message: "Too many friend actions. Slow down a moment." });
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, name: "create", key: userKey, message: "Slow down — too many new items at once." });

// Resolve the bearer token to req.userId (null when absent/invalid).
app.use((req, _res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  req.token = token;
  req.userId = userIdForToken(token);
  next();
});
const requireAuth = (req, res, next) => {
  if (req.userId) return next();
  // A token was sent but rejected -> the session expired or was revoked; tell the client so it can explain the logout.
  if (req.token) return res.status(401).json({ error: "Your session has expired. Please sign in again.", code: "session_expired" });
  return res.status(401).json({ error: "authentication required", code: "no_auth" });
};

// ----- auth routes -----
app.post("/api/auth/signup", signupLimiter, (req, res) => {
  const username = String(req.body.username || "").toLowerCase().trim();
  const name = cleanText(req.body.name, 40);
  const password = String(req.body.password || "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: "username must be 3–20 chars: a–z, 0–9, _" });
  if (!name) return res.status(400).json({ error: "name required" });
  if (password.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });
  if (password.length > 128) return res.status(400).json({ error: "password is too long (max 128)" });
  if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) return res.status(409).json({ error: "username taken" });
  const id = "u_" + crypto.randomBytes(6).toString("hex");
  const { salt, hash } = hashPassword(password);
  const tz = typeof req.body.tz === "string" ? req.body.tz.slice(0, 64) : null;
  db.prepare("INSERT INTO users (id,username,name,avatar,bio,tz,password_hash,salt) VALUES (?,?,?,?,?,?,?,?)").run(id, username, name, null, "", tz, hash, salt);
  const recoveryCode = setRecovery(id);
  const token = createSession(id);
  res.json({ token, recoveryCode, user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
});
// Reset a forgotten password using the account's recovery code. Issues a fresh code and clears sessions.
app.post("/api/auth/reset", loginLimiter, (req, res) => {
  const username = String(req.body.username || "").toLowerCase().trim();
  const code = String(req.body.code || "").toUpperCase().replace(/\s/g, "");
  const newPassword = String(req.body.newPassword || "");
  if (newPassword.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });
  if (newPassword.length > 128) return res.status(400).json({ error: "password is too long (max 128)" });
  const u = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!u || !u.recovery_hash || !verifyPassword(code, u.recovery_salt, u.recovery_hash))
    return res.status(401).json({ error: "wrong username or recovery code" });
  const { salt, hash } = hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").run(hash, salt, u.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(u.id);  // invalidate any existing logins
  const recoveryCode = setRecovery(u.id);
  const token = createSession(u.id);
  res.json({ token, recoveryCode, user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(u.id)) });
});
// View/regenerate your recovery code while signed in (e.g. you lost the original).
app.post("/api/auth/recovery", requireAuth, (req, res) => {
  res.json({ recoveryCode: setRecovery(req.userId) });
});
app.post("/api/auth/login", loginLimiter, (req, res) => {
  const username = String(req.body.username || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  const u = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!u || !verifyPassword(password, u.salt, u.password_hash)) return res.status(401).json({ error: "wrong username or password" });
  if (typeof req.body.tz === "string") db.prepare("UPDATE users SET tz = ? WHERE id = ?").run(req.body.tz.slice(0, 64), u.id);
  const token = createSession(u.id);
  res.json({ token, user: publicUser(u) });
});
app.post("/api/auth/logout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(req.token);
  res.json({ ok: true });
});
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId)) });
});
function assembleGoal(goalRow, viewerId, today = todayIso()) {
  const uid = viewerId || goalRow.owner_id;
  const week7 = weekIso(today);
  const values = week7.map((iso) => { const r = db.prepare("SELECT value FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(goalRow.id, uid, iso); return r ? r.value : 0; });
  const week = week7.map((iso, i) => (iso <= today && dateMet(goalRow.type, goalRow.daily_min, values[i]) ? 1 : 0));
  const weekDone = week.reduce((a, b) => a + b, 0);
  const history = {};
  for (let d = 0; d < 30; d++) { const iso = addDaysIso(today, -d); const r = db.prepare("SELECT met FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(goalRow.id, uid, iso); if (r) history[iso] = r.met ? 1 : 0; }
  return {
    id: goalRow.id,
    ownerId: goalRow.owner_id,
    title: goalRow.title,
    icon: goalRow.icon,
    category: goalRow.category,
    cohortId: goalRow.cohort_id,
    type: goalRow.type,
    unit: goalRow.unit,
    dailyMin: goalRow.daily_min,
    step: goalRow.step,
    target: goalRow.target,
    streak: computeStreak(goalRow.id, uid, goalRow.type, goalRow.daily_min, today),
    vis: goalRow.category === "personal"
      ? { type: goalRow.vis_type, people: JSON.parse(goalRow.vis_people || "[]") }
      : null,
    values,
    week,
    weekDone,
    weekPct: Math.round((weekDone / goalRow.target) * 100),
    history,
  };
}
// N-day series of {iso,value,met} for a goal as logged by a specific member (oldest -> newest).
function goalSeries(goalId, userId, days, today = todayIso()) {
  const out = [];
  for (let d = days - 1; d >= 0; d--) {
    const iso = addDaysIso(today, -d);
    const r = db.prepare("SELECT value, met FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(goalId, userId, iso);
    out.push({ iso, value: r ? r.value : 0, met: r ? (r.met ? 1 : 0) : 0 });
  }
  return out;
}
const completionPct = (series) => (series.length ? Math.round((series.filter((s) => s.met).length / series.length) * 100) : 0);

// --- routes ---
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Unified search across usernames/names and cohorts.
app.get("/api/search", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const type = String(req.query.type || "all");
  const like = `%${q}%`;
  const out = { users: [], cohorts: [] };
  if (!q) return res.json(out);

  if (type === "all" || type === "users") {
    out.users = db
      .prepare(
        "SELECT id, username, name, avatar, bio FROM users WHERE lower(username) LIKE ? OR lower(name) LIKE ? ORDER BY (lower(username) = ?) DESC, username LIMIT 25"
      )
      .all(like, like, q);
  }
  if (type === "all" || type === "cohorts") {
    out.cohorts = db
      .prepare(
        `SELECT c.id, c.name, c.full_name AS fullName, c.description, c.theme, c.invite_code AS inviteCode, c.marks, c.target,
                (SELECT COUNT(*) FROM cohort_members m WHERE m.cohort_id = c.id) AS memberCount,
                (SELECT u.name FROM cohort_members m JOIN users u ON u.id = m.user_id
                   WHERE m.cohort_id = c.id AND m.role = 'mentor' LIMIT 1) AS lead
           FROM cohorts c
          WHERE lower(c.name) LIKE ? OR lower(c.full_name) LIKE ?
          ORDER BY c.name LIMIT 25`
      )
      .all(like, like);
  }
  res.json(out);
});

app.get("/api/cohorts", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.full_name AS fullName, c.description, c.theme, c.invite_code AS inviteCode, c.marks, c.target,
              (SELECT COUNT(*) FROM cohort_members m WHERE m.cohort_id = c.id) AS memberCount,
              (SELECT u.name FROM cohort_members m JOIN users u ON u.id = m.user_id
                 WHERE m.cohort_id = c.id AND m.role = 'mentor' LIMIT 1) AS lead
         FROM cohorts c ORDER BY c.name`
    )
    .all();
  res.json(rows);
});

// Full cohort objects (with members) — standings computed from real per-member logs.
app.get("/api/cohorts/full", (_req, res) => {
  const cohorts = db.prepare("SELECT id, name, full_name AS fullName, description, theme, invite_code AS inviteCode, target FROM cohorts ORDER BY name").all();
  const metStmt = db.prepare("SELECT met FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?");
  const tzCache = {};
  const memTz = (id) => (tzCache[id] !== undefined ? tzCache[id] : (tzCache[id] = userTz(id)));
  const out = cohorts.map((c) => {
    const goalsC = db.prepare("SELECT id, type, daily_min FROM goals WHERE cohort_id = ?").all(c.id);
    const mems = db.prepare("SELECT m.user_id AS id, u.name, m.role FROM cohort_members m JOIN users u ON u.id = m.user_id WHERE m.cohort_id = ?").all(c.id);
    let collMarks = 0;
    const members = mems.map((m) => {
      const today = todayIso(memTz(m.id));      // each member's own logical today
      const week7 = weekIso(today);
      let metWin = 0, possWin = 0, loggedToday = false, bestStreak = 0;
      for (const g of goalsC) {
        for (let d = 0; d < 7; d++) { const iso = addDaysIso(today, -d); possWin++; const r = metStmt.get(g.id, m.id, iso); if (r && r.met) { metWin++; if (d === 0) loggedToday = true; } }
        bestStreak = Math.max(bestStreak, computeStreak(g.id, m.id, g.type, g.daily_min, today));
        for (const iso of week7) { if (iso <= today) { const r = metStmt.get(g.id, m.id, iso); if (r && r.met) collMarks++; } }
      }
      return { id: m.id, name: m.name, role: m.role, weekPct: possWin ? Math.round((100 * metWin) / possWin) : 0, streak: bestStreak, loggedToday, trend: 0 };
    });
    members.sort((a, b) => b.weekPct - a.weekPct);
    const target = mems.length * goalsC.length * 7 || c.target;
    return { id: c.id, name: c.name, fullName: c.fullName, description: c.description, theme: c.theme, inviteCode: c.inviteCode, marks: collMarks, target, members };
  });
  res.json(out);
});

app.get("/api/users/:id", (req, res) => {
  const u = db.prepare("SELECT id, username, name, avatar, bio, name_changes_left AS nameChangesLeft FROM users WHERE id = ?").get(req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(u);
});

// ----- visibility (step 4): who may see a personal goal -----
function sharesCohort(a, b) {
  return !!db.prepare("SELECT 1 FROM cohort_members m1 JOIN cohort_members m2 ON m1.cohort_id = m2.cohort_id WHERE m1.user_id = ? AND m2.user_id = ? LIMIT 1").get(a, b);
}
function mentorsOver(viewer, owner) { // viewer mentors a cohort the owner belongs to
  return !!db.prepare("SELECT 1 FROM cohort_members vm JOIN cohort_members om ON vm.cohort_id = om.cohort_id WHERE vm.user_id = ? AND vm.role = 'mentor' AND om.user_id = ? LIMIT 1").get(viewer, owner);
}
function canSeePersonal(goalRow, viewer) {
  if (viewer === goalRow.owner_id) return true;
  switch (goalRow.vis_type) {
    case "everyone": return true;
    case "private": return false;
    case "cohort": return sharesCohort(viewer, goalRow.owner_id);
    case "mentors": return mentorsOver(viewer, goalRow.owner_id);
    case "people": try { return JSON.parse(goalRow.vis_people || "[]").includes(viewer); } catch { return false; }
    default: return false;
  }
}
// Cohort goals of `target` that `viewer` can see: all of them if self, else those in cohorts both belong to.
function sharedCohortGoals(target, viewer) {
  if (target === viewer) return db.prepare("SELECT * FROM goals WHERE category='cohort' AND cohort_id IN (SELECT cohort_id FROM cohort_members WHERE user_id=?)").all(target);
  return db.prepare("SELECT * FROM goals WHERE category='cohort' AND cohort_id IN (SELECT c.cohort_id FROM cohort_members c JOIN cohort_members v ON c.cohort_id=v.cohort_id WHERE c.user_id=? AND v.user_id=?)").all(target, viewer);
}

app.get("/api/users/:id/goals", requireAuth, (req, res) => {
  const target = req.params.id;
  const viewer = req.userId;
  const self = viewer === target;
  const personal = db.prepare("SELECT * FROM goals WHERE owner_id = ? AND category = 'personal'").all(target)
    .filter((g) => self || canSeePersonal(g, viewer));
  // cohort goals are shared templates — only surfaced on your own tab, assembled with your logs
  const cohortGoals = self
    ? db.prepare("SELECT * FROM goals WHERE category = 'cohort' AND cohort_id IN (SELECT cohort_id FROM cohort_members WHERE user_id = ?)").all(target)
    : [];
  const today = todayIso(userTz(target));
  res.json([...cohortGoals, ...personal].map((g) => assembleGoal(g, target, today)));
});

// ----- goal CRUD (owner-scoped) -----
app.post("/api/goals", requireAuth, createLimiter, (req, res) => {
  const b = req.body || {};
  const type = b.type === "numeric" ? "numeric" : "binary";
  const category = b.category === "cohort" ? "cohort" : "personal";
  const title = cleanText(b.title, 60);
  if (!title) return res.status(400).json({ error: "title required" });
  const unit = cleanText(b.unit, 16);
  const icon = cleanText(b.icon, 24) || "Target";
  if (category === "cohort") {
    const cid = b.cohortId;
    const mem = cid && db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, req.userId);
    if (!mem || mem.role !== "mentor") return res.status(403).json({ error: "only a mentor can add a cohort goal" });
  }
  const dupTitle = title.toLowerCase();
  const dup = db.prepare("SELECT id, unit, daily_min, type, cohort_id FROM goals WHERE owner_id = ? AND lower(title) = ? AND category = ?").all(req.userId, dupTitle, category)
    .find((g) => g.type === type && (category !== "cohort" || g.cohort_id === b.cohortId) && (type !== "numeric" || (Number(g.daily_min) === (Number(b.dailyMin) || 0) && (g.unit || "").trim().toLowerCase() === unit.toLowerCase())));
  if (dup) return res.status(409).json({ error: "You already have a goal exactly like this." });
  if (category === "personal" && db.prepare("SELECT COUNT(*) AS n FROM goals WHERE owner_id = ? AND category = 'personal'").get(req.userId).n >= 25)
    return res.status(409).json({ error: "You've reached 25 personal goals. Archive some before adding more." });
  const id = "g_" + crypto.randomBytes(5).toString("hex");
  db.prepare(
    `INSERT INTO goals (id,owner_id,title,icon,category,cohort_id,type,unit,daily_min,step,target,streak,vis_type,vis_people)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?)`
  ).run(id, req.userId, title, icon, category, category === "cohort" ? b.cohortId : null,
        type, unit, clampInt(b.dailyMin, 0, 1000000, 0), clampInt(b.step, 1, 100000, 1), clampInt(b.target, 1, 7, 7),
        (b.vis && b.vis.type) || "private", JSON.stringify((b.vis && b.vis.people) || []));
  if (category === "cohort") {
    const cname = (db.prepare("SELECT name FROM cohorts WHERE id = ?").get(b.cohortId) || {}).name || "your cohort";
    db.prepare("SELECT user_id FROM cohort_members WHERE cohort_id = ?").all(b.cohortId)
      .forEach((m) => notify(m.user_id, "new_goal", req.userId, `New goal in ${cname}: ${title}`, b.cohortId));
  }
  res.json(assembleGoal(db.prepare("SELECT * FROM goals WHERE id = ?").get(id), req.userId, todayIso(userTz(req.userId))));
});
app.patch("/api/goals/:id", requireAuth, (req, res) => {
  const g = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id);
  if (!g) return res.status(404).json({ error: "goal not found" });
  if (g.owner_id !== req.userId) return res.status(403).json({ error: "not your goal" });
  const b = req.body || {};
  const next = {
    title: b.title != null ? (cleanText(b.title, 60) || g.title) : g.title,
    icon: b.icon != null ? b.icon : g.icon,
    type: b.type === "numeric" || b.type === "binary" ? b.type : g.type,
    unit: b.unit != null ? cleanText(b.unit, 16) : g.unit,
    daily_min: b.dailyMin != null ? clampInt(b.dailyMin, 0, 1000000, g.daily_min) : g.daily_min,
    step: b.step != null ? clampInt(b.step, 1, 100000, g.step) : g.step,
    target: b.target != null ? clampInt(b.target, 1, 7, g.target) : g.target,
    vis_type: b.vis && b.vis.type ? b.vis.type : g.vis_type,
    vis_people: b.vis && b.vis.people ? JSON.stringify(b.vis.people) : g.vis_people,
  };
  db.prepare("UPDATE goals SET title=?,icon=?,type=?,unit=?,daily_min=?,step=?,target=?,vis_type=?,vis_people=? WHERE id=?")
    .run(next.title, next.icon, next.type, next.unit, next.daily_min, next.step, next.target, next.vis_type, next.vis_people, g.id);
  res.json(assembleGoal(db.prepare("SELECT * FROM goals WHERE id = ?").get(g.id), req.userId, todayIso(userTz(req.userId))));
});
app.delete("/api/goals/:id", requireAuth, (req, res) => {
  const g = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id);
  if (!g) return res.status(404).json({ error: "goal not found" });
  if (g.owner_id !== req.userId) return res.status(403).json({ error: "not your goal" });
  db.prepare("DELETE FROM daily_logs WHERE goal_id = ?").run(g.id);
  db.prepare("DELETE FROM goals WHERE id = ?").run(g.id);
  res.json({ ok: true, id: g.id });
});

// Log (or correct) a single day's value for a goal (the caller's own log).
app.post("/api/goals/:id/logs", requireAuth, (req, res) => {
  const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id);
  if (!goal) return res.status(404).json({ error: "goal not found" });
  // personal goals: owner only. cohort goals (shared): any member of the cohort logs their own.
  const allowed = goal.category === "cohort" ? isMember(goal.cohort_id, req.userId) : goal.owner_id === req.userId;
  if (!allowed) return res.status(403).json({ error: "not allowed to log this goal" });
  const value = Math.max(0, Number(req.body.value) || 0);
  // Resolve the user's timezone (client sends it; persist for the scheduler) and compute their logical "today".
  const tz = (typeof req.body.tz === "string" && req.body.tz.slice(0, 64)) || userTz(req.userId);
  if (typeof req.body.tz === "string") db.prepare("UPDATE users SET tz = ? WHERE id = ?").run(req.body.tz.slice(0, 64), req.userId);
  const today = todayIso(tz);
  let date = req.body.date;
  if (!date && req.body.dayIndex != null) { const w = weekIso(today); date = w[Number(req.body.dayIndex)]; }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date (YYYY-MM-DD) required" });
  }
  // Logging policy: the logical today (4am boundary, user's tz) and the 2 prior days; never the future.
  const offset = Math.round((new Date(today + "T00:00:00") - new Date(date + "T00:00:00")) / 86400000);
  if (offset < 0) return res.status(403).json({ error: "cannot log a future date" });
  if (offset > EDIT_WINDOW_DAYS) return res.status(403).json({ error: "date is past the edit window", editableFrom: addDaysIso(today, -EDIT_WINDOW_DAYS) });

  const nowMet = dateMet(goal.type, goal.daily_min, value) ? 1 : 0;
  db.prepare(
    `INSERT INTO daily_logs (goal_id, user_id, log_date, value, met) VALUES (?,?,?,?,?)
       ON CONFLICT(goal_id, user_id, log_date) DO UPDATE SET value = excluded.value, met = excluded.met`
  ).run(goal.id, req.userId, date, value, nowMet);

  const assembled = assembleGoal(goal, req.userId, today);
  // Generate a feed event for a met log (only when logging today; deduped per goal/user/day).
  if (nowMet && offset === 0) {
    const cohort = goal.category === "cohort";
    const visOk = cohort || goal.vis_type === "everyone" || goal.vis_type === "people" || goal.vis_type === "cohort" || goal.vis_type === "mentors";
    if (visOk) {
      const scope = cohort ? "cohort" : "friend";
      const cohortId = cohort ? goal.cohort_id : null;
      const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
      if (milestones.includes(assembled.streak)) {
        addFeed({ author: req.userId, scope, cohortId, kind: "streak", goal: goal.title, detail: `hit a ${assembled.streak}-day streak`, key: `streak:${goal.id}:${req.userId}:${assembled.streak}` });
      } else if (assembled.weekDone >= goal.target) {
        addFeed({ author: req.userId, scope, cohortId, kind: "complete", goal: goal.title, detail: "completed this week's goal", key: `complete:${goal.id}:${req.userId}:${weekIso(today)[0]}` });
      } else {
        const detail = goal.type === "numeric" ? `${value} ${goal.unit}`.trim() : "marked done";
        addFeed({ author: req.userId, scope, cohortId, kind: "log", goal: goal.title, detail, key: `log:${goal.id}:${req.userId}:${date}` });
      }
    }
  }
  res.json(assembled);
});

// --- cohort create / update (mentor-owned) ---
app.post("/api/cohorts", requireAuth, createLimiter, (req, res) => {
  const name = cleanText(req.body.name, 24);
  const fullName = cleanText(req.body.fullName || (name ? name + " Cohort" : ""), 40);
  if (name.length < 2) return res.status(400).json({ error: "name too short" });
  const id = "c_" + Date.now().toString(36);
  const theme = cleanText(req.body.theme, 16) || "pine";
  const description = cleanText(req.body.description, 60, true);
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "COHORT";
  const inviteCode = `${base}-${100 + ([...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 900)}`;
  db.prepare("INSERT INTO cohorts (id,name,full_name,description,theme,invite_code,marks,target) VALUES (?,?,?,?,?,?,0,7)")
    .run(id, name, fullName, description, theme, inviteCode);
  db.prepare(`INSERT INTO cohort_members (cohort_id,user_id,role,week_pct,streak,logged_today,trend)
                VALUES (?,?,'mentor',0,0,1,0)`).run(id, req.userId);
  res.json({ id, name, fullName, theme, description, inviteCode, ok: true });
});
app.patch("/api/cohorts/:id", requireAuth, (req, res) => {
  const c = db.prepare("SELECT * FROM cohorts WHERE id = ?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "not found" });
  if (!isMentor(req.params.id, req.userId)) return res.status(403).json({ error: "mentors only" });
  const name = req.body.name != null ? cleanText(req.body.name, 24) : c.name;
  const fullName = req.body.fullName != null ? cleanText(req.body.fullName, 40) : c.full_name;
  const theme = req.body.theme != null ? cleanText(req.body.theme, 16) : c.theme;
  const description = req.body.description != null ? cleanText(req.body.description, 60, true) : c.description;
  db.prepare("UPDATE cohorts SET name=?, full_name=?, theme=?, description=? WHERE id=?")
    .run(name, fullName, theme, description, req.params.id);
  res.json({ id: req.params.id, name, fullName, theme, description });
});

// --- cohort member management (mentor-owned) ---
function mentorCount(cohortId) {
  return db.prepare("SELECT COUNT(*) AS n FROM cohort_members WHERE cohort_id = ? AND role = 'mentor'").get(cohortId).n;
}
function isMentor(cohortId, userId) {
  const m = db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cohortId, userId);
  return !!m && m.role === "mentor";
}
function isMember(cohortId, userId) {
  return !!db.prepare("SELECT 1 FROM cohort_members WHERE cohort_id = ? AND user_id = ? LIMIT 1").get(cohortId, userId);
}
app.patch("/api/cohorts/:id/members/:userId", requireAuth, (req, res) => {
  if (!isMentor(req.params.id, req.userId)) return res.status(403).json({ error: "mentors only" });
  const role = req.body.role === "mentor" ? "mentor" : "mentee";
  const m = db.prepare("SELECT * FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(req.params.id, req.params.userId);
  if (!m) return res.status(404).json({ error: "not a member" });
  if (role === "mentee" && m.role === "mentor" && mentorCount(req.params.id) <= 1) {
    return res.status(409).json({ error: "cohort must keep at least one mentor" });
  }
  db.prepare("UPDATE cohort_members SET role = ? WHERE cohort_id = ? AND user_id = ?").run(role, req.params.id, req.params.userId);
  res.json({ ok: true, role });
});
app.delete("/api/cohorts/:id/members/:userId", requireAuth, (req, res) => {
  if (!isMentor(req.params.id, req.userId)) return res.status(403).json({ error: "mentors only" });
  const m = db.prepare("SELECT * FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(req.params.id, req.params.userId);
  if (!m) return res.status(404).json({ error: "not a member" });
  if (m.role === "mentor" && mentorCount(req.params.id) <= 1) {
    return res.status(409).json({ error: "cohort must keep at least one mentor" });
  }
  db.prepare("DELETE FROM cohort_members WHERE cohort_id = ? AND user_id = ?").run(req.params.id, req.params.userId);
  res.json({ ok: true });
});
// Archive / delete a cohort and its data.
app.delete("/api/cohorts/:id", requireAuth, (req, res) => {
  if (!isMentor(req.params.id, req.userId)) return res.status(403).json({ error: "mentors only" });
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM daily_logs WHERE goal_id IN (SELECT id FROM goals WHERE cohort_id = ?)").run(req.params.id);
    db.prepare("DELETE FROM goals WHERE cohort_id = ?").run(req.params.id);
    db.prepare("DELETE FROM cohort_members WHERE cohort_id = ?").run(req.params.id);
    db.prepare("DELETE FROM cohorts WHERE id = ?").run(req.params.id);
  });
  tx();
  res.json({ ok: true });
});
// Join by invite code.
app.post("/api/cohorts/join", requireAuth, (req, res) => {
  const code = String(req.body.code || "").trim().toLowerCase();
  const userId = req.userId;
  const c = db.prepare("SELECT id FROM cohorts WHERE lower(invite_code) = ?").get(code);
  if (!c) return res.status(404).json({ error: "invalid code" });
  db.prepare(`INSERT OR IGNORE INTO cohort_members (cohort_id,user_id,role,week_pct,streak,logged_today,trend)
                VALUES (?,?,'mentee',0,0,0,0)`).run(c.id, userId);
  onJoin(c.id, userId);
  res.json({ ok: true, cohortId: c.id });
});

// Direct self-join is disabled — cohorts are invite-only (use POST /api/cohorts/join with a code).
app.post("/api/users/:id/cohorts/:cohortId", requireAuth, (req, res) => {
  return res.status(403).json({ error: "cohorts are invite-only — join with an invite code" });
});
app.delete("/api/users/:id/cohorts/:cohortId", requireAuth, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not you" });
  const cid = req.params.cohortId;
  db.prepare("DELETE FROM cohort_members WHERE cohort_id = ? AND user_id = ?").run(cid, req.params.id);
  const remaining = db.prepare("SELECT COUNT(*) AS n FROM cohort_members WHERE cohort_id = ?").get(cid).n;
  let deleted = false;
  if (remaining === 0) {                                   // last member out -> remove the empty cohort
    db.transaction(() => {
      db.prepare("DELETE FROM daily_logs WHERE goal_id IN (SELECT id FROM goals WHERE cohort_id = ?)").run(cid);
      db.prepare("DELETE FROM goals WHERE cohort_id = ?").run(cid);
      db.prepare("DELETE FROM feed_items WHERE cohort_id = ?").run(cid);
      db.prepare("DELETE FROM cohorts WHERE id = ?").run(cid);
    })();
    deleted = true;
  }
  res.json({ ok: true, deleted });
});

// --- friends (connections) ---
app.get("/api/users/:id/friends", (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.name, u.avatar, u.bio
         FROM friends f JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = ? ORDER BY u.name`
    )
    .all(req.params.id);
  res.json(rows);
});
// Send a friend request (consent-based). If the other person already requested you, this accepts it (mutual).
app.post("/api/users/:id/friends/:friendId", requireAuth, friendLimiter, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not you" });
  const me = req.userId, other = req.params.friendId;
  if (me === other) return res.status(400).json({ error: "cannot friend yourself" });
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(other)) return res.status(404).json({ error: "no such user" });
  const already = db.prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?").get(me, other);
  if (already) return res.json({ ok: true, status: "friends" });
  // they already asked you -> accept and become mutual friends
  const reverse = db.prepare("SELECT 1 FROM friend_requests WHERE from_id = ? AND to_id = ?").get(other, me);
  if (reverse) {
    db.transaction(() => {
      db.prepare("INSERT OR IGNORE INTO friends (user_id,friend_id) VALUES (?,?),(?,?)").run(me, other, other, me);
      db.prepare("DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").run(me, other, other, me);
    })();
    notify(other, "friend", me, `${userName(me)} accepted your friend request`, null);
    return res.json({ ok: true, status: "friends" });
  }
  db.prepare("INSERT OR IGNORE INTO friend_requests (from_id,to_id) VALUES (?,?)").run(me, other);
  notify(other, "friend_request", me, `${userName(me)} sent you a friend request`, null);
  res.json({ ok: true, status: "requested" });
});
// Incoming + outgoing pending requests.
app.get("/api/users/:id/friend-requests", requireAuth, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not you" });
  const incoming = db.prepare(
    `SELECT r.id, u.id AS fromId, u.username, u.name, u.avatar, u.bio, r.created_at AS createdAt
       FROM friend_requests r JOIN users u ON u.id = r.from_id
      WHERE r.to_id = ? ORDER BY r.created_at DESC`).all(req.userId);
  const outgoing = db.prepare("SELECT to_id AS toId FROM friend_requests WHERE from_id = ?").all(req.userId).map((r) => r.toId);
  res.json({ incoming, outgoing });
});
// Accept a request from `fromId`.
app.post("/api/friend-requests/accept", requireAuth, friendLimiter, (req, res) => {
  const me = req.userId, from = String(req.body.fromId || "");
  const reqRow = db.prepare("SELECT 1 FROM friend_requests WHERE from_id = ? AND to_id = ?").get(from, me);
  if (!reqRow) return res.status(404).json({ error: "no such request" });
  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO friends (user_id,friend_id) VALUES (?,?),(?,?)").run(me, from, from, me);
    db.prepare("DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").run(from, me, me, from);
  })();
  notify(from, "friend", me, `${userName(me)} accepted your friend request`, null);
  res.json({ ok: true });
});
// Decline (or cancel) a request between you and `fromId`.
app.post("/api/friend-requests/decline", requireAuth, friendLimiter, (req, res) => {
  const me = req.userId, other = String(req.body.fromId || "");
  db.prepare("DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").run(other, me, me, other);
  res.json({ ok: true });
});
app.delete("/api/users/:id/friends/:friendId", requireAuth, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not you" });
  // unfriend both directions, and clear any lingering request either way
  db.prepare("DELETE FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)").run(req.userId, req.params.friendId, req.params.friendId, req.userId);
  db.prepare("DELETE FROM friend_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").run(req.userId, req.params.friendId, req.params.friendId, req.userId);
  res.json({ ok: true });
});

// --- web push subscriptions ---
app.get("/api/push/vapid", (req, res) => res.json({ key: VAPID_PUBLIC, enabled: !!webpush }));
app.post("/api/push/subscribe", requireAuth, (req, res) => {
  const sub = req.body.subscription || req.body;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return res.status(400).json({ error: "invalid subscription" });
  db.prepare(`INSERT INTO push_subscriptions (user_id,endpoint,p256dh,auth) VALUES (?,?,?,?)
              ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth`)
    .run(req.userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  res.json({ ok: true });
});
app.post("/api/push/unsubscribe", requireAuth, (req, res) => {
  const endpoint = (req.body.subscription && req.body.subscription.endpoint) || req.body.endpoint;
  if (endpoint) db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
  res.json({ ok: true });
});

// --- delete account (self only): removes the user and all their data ---
app.delete("/api/users/:id", requireAuth, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not you" });
  const uid = req.userId;
  db.transaction(() => {
    const myCohorts = db.prepare("SELECT cohort_id FROM cohort_members WHERE user_id = ?").all(uid).map((r) => r.cohort_id);
    db.prepare("DELETE FROM cohort_members WHERE user_id = ?").run(uid);
    for (const cid of myCohorts) {
      const remaining = db.prepare("SELECT user_id FROM cohort_members WHERE cohort_id = ? ORDER BY role ASC LIMIT 1").get(cid); // mentor sorts first
      if (!remaining) {                                  // cohort emptied -> delete it and its goals
        db.prepare("DELETE FROM daily_logs WHERE goal_id IN (SELECT id FROM goals WHERE cohort_id = ?)").run(cid);
        db.prepare("DELETE FROM goals WHERE cohort_id = ?").run(cid);
        db.prepare("DELETE FROM feed_items WHERE cohort_id = ?").run(cid);
        db.prepare("DELETE FROM cohorts WHERE id = ?").run(cid);
      } else {                                           // hand cohort goals this user created to a remaining member
        db.prepare("UPDATE goals SET owner_id = ? WHERE cohort_id = ? AND owner_id = ?").run(remaining.user_id, cid, uid);
      }
    }
    db.prepare("DELETE FROM daily_logs WHERE goal_id IN (SELECT id FROM goals WHERE owner_id = ? AND category = 'personal')").run(uid);
    db.prepare("DELETE FROM goals WHERE owner_id = ? AND category = 'personal'").run(uid);
    db.prepare("DELETE FROM daily_logs WHERE user_id = ?").run(uid);   // this user's own logs on any goal
    db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(uid, uid);
    db.prepare("DELETE FROM friend_requests WHERE from_id = ? OR to_id = ?").run(uid, uid);
    db.prepare("DELETE FROM wall_notes WHERE member_id = ? OR from_id = ?").run(uid, uid);
    db.prepare("DELETE FROM feed_items WHERE author_id = ?").run(uid);
    db.prepare("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?").run(uid, uid);
    db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?").run(uid);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(uid);
    db.prepare("DELETE FROM users WHERE id = ?").run(uid);
  })();
  res.json({ ok: true });
});

// --- encouragement wall ---
app.get("/api/users/:id/wall", (req, res) => {
  const rows = db
    .prepare(
      `SELECT w.id, w.from_id AS fromId, u.name AS fromName, w.text, w.created_at AS createdAt
         FROM wall_notes w JOIN users u ON u.id = w.from_id
        WHERE w.member_id = ? ORDER BY w.created_at DESC`
    )
    .all(req.params.id);
  res.json(rows);
});
app.post("/api/users/:id/wall", requireAuth, wallLimiter, (req, res) => {
  const fromId = req.userId;
  const text = cleanText(req.body.text, 280, true);
  if (!text) return res.status(400).json({ error: "text required" });
  const info = db.prepare("INSERT INTO wall_notes (member_id,from_id,text) VALUES (?,?,?)").run(req.params.id, fromId, text);
  notify(req.params.id, "nudge", fromId, `${userName(fromId)}: ${text.slice(0, 80)}`, null);
  res.json({ id: info.lastInsertRowid, ok: true });
});
// Delete a wall note. Allowed for its author, or for the owner of the wall (basic moderation).
app.delete("/api/wall/:noteId", requireAuth, (req, res) => {
  const note = db.prepare("SELECT from_id, member_id FROM wall_notes WHERE id = ?").get(req.params.noteId);
  if (!note) return res.status(404).json({ error: "not found" });
  if (note.from_id !== req.userId && note.member_id !== req.userId) return res.status(403).json({ error: "not yours" });
  db.prepare("DELETE FROM wall_notes WHERE id = ?").run(req.params.noteId);
  res.json({ ok: true });
});

// --- mentor dashboard drill-downs (mentor-only) ---
// Mentee View: one mentee's progress on every cohort goal.
app.get("/api/cohorts/:id/members/:mid/goal-progress", requireAuth, (req, res) => {
  const cid = req.params.id, mid = req.params.mid;
  const meRole = db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, req.userId);
  if (!meRole || meRole.role !== "mentor") return res.status(403).json({ error: "mentors only" });
  const member = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(mid);
  if (!member || !db.prepare("SELECT 1 FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, mid)) return res.status(404).json({ error: "not in cohort" });
  const today = todayIso(userTz(mid));
  const rows = db.prepare("SELECT * FROM goals WHERE category = 'cohort' AND cohort_id = ?").all(cid);
  const goals = rows.map((g) => {
    const series = goalSeries(g.id, mid, 30, today);
    const asm = assembleGoal(g, mid, today);
    return { id: g.id, title: g.title, icon: g.icon, type: g.type, unit: g.unit, dailyMin: g.daily_min, target: g.target,
      streak: asm.streak, weekPct: asm.weekPct, weekDone: asm.weekDone, completion: completionPct(series), series };
  });
  // The mentee's personal goals they've shared with this mentor (visibility-filtered) — same shape as cohort goals.
  const personalGoals = db.prepare("SELECT * FROM goals WHERE owner_id = ? AND category = 'personal'").all(mid)
    .filter((g) => canSeePersonal(g, req.userId))
    .map((g) => {
      const series = goalSeries(g.id, mid, 30, today);
      const asm = assembleGoal(g, mid, today);
      return { id: g.id, title: g.title, icon: g.icon, type: g.type, unit: g.unit, dailyMin: g.daily_min, target: g.target,
        streak: asm.streak, weekPct: asm.weekPct, weekDone: asm.weekDone, completion: completionPct(series), series };
    });
  res.json({ member, goals, personalGoals });
});
// Goal View: every member's progress on one cohort goal.
app.get("/api/cohorts/:id/goals/:gid/member-progress", requireAuth, (req, res) => {
  const cid = req.params.id, gid = req.params.gid;
  const meRole = db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, req.userId);
  if (!meRole || meRole.role !== "mentor") return res.status(403).json({ error: "mentors only" });
  const g = db.prepare("SELECT * FROM goals WHERE id = ? AND cohort_id = ? AND category = 'cohort'").get(gid, cid);
  if (!g) return res.status(404).json({ error: "no such goal" });
  const members = db.prepare("SELECT u.id, u.name, u.avatar, cm.role FROM cohort_members cm JOIN users u ON u.id = cm.user_id WHERE cm.cohort_id = ? ORDER BY cm.role ASC, u.name").all(cid);
  const out = members.map((mem) => {
    const today = todayIso(userTz(mem.id));
    const series = goalSeries(g.id, mem.id, 30, today);
    const asm = assembleGoal(g, mem.id, today);
    const vals = series.map((s) => s.value).filter((v) => v > 0);
    const avgValue = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { id: mem.id, name: mem.name, avatar: mem.avatar, role: mem.role,
      streak: asm.streak, weekPct: asm.weekPct, weekDone: asm.weekDone, completion: completionPct(series), avgValue, series };
  });
  res.json({ goal: { id: g.id, title: g.title, icon: g.icon, type: g.type, unit: g.unit, dailyMin: g.daily_min, target: g.target }, members: out });
});

// Goal History: one mentee's full history on one cohort goal (adaptive window up to `days`, default 365).
app.get("/api/cohorts/:id/members/:mid/goals/:gid/history", requireAuth, (req, res) => {
  const cid = req.params.id, mid = req.params.mid, gid = req.params.gid;
  const meRole = db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, req.userId);
  if (!meRole || meRole.role !== "mentor") return res.status(403).json({ error: "mentors only" });
  let g = db.prepare("SELECT * FROM goals WHERE id = ? AND cohort_id = ? AND category = 'cohort'").get(gid, cid);
  if (!g) { const pg = db.prepare("SELECT * FROM goals WHERE id = ? AND owner_id = ? AND category = 'personal'").get(gid, mid); if (pg && canSeePersonal(pg, req.userId)) g = pg; }
  if (!g) return res.status(404).json({ error: "no such goal" });
  const member = db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").get(mid);
  if (!member || !db.prepare("SELECT 1 FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, mid)) return res.status(404).json({ error: "not in cohort" });
  const days = Math.min(366, Math.max(7, Number(req.query.days) || 365));
  const today = todayIso(userTz(mid));
  const earliest = db.prepare("SELECT MIN(log_date) AS d FROM daily_logs WHERE goal_id = ? AND user_id = ?").get(gid, mid);
  const floorIso = addDaysIso(today, -(days - 1));
  // window starts at the earliest log (so short histories don't render as a year of blanks); min 30-day frame when empty/recent.
  let startIso = earliest && earliest.d ? earliest.d : addDaysIso(today, -29);
  if (startIso < floorIso) startIso = floorIso;
  if (startIso > addDaysIso(today, -29)) startIso = addDaysIso(today, -29); // always show at least ~30 days of frame
  const series = [];
  for (let iso = startIso; iso <= today; iso = addDaysIso(iso, 1)) {
    const r = db.prepare("SELECT value, met FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(gid, mid, iso);
    series.push({ iso, value: r ? r.value : 0, met: r ? (r.met ? 1 : 0) : 0 });
  }
  res.json({ goal: { id: g.id, title: g.title, icon: g.icon, type: g.type, unit: g.unit, dailyMin: g.daily_min, target: g.target }, member, series });
});

// Regenerate a cohort's invite code (mentor only) — invalidates the old code.
app.post("/api/cohorts/:id/invite/regenerate", requireAuth, (req, res) => {
  const cid = req.params.id;
  const role = db.prepare("SELECT role FROM cohort_members WHERE cohort_id = ? AND user_id = ?").get(cid, req.userId);
  if (!role || role.role !== "mentor") return res.status(403).json({ error: "only a mentor can regenerate the invite code" });
  const c = db.prepare("SELECT name FROM cohorts WHERE id = ?").get(cid);
  if (!c) return res.status(404).json({ error: "cohort not found" });
  const base = (c.name || "COHORT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "COHORT";
  const code = `${base}-${100 + Math.floor(Math.random() * 900)}`;
  db.prepare("UPDATE cohorts SET invite_code = ? WHERE id = ?").run(code, cid);
  res.json({ inviteCode: code });
});

// A member's current-week progress on the cohort goals the viewer shares with them (powers the profile "This week" card).
app.get("/api/users/:id/week", requireAuth, (req, res) => {
  const target = req.params.id, viewer = req.userId;
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(target)) return res.status(404).json({ error: "no such user" });
  const today = todayIso(userTz(target));
  const goals = sharedCohortGoals(target, viewer).map((g) => {
    const asm = assembleGoal(g, target, today);
    return { id: g.id, title: g.title, icon: g.icon, type: g.type, unit: g.unit, target: g.target, week: asm.week, values: asm.values, weekDone: asm.weekDone, streak: asm.streak };
  });
  res.json({ goals });
});

// Real all-time summary over a member's cohort goals (mentor-or-self only) — powers the profile "Full history" panel.
app.get("/api/users/:id/history-summary", requireAuth, (req, res) => {
  const target = req.params.id, viewer = req.userId;
  const self = target === viewer;
  if (!self && !mentorsOver(viewer, target)) return res.status(403).json({ error: "mentor only" });
  const today = todayIso(userTz(target));
  const set = sharedCohortGoals(target, viewer);
  const DAYS = 56;
  const seriesSet = set.map((g) => goalSeries(g.id, target, DAYS, today)); // each oldest -> newest
  const n = set.length || 1;
  const weekly = []; let totalMarks = 0; let weeksActive = 0;
  for (let w = 0; w < 8; w++) {
    let met = 0;
    for (let d = 0; d < 7; d++) { const idx = w * 7 + d; seriesSet.forEach((s) => { if (s[idx] && s[idx].met) met++; }); }
    weekly.push({ w: `W${w + 1}`, pct: Math.round((met / (n * 7)) * 100) });
    totalMarks += met; if (met > 0) weeksActive++;
  }
  const bestStreak = set.reduce((m, g) => Math.max(m, assembleGoal(g, target, today).streak), 0);
  res.json({ weekly, totalMarks, bestStreak, weeksActive, goalCount: set.length });
});

// --- feed ---
// scope=cohort -> activity from cohorts the user belongs to; scope=friend -> from the user's friends.
// Pagination: ?before=<epoch seconds> returns items older than that; ?limit caps the page (default 25, max 60).
app.get("/api/feed", (req, res) => {
  const userId = String(req.query.userId || "");
  const scope = String(req.query.scope || "cohort");
  const before = Number(req.query.before) || null;
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 25));
  const minsExpr = "CAST((strftime('%s','now') - fi.created_at)/60 AS INTEGER) AS mins_ago";
  if (scope === "friend") {
    const rows = db
      .prepare(
        `SELECT fi.id, fi.author_id, fi.scope, fi.cohort_id, fi.kind, fi.goal, fi.detail, fi.cheers, fi.created_at AS cursor, ${minsExpr}
           FROM feed_items fi
           WHERE fi.scope = 'friend' AND fi.author_id IN (SELECT friend_id FROM friends WHERE user_id = ?)
             AND (? IS NULL OR fi.created_at < ?)
           ORDER BY fi.created_at DESC LIMIT ?`
      )
      .all(userId, before, before, limit);
    return res.json(rows);
  }
  const rows = db
    .prepare(
      `SELECT fi.id, fi.author_id, fi.scope, fi.cohort_id, fi.kind, fi.goal, fi.detail, fi.cheers, fi.created_at AS cursor, ${minsExpr}
         FROM feed_items fi
         WHERE fi.scope = 'cohort' AND fi.cohort_id IN (SELECT cohort_id FROM cohort_members WHERE user_id = ?)
           AND fi.author_id <> ?
           AND (? IS NULL OR fi.created_at < ?)
         ORDER BY fi.created_at DESC LIMIT ?`
    )
    .all(userId, userId, before, before, limit);
  res.json(rows);
});

// Adjust a feed item's cheer count (delta of +1 / -1).
app.post("/api/feed/:id/cheer", requireAuth, (req, res) => {
  const delta = Number(req.body.delta) === -1 ? -1 : 1;
  const row = db.prepare("SELECT cheers, author_id, goal FROM feed_items WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  const cheers = Math.max(0, row.cheers + delta);
  db.prepare("UPDATE feed_items SET cheers = ? WHERE id = ?").run(cheers, req.params.id);
  if (delta === 1) notify(row.author_id, "cheer", req.userId, `${userName(req.userId)} cheered ${row.goal ? "your " + row.goal : "your activity"}`, null);
  res.json({ ok: true, cheers });
});

// --- notifications ---
app.get("/api/notifications", requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT n.id, n.kind, n.actor_id AS actorId, u.name AS actorName, u.avatar AS actorAvatar, n.text, n.ref, n.read,
            CAST((strftime('%s','now') - n.created_at)/60 AS INTEGER) AS minsAgo
       FROM notifications n LEFT JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 100`
  ).all(req.userId);
  res.json(rows.map((r) => ({ ...r, read: !!r.read })));
});
app.post("/api/notifications/:id/read", requireAuth, (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.json({ ok: true });
});
app.post("/api/notifications/read-all", requireAuth, (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.userId);
  res.json({ ok: true });
});

// --- profile update ---
app.patch("/api/users/:id", requireAuth, (req, res) => {
  if (req.params.id !== req.userId) return res.status(403).json({ error: "not your profile" });
  const u = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });
  const next = {
    name: req.body.name != null ? cleanText(req.body.name, 40) : u.name,
    username: req.body.username != null ? String(req.body.username).toLowerCase().slice(0, 20) : u.username,
    avatar: req.body.avatar !== undefined ? req.body.avatar : u.avatar,
    bio: req.body.bio != null ? cleanText(req.body.bio, 280, true) : u.bio,
  };
  // unique username guard
  const clash = db.prepare("SELECT id FROM users WHERE username = ? AND id <> ?").get(next.username, u.id);
  if (clash) return res.status(409).json({ error: "username taken" });
  let nameChanges = u.name_changes_left;
  if (next.name !== u.name) {
    if (nameChanges <= 0) return res.status(403).json({ error: "no name changes left" });
    nameChanges -= 1;
  }
  db.prepare("UPDATE users SET name=?, username=?, avatar=?, bio=?, name_changes_left=? WHERE id=?")
    .run(next.name, next.username, next.avatar, next.bio, nameChanges, u.id);
  res.json({ ...next, id: u.id, nameChangesLeft: nameChanges });
});

// ----- streak-at-risk scheduler -----
// Once an hour (evenings only), notify anyone whose active streak (>=3) hasn't been kept today.
const STREAK_RISK_HOUR = 18;
const STREAK_RISK_MIN = 3;
function scanStreaksAtRisk({ ignoreHour = false } = {}) {
  const goals = db.prepare("SELECT id, owner_id, title, category, cohort_id, type, daily_min FROM goals").all();
  let created = 0;
  for (const g of goals) {
    const users = g.category === "cohort"
      ? db.prepare("SELECT user_id AS id FROM cohort_members WHERE cohort_id = ?").all(g.cohort_id).map((r) => r.id)
      : [g.owner_id];
    for (const uid of users) {
      const tz = userTz(uid);
      // only remind in the evening of the user's own timezone
      let localHour;
      try { localHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date())); } catch { localHour = new Date().getHours(); }
      if (!ignoreHour && localHour < STREAK_RISK_HOUR) continue;
      const today = todayIso(tz);
      const todayLog = db.prepare("SELECT met FROM daily_logs WHERE goal_id = ? AND user_id = ? AND log_date = ?").get(g.id, uid, today);
      if (todayLog && todayLog.met) continue;                 // already kept today
      const streak = computeStreak(g.id, uid, g.type, g.daily_min, today); // streak ending yesterday
      if (streak < STREAK_RISK_MIN) continue;
      const key = `risk:${g.id}:${uid}:${today}`;
      if (db.prepare("SELECT 1 FROM notifications WHERE user_id = ? AND kind = 'risk' AND ref = ? LIMIT 1").get(uid, key)) continue; // once/day
      db.prepare("INSERT INTO notifications (user_id,kind,actor_id,text,ref) VALUES (?,?,?,?,?)")
        .run(uid, "risk", null, `Your ${streak}-day streak on ${g.title} is at risk — log today to keep it going.`, key);
      created++;
    }
  }
  return created;
}
setInterval(() => scanStreaksAtRisk(), 60 * 60 * 1000);       // hourly
setTimeout(() => scanStreaksAtRisk(), 15000);                 // shortly after boot

// Catches synchronous throws in route handlers (better-sqlite3 is sync) and anything passed to next(err).
app.use((err, req, res, _next) => {
  logError("request", err, req);
  if (res.headersSent) return;
  res.status(500).json({ error: "internal server error" });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Çetele API listening on http://localhost:${PORT}`));
}
module.exports = { app, db };
