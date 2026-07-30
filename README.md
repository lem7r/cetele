# Çetele

**Çetele** (Turkish for *tally*) is a mobile-first, cohort-based goal and habit tracker. A çetele is a running tally — a simple mark for each day you show up — and the app turns that into habits people keep *together*. Its guiding idea is **reciprocity over surveillance**: members of a cohort see each other's weekly progress and cheer each other on, while a mentor sets shared goals for the group.

> Status: live · both halves deployed on Render · actively developed.

---

## What it does

- **Cohorts** — join a cohort and its mentor sets shared goals; everyone tallies their own progress. Roles are mentor/mentee, with per-cohort themes and invite codes.
- **Goals** — binary ("done / not done") or numeric (log an amount like pages or minutes). Five per-goal visibility levels: private, mentors-only, cohort, specific people, or everyone.
- **Streaks & tallies** — daily logging with a 4am day boundary, streak tracking, weekly targets, and a 30-day history.
- **Mentor dashboard** — per-mentee drill-downs, per-goal comparison across a cohort, 7-day trends, and full history charts.
- **Social layer** — friends and friend requests, an encouragement wall, an activity feed with cheers, and mentor nudges.
- **Accounts** — sign-up/sign-in with sessions, password reset via recovery codes, and account deletion.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React + Vite, Tailwind, Recharts, lucide-react |
| Backend | Node.js + Express |
| Database | SQLite (via `better-sqlite3`) — a single file on a persistent disk |
| Auth | scrypt password hashing, bearer-token sessions |
| Hosting | Render (Web Service for the API, Static Site for the app) |

## Repository layout

```
cetele/
├── cetele-app/          # React + Vite frontend (the whole UI lives in src/App.jsx)
├── cetele-backend/      # Node + Express API
│   ├── server.js        # the entire API
│   ├── schema.sql       # database schema
│   ├── seed.js          # demo seed data (dev only)
│   └── test/            # node:test integration suite
└── README.md
```

## Local development

Two terminals — the backend and the frontend run separately.

**Backend** (port 4000):

```bash
cd cetele-backend
npm install
npm start            # auto-creates and seeds cetele.db in dev
```

Useful backend scripts:

```bash
npm run dev          # auto-restart on change
npm run reset        # delete the local database
npm test             # run the integration suite (node:test)
```

**Frontend** (port 5173):

```bash
cd cetele-app
npm install
npm run dev          # then open http://localhost:5173
```

By default the app boots in **demo mode** (fully in-browser, seeded sample data, no backend needed). To use the real backend, open **Settings → Data source** and switch to **Server**, or set the default in `src/App.jsx`.

## Testing

The backend ships a dependency-free integration suite that boots the real API on an ephemeral port against a throwaway database and exercises auth, validation, rate limiting, goal-bound clamping, wall posts, personal-goal visibility, and the mentor/permission gates:

```bash
cd cetele-backend
npm test
```

## Environment variables (backend)

All optional in development; set the relevant ones in production.

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `NODE_ENV` | Set to `production` to disable demo seeding | — |
| `SEED_DEMO` | `0` to start with an empty database, `1` to force seeding | seeds off in production |
| `CETELE_DB` | Path to the SQLite file (point at a persistent disk in production) | `./cetele.db` |
| `DEMO_PASSWORD` | Shared password for seeded dev accounts | `cetele` |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | Web-push keys | — |

## Deployment (Render)

- **Backend** — a **Web Service** with root directory `cetele-backend`, build `npm install`, start `npm start`. Attach a **persistent disk** (e.g. mounted at `/var/data`) and set `CETELE_DB=/var/data/cetele.db` so the database survives restarts. Set `NODE_ENV=production` and `SEED_DEMO=0` for a clean database.
- **Frontend** — a **Static Site** with root directory `cetele-app`, build `npm install && npm run build`, publish directory `dist`.

## Versioning

Semantic versioning. Releases through the initial prototype are tracked as **1.1.x** (the `1.1.32` prototype is the deployed baseline); active development continues from **1.2.0**.

## Roadmap

Turkish localization · real-user testing · native Android build (Capacitor → Google Play) · iOS to follow (requires macOS/Xcode).

---

*Built as both a real product for a specific community and a portfolio project — full ownership from PRD and design through a working, deployed full-stack app.*
