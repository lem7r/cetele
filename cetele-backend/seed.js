// Seed data for the Çetele backend. Mirrors the prototype's in-app seed so the
// API returns exactly what the client expects.

const users = [
  { id: "u_murat",  username: "murat",  name: "Murat",       avatar: null, bio: "On a steady streak with the Sunrise crew." },
  { id: "u_selin",  username: "selin",  name: "Selin Aydın", avatar: null, bio: "Mentor. Reading every morning, rain or shine." },
  { id: "u_emir",   username: "emir",   name: "Emir",        avatar: null, bio: "" },
  { id: "u_deniz",  username: "deniz",  name: "Deniz",       avatar: null, bio: "" },
  { id: "u_kaan",   username: "kaan",   name: "Kaan",        avatar: null, bio: "" },
  { id: "u_lina",   username: "lina",   name: "Lina",        avatar: null, bio: "Back at it, one day at a time." },
  { id: "u_yusuf",  username: "yusuf",  name: "Yusuf Demir", avatar: null, bio: "Mentor over at Northstar." },
  { id: "u_okan",   username: "okan",   name: "Okan",        avatar: null, bio: "" },
  { id: "u_aylin",  username: "aylin",  name: "Aylin",       avatar: null, bio: "" },
  { id: "u_baran",  username: "baran",  name: "Baran",       avatar: null, bio: "" },
  { id: "u_zeynep", username: "zeynep", name: "Zeynep",      avatar: null, bio: "" },
  { id: "u_ferda",  username: "ferda",  name: "Ferda",       avatar: null, bio: "" },
  { id: "u_ayse",   username: "ayse",   name: "Ayşe",        avatar: null, bio: "" },
  { id: "u_derya",  username: "derya",  name: "Derya Koç",   avatar: null, bio: "" },
  { id: "u_cansu",  username: "cansu",  name: "Cansu",       avatar: null, bio: "" },
  { id: "u_ece",    username: "ece",    name: "Ece",         avatar: null, bio: "" },
  { id: "u_tarik",  username: "tarik",  name: "Tarık",       avatar: null, bio: "" },
  { id: "u_mert",   username: "mert",   name: "Mert",        avatar: null, bio: "" },
  { id: "u_burak",  username: "burak",  name: "Burak",       avatar: null, bio: "" },
];

const hash = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const inviteFor = (id, name) => {
  const base = (name || "cohort").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "COHORT";
  return `${base}-${100 + (hash(id) % 900)}`;
};

const cohorts = [
  { id: "sunrise",   name: "Sunrise",   full_name: "Sunrise Cohort",   theme: "blue",   marks: 284, target: 350, description: "Mornings, together." },
  { id: "northstar", name: "Northstar", full_name: "Northstar Cohort", theme: "indigo", marks: 252, target: 392, description: "Steady steps, every day." },
  { id: "horizon",   name: "Horizon",   full_name: "Horizon Cohort",   theme: "violet", marks: 318, target: 490, description: "Calm minds, long views." },
].map((c) => ({ ...c, invite_code: inviteFor(c.id, c.name) }));

// [cohort_id, user_id, role, week_pct, streak, logged_today, trend]
const members = [
  ["sunrise","u_selin","mentor",91,34,1,0],
  ["sunrise","u_murat","mentee",83,21,1,0],
  ["sunrise","u_emir","mentee",78,12,1,0],
  ["sunrise","u_deniz","mentee",64,6,1,0],
  ["sunrise","u_kaan","mentee",58,4,1,0],
  ["sunrise","u_lina","mentee",49,2,1,0],
  ["northstar","u_yusuf","mentor",88,40,1,0],
  ["northstar","u_murat","mentor",66,21,1,0],
  ["northstar","u_okan","mentee",81,14,1,5],
  ["northstar","u_aylin","mentee",74,9,1,3],
  ["northstar","u_baran","mentee",52,3,0,-4],
  ["northstar","u_zeynep","mentee",44,5,1,-2],
  ["northstar","u_ferda","mentee",36,0,0,-10],
  ["horizon","u_murat","mentor",58,21,1,0],
  ["horizon","u_ayse","mentee",88,19,1,4],
  ["horizon","u_derya","mentee",80,15,1,2],
  ["horizon","u_cansu","mentee",70,11,1,6],
  ["horizon","u_ece","mentee",62,7,0,-3],
  ["horizon","u_tarik","mentee",41,5,0,-9],
  ["horizon","u_mert","mentee",33,0,0,-12],
  ["horizon","u_burak","mentee",28,1,1,-6],
];

