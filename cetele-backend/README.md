# Çetele backend

A small REST service backing Çetele: **search** (usernames + cohorts), **per-day goal logs** keyed by real calendar date, cohort lifecycle, friends, walls, and feed. SQLite for storage, Express for the API. The schema is written to port cleanly to Postgres.

## Run

```bash
cd cetele-backend
npm install
npm run start        # http://localhost:4000  (creates + seeds cetele.db on first run)
npm run reset        # wipe the db file to reseed from scratch
```

## Data model

| Table | Purpose |
|---|---|
| `users` | people; `username` is the handle; `password_hash`+`salt` back sign-in |
| `sessions` | bearer tokens issued at login/sign-up |
| `cohorts` | groups |
| `cohort_members` | per-cohort role + weekly rollups (one person, many cohorts) |
| `goals` | the owner's tracked habits |
| `daily_logs` | **one row per goal per user per day** — cohort goals are shared templates each member logs against |
| `friends` | the connections layer (look-up + add people), independent of cohorts || `wall_notes` | encouragement / motivation left on a person's wall |
| `feed_items` | seeded activity, queryable by `scope` (cohort vs friend) |

`daily_logs` is keyed by `(goal_id, user_id, log_date)` — real calendar dates, one row per goal per member per day. Cohort goals are **shared**: every member of the cohort logs their own progress against the same goal. The current Sun–Sat week, `streak`, and all cohort standings are computed from these logs at query time.

**Edit window.** `POST /api/goals/:id/logs` only accepts today and the 2 prior calendar days; future dates and anything older return `403`. The client enforces the same rule so locked days render read-only.

**Cohort themes.** `cohorts.theme` (default `'pine'`) is a soft identity color — `pine`, `blue`, `violet`, `indigo`, `sage`, `slate` — that the client uses to tint a cohort's shared goals and headers. It's settable on create and via `PATCH /api/cohorts/:id`.

**Invite codes.** Each cohort has an `invite_code` (e.g. `SUNRISE-877`), generated from its name plus an id hash. The same formula runs client-side, so a code shown in the app resolves on the server via `POST /api/cohorts/join`.

## Auth & visibility

Sign-in is required for every mutation and for reading goals. `POST /api/auth/signup` and `/login` return a bearer **token**; send it as `Authorization: Bearer <token>`. Passwords are hashed with scrypt + a per-user salt; sessions live in the `sessions` table. Seeded demo accounts (e.g. `@murat`) use password **`cetele`**.

Every mutation is authorized server-side: you can only log/edit/delete your own goals (or log a cohort goal you're a member of), edit your own profile, and manage your own friends; cohort edits/roles/removal/archive require being a **mentor** of that cohort. Personal-goal **visibility** (`private` / `mentors` / `cohort` / `people` / `everyone`) is enforced when another user reads your goals.

**Dates are per-user and timezone-aware.** The client sends its IANA timezone (stored on the user row); the server computes each user's logical "today" in that zone, with a **4am day boundary** so late-night logging counts toward the day before. The edit window (today + 2 prior days) and streaks are evaluated against that logical date.

The feed is **generated from real actions**: a met log emits a cohort/friend event (streak-milestone, week-complete, or a plain log — deduped per goal/day, and personal goals only when their visibility permits); joining a cohort posts a join event. Notifications are generated when someone cheers your activity, leaves you a note, joins a cohort you mentor, or a mentor adds a cohort goal. An hourly **streak-at-risk** scheduler (evenings, in each user's own timezone) also notifies anyone whose active streak (≥3 days) hasn't been kept today — deduped per goal/day. Each goal additionally carries a 30-day `history` map for the client's progress charts.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| POST | `/api/auth/signup` | `{ username, name, password }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ username, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | end the current session |
| GET | `/api/auth/me` | the signed-in user |
| GET | `/api/search?q=&type=all\|users\|cohorts` | `{ users:[…], cohorts:[…] }`; matches username/name and cohort name |
| GET | `/api/cohorts` | all cohorts with `memberCount` + `lead` |
| GET | `/api/cohorts/full` | full cohorts **with member standings computed from real logs** — each member's `weekPct` (trailing-7-day adherence), `streak`, `loggedToday`, plus collective `marks` this week |
| GET | `/api/users/:id` | one user |
| GET | `/api/users/:id/goals` | **auth required.** Your own tab → personal + your cohorts' shared goals, assembled from your logs. Another user → only their personal goals you're allowed to see (visibility-filtered) |
| POST | `/api/goals/:id/logs` | **auth required.** body `{ date, value }` → upserts *your* log for that day. Personal goals: owner only. Cohort goals: any member. Rejects future dates / days past the edit window |
| GET | `/api/users/:id/friends` | the user's friends |
| POST / DELETE | `/api/users/:id/friends/:friendId` | add / remove a friend |
| GET | `/api/users/:id/wall` | encouragement notes on a wall |
| POST | `/api/users/:id/wall` | body `{ fromId, text }` → leave a note |
| GET | `/api/feed?userId=&scope=cohort\|friend` | activity newest-first; cohort scope excludes your own events |
| POST | `/api/feed/:id/cheer` | body `{ delta }` (+1/-1) → adjusts a feed item's cheer count; on +1 notifies the author |
| GET | `/api/notifications` | **auth.** your inbox, newest-first, with actor + `minsAgo` + `read` |
| POST | `/api/notifications/:id/read` | mark one notification read |
| POST | `/api/notifications/read-all` | mark all read |
| PATCH | `/api/users/:id` | update name/username/avatar/bio (enforces unique handle + remaining name changes) |
| POST | `/api/cohorts` | body `{ name, fullName, theme, description, ownerId }` → creates a cohort (with a generated `inviteCode`), makes `ownerId` its mentor |
| PATCH | `/api/cohorts/:id` | update name/fullName/theme/description |
| PATCH | `/api/cohorts/:id/members/:userId` | body `{ role }` → promote/demote (keeps ≥1 mentor) |
| DELETE | `/api/cohorts/:id/members/:userId` | remove a member (keeps ≥1 mentor) |
| DELETE | `/api/cohorts/:id` | archive: deletes the cohort and its members, goals, and logs |
| POST | `/api/cohorts/join` | body `{ code, userId }` → join by invite code |
| POST | `/api/users/:id/cohorts/:cohortId` | join |
| DELETE | `/api/users/:id/cohorts/:cohortId` | leave |

### Logging a day

`POST /api/goals/g6/logs { "date": "2026-06-13", "value": 9000 }` sets that day's steps. The server recomputes `met` (`value >= daily_min` for numeric, `value >= 1` for binary) and adjusts the goal's `streak`, then returns the full goal with its refreshed 7-day arrays. This is exactly the shape the client renders.

## Wiring the app to this server

The app talks to a data layer through a single `api` object. In the artifact sandbox it runs against an embedded in-memory mirror of this contract (the preview can't reach `localhost`). To use this server instead, open the app's **Settings → Data source**, switch to **Server**, enter the URL (default `http://localhost:4000`), and tap **Test connection** — the toggle flips `API_BASE` at runtime, so no code edit is needed. The same calls (`api.search`, `api.loadGoals`, `api.setLog`, the cohort/friend/profile mutations) hit these endpoints, and the JSON shapes are identical (camelCase: `cohortId`, `dailyMin`, `values`, `week`, `icon`). CORS is enabled for browser access, and `GET /api/health` backs the connection indicator.
