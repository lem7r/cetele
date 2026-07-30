-- Çetele backend schema (SQLite; portable to Postgres with minor type tweaks)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- People. The username is the searchable handle.
CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  username          TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  avatar            TEXT,                       -- default-photo id (e.g. 'av3') or NULL for initials
  bio               TEXT NOT NULL DEFAULT '',
  name_changes_left INTEGER NOT NULL DEFAULT 2,
  tz                TEXT,                        -- IANA timezone (from the client) for per-user date math
  password_hash     TEXT,                       -- scrypt hash (hex); NULL only for legacy rows
  salt              TEXT                        -- per-user random salt (hex)
);

-- Bearer-token sessions. Token is the opaque credential the client stores and sends.
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_name     ON users(name);

CREATE TABLE IF NOT EXISTS cohorts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  theme       TEXT NOT NULL DEFAULT 'pine',
  invite_code TEXT NOT NULL DEFAULT '',
  marks       INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cohorts_name      ON cohorts(name);
CREATE INDEX IF NOT EXISTS idx_cohorts_full_name ON cohorts(full_name);

-- Membership carries the per-cohort role and that member's weekly rollups.
CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id    TEXT NOT NULL REFERENCES cohorts(id),
  user_id      TEXT NOT NULL REFERENCES users(id),
  role         TEXT NOT NULL CHECK (role IN ('mentor','mentee')),
  week_pct     INTEGER NOT NULL DEFAULT 0,
  streak       INTEGER NOT NULL DEFAULT 0,
  logged_today INTEGER NOT NULL DEFAULT 0,
  trend        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cohort_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user   ON cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_cohort ON cohort_members(cohort_id);

CREATE TABLE IF NOT EXISTS goals (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id),
  title      TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'target',
  category   TEXT NOT NULL CHECK (category IN ('cohort','personal')),
  cohort_id  TEXT REFERENCES cohorts(id),
  type       TEXT NOT NULL CHECK (type IN ('binary','numeric')),
  unit       TEXT NOT NULL DEFAULT '',
  daily_min  INTEGER NOT NULL DEFAULT 0,
  step       INTEGER NOT NULL DEFAULT 0,
  target     INTEGER NOT NULL DEFAULT 7,
  streak     INTEGER NOT NULL DEFAULT 0,
  vis_type   TEXT,
  vis_people TEXT NOT NULL DEFAULT '[]'         -- JSON array of user ids
);
CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_id);

-- One row per goal per day of the tracked week.
-- daily_logs is keyed by real calendar date (log_date, ISO YYYY-MM-DD), one row
-- per goal per day. The current Sun–Sat week is computed at query time.
CREATE TABLE IF NOT EXISTS daily_logs (
  goal_id   TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id),  -- who logged it (cohort goals are shared, logged per member)
  log_date  TEXT NOT NULL,                      -- ISO calendar date YYYY-MM-DD
  value     REAL NOT NULL DEFAULT 0,            -- binary: 0/1, numeric: the logged amount
  met       INTEGER NOT NULL DEFAULT 0,         -- 1 when the day's condition is satisfied
  PRIMARY KEY (goal_id, user_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_logs_user ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_goal ON daily_logs(goal_id);

-- Lightweight connections layer, independent of cohorts/mentorship.
CREATE TABLE IF NOT EXISTS friends (
  user_id   TEXT NOT NULL REFERENCES users(id),
  friend_id TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY (user_id, friend_id)
);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);

-- Encouragement / motivation notes left on a person's wall.
CREATE TABLE IF NOT EXISTS wall_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id  TEXT NOT NULL REFERENCES users(id),   -- whose wall
  from_id    TEXT NOT NULL REFERENCES users(id),   -- who wrote it
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_wall_member ON wall_notes(member_id);

-- Activity feed items. scope='cohort' items belong to a cohort; scope='friend'
-- items are surfaced to a user's friends. Real systems generate these from logs;
-- here they are seeded and queryable.
CREATE TABLE IF NOT EXISTS feed_items (
  id        TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  scope     TEXT NOT NULL CHECK (scope IN ('cohort','friend')),
  cohort_id TEXT REFERENCES cohorts(id),
  kind      TEXT NOT NULL,                         -- log | streak | complete | join | milestone
  goal      TEXT NOT NULL DEFAULT '',
  detail    TEXT NOT NULL DEFAULT '',
  mins_ago  INTEGER NOT NULL DEFAULT 0,            -- seed-only; live rows compute from created_at
  cheers    INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  event_key  TEXT UNIQUE                           -- dedup key for generated events (NULL for seed)
);
CREATE INDEX IF NOT EXISTS idx_feed_created ON feed_items(created_at);

-- Notifications: one row per recipient per event.
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),   -- recipient
  kind       TEXT NOT NULL,                         -- cheer | nudge | join | new_goal
  actor_id   TEXT REFERENCES users(id),             -- who triggered it
  text       TEXT NOT NULL,
  ref        TEXT,                                   -- optional cohort id / goal title
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_scope  ON feed_items(scope);
CREATE INDEX IF NOT EXISTS idx_feed_author ON feed_items(author_id);