// The current user's tracked goals. `week` is the seed met-pattern (index 6 = today).
const goals = [
  { id:"g1", owner_id:"u_murat", title:"Morning reading", icon:"sunrise",    category:"cohort",   cohort_id:"sunrise",   type:"numeric", unit:"pages",   daily_min:20,   step:5,    target:7, streak:21, vis_type:null,      vis_people:[],                     week:[1,1,1,1,1,1,0] },
  { id:"g2", owner_id:"u_murat", title:"Gratitude note",  icon:"star",       category:"cohort",   cohort_id:"sunrise",   type:"binary",  unit:"",        daily_min:0,    step:0,    target:7, streak:21, vis_type:null,      vis_people:[],                     week:[1,1,1,1,1,1,0] },
  { id:"g6", owner_id:"u_murat", title:"Daily steps",     icon:"footprints", category:"cohort",   cohort_id:"northstar", type:"numeric", unit:"steps",   daily_min:8000, step:2000, target:7, streak:9,  vis_type:null,      vis_people:[],                     week:[1,1,1,1,0,1,0] },
  { id:"g7", owner_id:"u_murat", title:"Meditation",      icon:"leaf",       category:"cohort",   cohort_id:"horizon",   type:"numeric", unit:"minutes", daily_min:10,   step:5,    target:7, streak:5,  vis_type:null,      vis_people:[],                     week:[1,1,0,1,1,0,0] },
  { id:"g8", owner_id:"u_murat", title:"Evening walk",    icon:"walk",       category:"cohort",   cohort_id:"horizon",   type:"binary",  unit:"",        daily_min:0,    step:0,    target:5, streak:3,  vis_type:null,      vis_people:[],                     week:[1,0,1,1,0,1,0] },
  { id:"g3", owner_id:"u_murat", title:"Deep work",       icon:"brain",      category:"personal", cohort_id:null,        type:"numeric", unit:"minutes", daily_min:120,  step:30,   target:5, streak:7,  vis_type:"mentors", vis_people:[],                     week:[1,1,0,1,1,0,0] },
  { id:"g4", owner_id:"u_murat", title:"Workout",         icon:"dumbbell",   category:"personal", cohort_id:null,        type:"binary",  unit:"",        daily_min:0,    step:0,    target:3, streak:4,  vis_type:"people",  vis_people:["u_yusuf","u_aylin"], week:[0,1,0,0,1,0,0] },
  { id:"g5", owner_id:"u_murat", title:"Lights out by 11",icon:"moon",       category:"personal", cohort_id:null,        type:"binary",  unit:"",        daily_min:0,    step:0,    target:7, streak:2,  vis_type:"private", vis_people:[],                     week:[1,0,1,0,1,1,0] },
];

// Derive a plausible per-day value from the seed met-pattern.
// Met day -> a value at/above the minimum; missed day -> 0; today (idx 6) starts unlogged.
const _iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const TODAY = _iso(new Date());
const _addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return _iso(d); };

// Seed real per-member history. Personal goals: the owner's streak ending yesterday.
// Cohort goals: every member of the cohort logs against the shared goal, with a
// per-member adherence taken from their seeded week_pct. Rows: [goal_id, user_id, log_date, value, met]
const _h = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
const memberPct = {};                       // cohort_id -> { user_id -> week_pct }
const cohortMembers = {};                    // cohort_id -> [user_id]
for (const [cid, uid, , pct] of members) { (memberPct[cid] = memberPct[cid] || {})[uid] = pct; (cohortMembers[cid] = cohortMembers[cid] || []).push(uid); }

const logs = [];
for (const g of goals) {
  const v = g.type === "binary" ? 1 : g.daily_min + g.step;
  if (g.category === "cohort" && cohortMembers[g.cohort_id]) {
    for (const uid of cohortMembers[g.cohort_id]) {
      const P = memberPct[g.cohort_id][uid] ?? 60;
      for (let d = 0; d <= 13; d++) {            // last 14 days incl. today
        if (_h(`${g.id}:${uid}:${d}`) % 100 < P) logs.push([g.id, uid, _addDays(TODAY, -d), v, 1]);
      }
    }
  } else {
    for (let d = 1; d <= g.streak; d++) logs.push([g.id, g.owner_id, _addDays(TODAY, -d), v, 1]);
  }
}

// Murat's friends (connections layer). [user_id, friend_id]
const friends = [
  ["u_murat", "u_yusuf"],
  ["u_murat", "u_derya"],
  ["u_murat", "u_lina"],
];

// Encouragement notes. [member_id, from_id, text]
const wallNotes = [
  ["u_emir", "u_selin", "Your consistency is contagious. Keep going."],
  ["u_lina", "u_murat", "Welcome back! One day at a time."],
];

// Seeded activity. [id, author_id, scope, cohort_id, kind, goal, detail, mins_ago, cheers]
const feedItems = [
  ["f1", "u_selin", "cohort", "sunrise", "cheer", "", "cheered Emir's 12-day streak", 8, 5],
  ["f2", "u_emir", "cohort", "sunrise", "log", "Morning reading", "25 pages before work", 22, 2],
  ["f3", "u_lina", "cohort", "sunrise", "milestone", "Gratitude note", "first full week back", 40, 7],
  ["ff1", "u_yusuf", "friend", null, "streak", "Daily steps", "hit a 40-day streak", 18, 6],
  ["ff2", "u_derya", "friend", null, "log", "Meditation", "15 minutes before sunrise", 54, 3],
  ["ff3", "u_lina", "friend", null, "milestone", "Morning reading", "finished her first full week back", 120, 9],
  ["ff4", "u_yusuf", "friend", null, "log", "Deep work", "a focused 2-hour block", 200, 2],
];

module.exports = { users, cohorts, members, goals, logs, friends, wallNotes, feedItems };
