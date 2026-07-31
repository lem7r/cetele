import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  Flame, Heart, Check, Users, Home, BarChart3, Sparkles, ChevronLeft,
  Trophy, Send, Star, Sunrise, Dumbbell, Brain, Moon, Plus, Minus, X,
  Lock, Globe, GraduationCap, UserPlus, Target, ChevronRight, ChevronDown,
  Footprints, MoreHorizontal, Trash2, Pencil, Leaf, Bell, TrendingUp, Clock,
  TrendingDown, AlertCircle, LogOut, Ticket, Compass,
  Settings as SettingsIcon, RotateCcw, Languages, Database, ShieldCheck, Type, Search as SearchIcon,
  Copy, UserMinus, Archive, KeyRound, BellRing, RefreshCw,
} from "lucide-react";

/* ---- tokens ---- */
const INK="#1c1917",INK2="#57534e",INK3="#a8a29e";
const PINE="#0f766e",PINE_DEEP="#115e4a",PINE_SOFT="#ccfbf1",FRESH="#5eada3",MINT="#f0fdf9",MINT_BORDER="#86efc8";
const STREAK="#b45309",STREAK_SOFT="#fff7ed";
const CHEER="#e11d48",CHEER_SOFT="#fff1f2";
const CANVAS="#faf9f7",CARD="#ffffff",SUNKEN="#f5f4f2",BORDER="#f0eeec",BORDER2="#e7e5e4";
const FU="'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const FD="'Fraunces', Georgia, serif";
const E2="0 8px 24px rgba(28,25,23,.12)";

const AVATAR_TINTS=[{bg:"#ccfbf1",fg:"#0f766e"},{bg:"#ffedd5",fg:"#c2410c"},{bg:"#fce7f3",fg:"#be185d"},{bg:"#e0e7ff",fg:"#4338ca"},{bg:"#dcfce7",fg:"#15803d"},{bg:"#fef9c3",fg:"#a16207"}];
const tintFor=(n)=>AVATAR_TINTS[[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%AVATAR_TINTS.length];

const DEFAULT_ME="u_murat";
let ME=DEFAULT_ME;                 // current user id; updated via setMe on account switch
const setMe=(id)=>{ME=id;};

const COHORTS={
  sunrise:{id:"sunrise",name:"Sunrise",fullName:"Sunrise Cohort",theme:"blue",marks:284,target:350,members:[
    {id:"u_selin",name:"Selin Aydın",role:"mentor",weekPct:91,streak:34},
    {id:ME,name:"Murat",role:"mentee",weekPct:83,streak:21},
    {id:"u_emir",name:"Emir",role:"mentee",weekPct:78,streak:12},
    {id:"u_deniz",name:"Deniz",role:"mentee",weekPct:64,streak:6},
    {id:"u_kaan",name:"Kaan",role:"mentee",weekPct:58,streak:4},
    {id:"u_lina",name:"Lina",role:"mentee",weekPct:49,streak:2},
  ]},
  northstar:{id:"northstar",name:"Northstar",fullName:"Northstar Cohort",theme:"indigo",marks:252,target:392,members:[
    {id:"u_yusuf",name:"Yusuf Demir",role:"mentor",weekPct:88,streak:40},
    {id:ME,name:"Murat",role:"mentor",weekPct:66,streak:21},
    {id:"u_okan",name:"Okan",role:"mentee",weekPct:81,streak:14,loggedToday:true,trend:5},
    {id:"u_aylin",name:"Aylin",role:"mentee",weekPct:74,streak:9,loggedToday:true,trend:3},
    {id:"u_baran",name:"Baran",role:"mentee",weekPct:52,streak:3,loggedToday:false,trend:-4},
    {id:"u_zeynep",name:"Zeynep",role:"mentee",weekPct:44,streak:5,loggedToday:true,trend:-2},
    {id:"u_ferda",name:"Ferda",role:"mentee",weekPct:36,streak:0,loggedToday:false,trend:-10},
  ]},
  horizon:{id:"horizon",name:"Horizon",fullName:"Horizon Cohort",theme:"violet",marks:318,target:490,members:[
    {id:ME,name:"Murat",role:"mentor",weekPct:58,streak:21},
    {id:"u_ayse",name:"Ayşe",role:"mentee",weekPct:88,streak:19,loggedToday:true,trend:4},
    {id:"u_derya",name:"Derya Koç",role:"mentee",weekPct:80,streak:15,loggedToday:true,trend:2},
    {id:"u_cansu",name:"Cansu",role:"mentee",weekPct:70,streak:11,loggedToday:true,trend:6},
    {id:"u_ece",name:"Ece",role:"mentee",weekPct:62,streak:7,loggedToday:false,trend:-3},
    {id:"u_tarik",name:"Tarık",role:"mentee",weekPct:41,streak:5,loggedToday:false,trend:-9},
    {id:"u_mert",name:"Mert",role:"mentee",weekPct:33,streak:0,loggedToday:false,trend:-12},
    {id:"u_burak",name:"Burak",role:"mentee",weekPct:28,streak:1,loggedToday:true,trend:-6},
  ]},
};
const COHORTS_SEED=JSON.parse(JSON.stringify(COHORTS));
const cohortIds=()=>Object.keys(COHORTS);
const fmtAgo=(m)=>{                     // compact relative time: min -> h m -> d -> w -> mo -> y
  m=Math.max(0,Math.floor(m||0));
  if(m<1)return "just now";
  if(m<60)return `${m}m`;
  if(m<1440){const h=Math.floor(m/60),mm=m%60;return mm?`${h}h ${mm}m`:`${h}h`;}
  const d=Math.floor(m/1440);
  if(d<7)return `${d}d`;
  if(d<30)return `${Math.floor(d/7)}w`;
  if(d<365)return `${Math.floor(d/30)}mo`;
  return `${Math.floor(d/365)}y`;
};
const fmtAgoLabel=(m)=>{const s=fmtAgo(m);return s==="just now"?s:`${s} ago`;};
const inviteCode=(id)=>{const c=COHORTS[id];if(!c)return"";if(c.inviteCode)return c.inviteCode;if(API_BASE)return"";const base=(c.name||"cohort").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8)||"COHORT";return `${base}-${100+(hash(id)%900)}`;};
const cohortByCode=(code)=>{const q=(code||"").trim().toLowerCase();return cohortIds().find((id)=>inviteCode(id).toLowerCase()===q);};
const DEFAULT_SUBS=["sunrise","northstar","horizon"];
const cohortName=(id)=>COHORTS[id]?.name||"Cohort";

const myRoleIn=(cid)=>COHORTS[cid]?.members.find((m)=>m.id===ME)?.role;
const mentorCohorts=()=>Object.keys(COHORTS).filter((cid)=>myRoleIn(cid)==="mentor");
const isMentorOfCohort=(cid)=>myRoleIn(cid)==="mentor";
const canMentorView=(memberId)=>memberId===ME||mentorCohorts().some((cid)=>COHORTS[cid].members.some((m)=>m.id===memberId));

/* cohort themes — soft, on-brand identity tints (amber/rose stay reserved for streaks/cheers) */
const THEMES={
  pine:  {label:"Pine",   soft:PINE_SOFT, border:MINT_BORDER, accent:PINE_DEEP, dot:PINE},
  blue:  {label:"Ocean",  soft:"#e0f2fe", border:"#bae6fd", accent:"#0369a1", dot:"#0284c7"},
  violet:{label:"Iris",   soft:"#ede9fe", border:"#ddd6fe", accent:"#6d28d9", dot:"#7c3aed"},
  indigo:{label:"Indigo", soft:"#e0e7ff", border:"#c7d2fe", accent:"#4338ca", dot:"#6366f1"},
  sage:  {label:"Sage",   soft:"#ecfccb", border:"#d9f99d", accent:"#4d7c0f", dot:"#65a30d"},
  slate: {label:"Slate",  soft:"#e2e8f0", border:"#cbd5e1", accent:"#334155", dot:"#475569"},
};
const THEME_KEYS=Object.keys(THEMES);
const themeOf=(cohortId)=>THEMES[(COHORTS[cohortId]&&COHORTS[cohortId].theme)||"pine"];

/* member lookup is computed live from the current cohort store, so role changes,
   removals, and created cohorts are reflected everywhere it's referenced. */
const memberById=(id)=>{
  for(const cid of Object.keys(COHORTS)){const m=COHORTS[cid].members.find((x)=>x.id===id);if(m)return m;}
  const u=(typeof USER_BY_ID!=="undefined")&&USER_BY_ID[id];if(u)return {id,name:u.name,role:"mentee"};
  const c=(typeof USER_CACHE!=="undefined")&&USER_CACHE[id];if(c)return {id,name:c.name||("@"+(c.username||"")),role:"mentee"};
  return {id,name:"Someone",role:"mentee"};
};
const dispName=(id,profile)=>id===ME?profile.name:(memberById(id)?.name||"Someone");
const dispPfp=(id,profile)=>id===ME?profile.avatar:null;


const VIS={
  private:{label:"Just me",Icon:Lock},
  cohort:{label:"My cohort",Icon:Users},
  mentors:{label:"Mentors only",Icon:GraduationCap},
  people:{label:"Specific Friends",Icon:UserPlus},
  everyone:{label:"Everyone",Icon:Globe},
};

/* serializable icon registry — goals store an icon NAME (a string), and the
   component is resolved at render. This lets full goal definitions persist. */
const ICONS={Sunrise,Star,Footprints,Leaf,Brain,Dumbbell,Moon,Target,Flame,Heart,Trophy,Sparkles,Bell,Compass,Users,UserPlus};
const ICON_KEYS=Object.keys(ICONS);
const iconOf=(name)=>{if(!name)return Target;if(ICONS[name])return ICONS[name];const cap=name.charAt(0).toUpperCase()+name.slice(1).toLowerCase();return ICONS[cap]||Target;};

const SEED_GOALS=[
  {id:"g1",title:"Morning reading",icon:"Sunrise",category:"cohort",cohortId:"sunrise",type:"numeric",unit:"pages",dailyMin:20,step:5,todayValue:0,target:7,streak:21,week:[1,1,1,1,1,1,0]},
  {id:"g2",title:"Gratitude note",icon:"Star",category:"cohort",cohortId:"sunrise",type:"binary",unit:"",todayValue:0,target:7,streak:21,week:[1,1,1,1,1,1,0]},
  {id:"g6",title:"Daily steps",icon:"Footprints",category:"cohort",cohortId:"northstar",type:"numeric",unit:"steps",dailyMin:8000,step:2000,todayValue:0,target:7,streak:9,week:[1,1,1,1,0,1,0]},
  {id:"g7",title:"Meditation",icon:"Leaf",category:"cohort",cohortId:"horizon",type:"numeric",unit:"minutes",dailyMin:10,step:5,todayValue:0,target:7,streak:5,week:[1,1,0,1,1,0,0]},
  {id:"g8",title:"Evening walk",icon:"Footprints",category:"cohort",cohortId:"horizon",type:"binary",unit:"",todayValue:0,target:5,streak:3,week:[1,0,1,1,0,1,0]},
  {id:"g3",title:"Deep work",icon:"Brain",category:"personal",type:"numeric",unit:"minutes",dailyMin:120,step:30,todayValue:0,target:5,streak:7,week:[1,1,0,1,1,0,0],vis:{type:"mentors",people:[]}},
  {id:"g4",title:"Workout",icon:"Dumbbell",category:"personal",type:"binary",unit:"",todayValue:0,target:3,streak:4,week:[0,1,0,0,1,0,0],vis:{type:"people",people:["p_yusuf","p_aylin"]}},
  {id:"g5",title:"Lights out by 11",icon:"Moon",category:"personal",type:"binary",unit:"",todayValue:0,target:7,streak:2,week:[1,0,1,0,1,1,0],vis:{type:"private",people:[]}},
];

const SEED_FEED=[
  {id:"f1",who:"u_selin",kind:"streak",goal:"Morning pages",detail:"hit a 34-day streak",mins:18,cheers:5,cheered:false},
  {id:"f2",who:"u_emir",kind:"log",goal:"Deep work",detail:"logged 2 hours",mins:42,cheers:3,cheered:false},
  {id:"f3",who:"u_lina",kind:"comeback",goal:"Workout",detail:"back on track after a rough week",mins:75,cheers:8,cheered:true},
  {id:"f4",who:"u_selin",kind:"cheer",goal:null,detail:"“Proud of how this week is shaping up, everyone 👏”",mins:90,cheers:6,cheered:false},
  {id:"f5",who:"u_deniz",kind:"log",goal:"Gratitude note",detail:"logged today's entry",mins:130,cheers:2,cheered:false},
  {id:"f6",who:"u_kaan",kind:"milestone",goal:"Reading",detail:"finished his first book of the cohort",mins:180,cheers:9,cheered:false},
];
const WALL_SEED={u_murat:[{id:"ws1",from:"u_selin",text:"Your consistency is contagious — the whole crew feels it."},{id:"ws2",from:"u_yusuf",text:"Proud of how you showed up this week. Keep the tally going."}],u_emir:[{id:"ws3",from:"u_selin",text:"Your consistency is contagious. Keep going."}],u_lina:[{id:"ws4",from:ME,text:"Welcome back! One day at a time 💪"}]};
const MILESTONES=[7,14,30,60,100,200,365];
const NUDGE_PRESETS=["Checking in — how's your week going?","You've got this. Just one entry today.","Noticed you're a bit behind — anything I can help with?","Proud of the effort. Keep the streak alive."];

/* ===== real calendar week ===== */
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const isoOf=(d)=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10);};
const DAY_START_HOUR=4;                       // a logical day starts at 4am local (matches the server)
const USER_TZ=(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{return "UTC";}})();
const logicalNow=()=>new Date(Date.now()-DAY_START_HOUR*3600000);
const TODAY_ISO=isoOf(logicalNow());
const addDaysIso=(iso,n)=>{const d=new Date(iso+"T00:00:00");d.setDate(d.getDate()+n);return isoOf(d);};
/* the week containing today; the start day (Sun/Mon) is user-configurable via applyWeekStart */
const dowIndex=(iso)=>new Date(iso+"T00:00:00").getDay();               // 0=Sun..6=Sat (server week arrays are indexed this way)
let WEEK_START_MON=false;
const weekStartOffset=(iso)=>{const d=dowIndex(iso);return WEEK_START_MON?((d+6)%7):d;};
let WEEK_START_ISO=addDaysIso(TODAY_ISO,-weekStartOffset(TODAY_ISO));
let WEEK_ISO=Array.from({length:7},(_,i)=>addDaysIso(WEEK_START_ISO,i));
let WEEK_DAYS=WEEK_ISO.map((iso)=>{const d=new Date(iso+"T00:00:00");return {d:DOW[d.getDay()],n:d.getDate(),iso};});
let TODAY_INDEX=WEEK_ISO.indexOf(TODAY_ISO);
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtMD=(iso)=>`${MONTHS[+iso.slice(5,7)-1]} ${+iso.slice(8,10)}`;
let WEEK_LABEL=`${fmtMD(WEEK_ISO[0])} – ${WEEK_ISO[0].slice(0,7)===WEEK_ISO[6].slice(0,7)?(+WEEK_ISO[6].slice(8,10)):fmtMD(WEEK_ISO[6])}`;
const applyWeekStart=(mon)=>{WEEK_START_MON=!!mon;WEEK_START_ISO=addDaysIso(TODAY_ISO,-weekStartOffset(TODAY_ISO));WEEK_ISO=Array.from({length:7},(_,i)=>addDaysIso(WEEK_START_ISO,i));WEEK_DAYS=WEEK_ISO.map((iso)=>{const d=new Date(iso+"T00:00:00");return {d:DOW[d.getDay()],n:d.getDate(),iso};});TODAY_INDEX=WEEK_ISO.indexOf(TODAY_ISO);WEEK_LABEL=`${fmtMD(WEEK_ISO[0])} – ${WEEK_ISO[0].slice(0,7)===WEEK_ISO[6].slice(0,7)?(+WEEK_ISO[6].slice(8,10)):fmtMD(WEEK_ISO[6])}`;};
const isFutureIdx=(i)=>i>TODAY_INDEX;
const EDIT_WINDOW_DAYS=2;
/* editable: today or up to 2 calendar days before today; never the future */
const dayEditable=(i)=>{const off=TODAY_INDEX-i;return off>=0&&off<=EDIT_WINDOW_DAYS;};

/* ===== goal log model: g.log ({iso: value}) is the source of truth;
   values[7]/week[7]/streak are DERIVED for the current week so the UI stays simple. ===== */
const valOnIso=(g,iso)=>(g.log&&g.log[iso]!=null)?g.log[iso]:0;
const metValue=(g,v)=>g.type==="binary"?v>=1:v>=g.dailyMin;
const metOnIso=(g,iso)=>iso<=TODAY_ISO&&metValue(g,valOnIso(g,iso));
const computeStreak=(g)=>{let cur=metOnIso(g,TODAY_ISO)?TODAY_ISO:addDaysIso(TODAY_ISO,-1);let n=0;while(metOnIso(g,cur)){n++;cur=addDaysIso(cur,-1);}return n;};
const deriveGoal=(g)=>{if(!g.log)return g; /* server already supplies derived fields */
  return {...g,values:WEEK_ISO.map((iso)=>valOnIso(g,iso)),week:WEEK_ISO.map((iso)=>metOnIso(g,iso)?1:0),streak:computeStreak(g)};};
const normalizeGoals=(gs)=>gs.map(deriveGoal);

const metOn=(g,i)=>metOnDate(g,WEEK_ISO[i]);
const metToday=(g)=>metOnDate(g,TODAY_ISO);
const weekDone=(g)=>g.week.reduce((a,b)=>a+b,0);
/* ===== date-based lookups (work for any week, not just the current one) ===== */
const offsetOf=(iso)=>Math.round((Date.parse(TODAY_ISO+"T00:00:00")-Date.parse(iso+"T00:00:00"))/86400000); // >0 = past
const dayEditableIso=(iso)=>{const o=offsetOf(iso);return o>=0&&o<=EDIT_WINDOW_DAYS;};                        // today/yesterday/2-ago, any week
const isFutureIso=(iso)=>iso>TODAY_ISO;
const metOnDate=(g,iso)=>{
  if(g.log&&g.log[iso]!=null)return metValue(g,g.log[iso]);
  if(g.history&&g.history[iso]!=null)return g.history[iso]===1;
  if(WEEK_ISO.indexOf(iso)>=0&&g.week)return g.week[dowIndex(iso)]===1; // server arrays are day-of-week indexed
  return false;
};
const valueOnDate=(g,iso)=>{
  if(g.log&&g.log[iso]!=null)return g.log[iso];
  if(WEEK_ISO.indexOf(iso)>=0&&g.values)return g.values[dowIndex(iso)]; // server arrays are day-of-week indexed
  return 0; // server past-week raw value isn't retained; met-state still renders
};
const dowOf=(iso)=>DOW[new Date(iso+"T00:00:00").getDay()];
const domOf=(iso)=>+iso.slice(8,10);
const hash=(s)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0);
function memberHistory(id){const s=hash(id);const base=46+(s%34);return {weekly:Array.from({length:8},(_,i)=>({w:`W${i+1}`,pct:Math.min(100,Math.max(22,base+((s*(i+3))%34)-16))})),totalMarks:140+(s%260),bestStreak:14+(s%38),weeksActive:7+(s%16)};}
function riskOf(m){const t=m.trend||0;if(m.streak===0)return {risk:true,reason:"Streak broken"};if(m.weekPct<45)return {risk:true,reason:"Behind this week"};if(t<=-8)return {risk:true,reason:"Slipping vs last week"};if(m.loggedToday===false)return {risk:true,reason:"No entry today"};return {risk:false,reason:""};}
const adherenceFor=(id,total)=>Math.max(1,total-(hash(id)%4));

/* 10 default profile photos (placeholder gradients + motif; real art swaps in later) */
const PFPS=[
  {id:"av1",Icon:Sunrise,from:"#d97706",to:"#fbbf24"},
  {id:"av2",Icon:Leaf,from:"#15803d",to:"#4ade80"},
  {id:"av3",Icon:Star,from:"#4338ca",to:"#818cf8"},
  {id:"av4",Icon:Moon,from:"#475569",to:"#94a3b8"},
  {id:"av5",Icon:Flame,from:"#c2410c",to:"#fb923c"},
  {id:"av6",Icon:Compass,from:"#0e7490",to:"#22d3ee"},
  {id:"av7",Icon:Sparkles,from:"#7c3aed",to:"#c4b5fd"},
  {id:"av8",Icon:Footprints,from:"#0f766e",to:"#5eada3"},
  {id:"av9",Icon:Heart,from:"#e11d48",to:"#fb7185"},
  {id:"av10",Icon:Trophy,from:"#a21caf",to:"#e879f9"},
];
const PFP_BY_ID=Object.fromEntries(PFPS.map((p)=>[p.id,p]));

/* ===== data layer — Kohort API client (contract mirrors cetele-backend/) =====
   Set API_BASE to your server (e.g. "http://localhost:4000") to pull from the real
   backend. Left null, the same calls run against an embedded mirror so the prototype
   works in the sandbox, with optional cross-session persistence via artifact storage. */
let API_BASE=null;
const setApiBase=(v)=>{API_BASE=(v&&String(v).trim())||null;};
let AUTH_TOKEN=null;
const setAuthToken=(t)=>{AUTH_TOKEN=t||null;};
let onSessionExpired=null;
const setSessionExpiredHandler=(fn)=>{onSessionExpired=fn;};
const authHeaders=()=>(AUTH_TOKEN?{Authorization:`Bearer ${AUTH_TOKEN}`}:{});
const apiFetch=(url,opts={})=>fetch(url,{...opts,headers:{...(opts.headers||{}),...authHeaders()}}).then((r)=>{if(r.status===401&&AUTH_TOKEN&&onSessionExpired)onSessionExpired();return r;});

const DB_USERS=[
  {id:"u_murat",username:"murat",name:"Murat",bio:"On a steady streak with the Sunrise crew."},
  {id:"u_selin",username:"selin",name:"Selin Aydın",bio:"Mentor. Reading every morning, rain or shine."},
  {id:"u_emir",username:"emir",name:"Emir",bio:""},
  {id:"u_deniz",username:"deniz",name:"Deniz",bio:""},
  {id:"u_kaan",username:"kaan",name:"Kaan",bio:""},
  {id:"u_lina",username:"lina",name:"Lina",bio:"Back at it, one day at a time."},
  {id:"u_yusuf",username:"yusuf",name:"Yusuf Demir",bio:"Mentor over at Northstar."},
  {id:"u_okan",username:"okan",name:"Okan",bio:""},
  {id:"u_aylin",username:"aylin",name:"Aylin",bio:""},
  {id:"u_baran",username:"baran",name:"Baran",bio:""},
  {id:"u_zeynep",username:"zeynep",name:"Zeynep",bio:""},
  {id:"u_ferda",username:"ferda",name:"Ferda",bio:""},
  {id:"u_ayse",username:"ayse",name:"Ayşe",bio:""},
  {id:"u_derya",username:"derya",name:"Derya Koç",bio:""},
  {id:"u_cansu",username:"cansu",name:"Cansu",bio:""},
  {id:"u_ece",username:"ece",name:"Ece",bio:""},
  {id:"u_tarik",username:"tarik",name:"Tarık",bio:""},
  {id:"u_mert",username:"mert",name:"Mert",bio:""},
  {id:"u_burak",username:"burak",name:"Burak",bio:""},
];
const userCohortHint=(id)=>{const cid=cohortIds().find((c)=>COHORTS[c].members.some((m)=>m.id===id));if(!cid)return "";const mm=COHORTS[cid].members.find((m)=>m.id===id);return `${COHORTS[cid].name} · ${mm.role}`;};
const USER_BY_ID={};DB_USERS.forEach((u)=>{USER_BY_ID[u.id]=u;});
const USER_CACHE={};                              // display info for server users we've seen (members, friends, search)
const cacheUser=(u)=>{if(u&&u.id&&!USER_BY_ID[u.id])USER_CACHE[u.id]={id:u.id,name:u.name,username:u.username,avatar:u.avatar??null,bio:u.bio||""};};
const cohortCard=(id,profile)=>{const c=COHORTS[id];const lead=c.members.find((m)=>m.role==="mentor");return {id,name:c.name,fullName:c.fullName,memberCount:c.members.length,lead:lead?(lead.id===ME?profile.name:lead.name):""};};

/* ----- identity, derived from the signed-in account ----- */
const profileFor=(id)=>{const u=USER_BY_ID[id]||USER_CACHE[id]||{};const handle=u.username||(id||"").replace(/^u_/,"");return {name:u.name||(id===ME?"You":(handle||"Member")),username:handle,avatar:u.avatar??null,bio:u.bio||"",nameChangesLeft:2};};
const subscribedFor=(id)=>cohortIds().filter((cid)=>COHORTS[cid].members.some((m)=>m.id===id)); // your cohorts = your memberships
const seedGoalsFor=(id)=>id===DEFAULT_ME?SEED_GOALS_PD:[];                                       // only the demo owner ships seeded goals
const accountRoster=()=>{const seen=new Set();const ids=[];cohortIds().forEach((cid)=>COHORTS[cid].members.forEach((m)=>{if(!seen.has(m.id)){seen.add(m.id);ids.push(m.id);}}));
  if(!seen.has(DEFAULT_ME))ids.unshift(DEFAULT_ME);
  return ids.map((id)=>({id,name:(USER_BY_ID[id]&&USER_BY_ID[id].name)||memberById(id).name,hint:userCohortHint(id)}));};

/* per-day seed: expand each goal's met-pattern into daily values */
/* seed a real recent history: the goal's streak as consecutive met days ending yesterday
   (today is left unlogged so it can be logged in-app), plus any current-week met days */
const seedLogFor=(g)=>{const log={};const v=g.type==="binary"?1:(g.dailyMin+g.step);for(let d=1;d<=g.streak;d++){log[addDaysIso(TODAY_ISO,-d)]=v;}return log;};
const SEED_GOALS_PD=normalizeGoals(SEED_GOALS.map((g)=>({...g,Icon:iconOf(g.icon),log:seedLogFor(g)})));

/* optional persistence: artifact storage if available, else in-memory only */
const HAS_LS=(()=>{try{if(typeof window==="undefined"||!window.localStorage)return false;window.localStorage.setItem("__cz","1");window.localStorage.removeItem("__cz");return true;}catch{return false;}})();
const HAS_WS=typeof window!=="undefined"&&window.storage&&typeof window.storage.get==="function";
const _mem={};
const Store={  // real websites use localStorage; the artifact preview uses window.storage; otherwise in-memory
  async get(k){try{if(HAS_LS){const r=window.localStorage.getItem(k);return r?JSON.parse(r):null;}if(HAS_WS){const r=await window.storage.get(k);return r&&r.value?JSON.parse(r.value):null;}return k in _mem?_mem[k]:null;}catch{return null;}},
  async set(k,v){try{if(HAS_LS){window.localStorage.setItem(k,JSON.stringify(v));return;}if(HAS_WS){await window.storage.set(k,JSON.stringify(v));return;}_mem[k]=v;}catch{}},
};
const GOALS_KEY="cetele:goals:v3";
const goalsKey=()=>`${GOALS_KEY}:${ME}`;   // goals are stored per account
const ACCOUNT_KEY="cetele:me";              // remembers which account is signed in
const AUTH_KEY="cetele:token";              // bearer token for server mode
const ONBOARDED_KEY="cetele:onboarded:v1";  // first-run welcome shown
const profileKey=()=>`cetele:profile:${ME}`; // profile persists per account
/* persist the durable definition + date log only; values/week/streak are derived per-week on load */
const stripForSave=(goals)=>goals.map(({Icon,values,week,streak,...rest})=>rest);
const withIcon=(goals)=>goals.map((g)=>({...g,Icon:iconOf(g.icon)}));

const api={
  async search(q,profile){
    const s=(q||"").trim().toLowerCase();
    if(!s)return {users:[],cohorts:[]};
    if(API_BASE){const r=await apiFetch(`${API_BASE}/api/search?q=${encodeURIComponent(s)}`);const j=await r.json();(j.users||[]).forEach(cacheUser);return j;}
    const users=DB_USERS.map((u)=>u.id===ME?{...u,name:profile.name,username:profile.username}:u)
      .filter((u)=>u.username.toLowerCase().includes(s)||u.name.toLowerCase().includes(s)).slice(0,25);
    const cohorts=cohortIds().map((id)=>cohortCard(id,profile))
      .filter((c)=>c.name.toLowerCase().includes(s)||c.fullName.toLowerCase().includes(s));
    return {users,cohorts};
  },
  async cohorts(profile){
    if(API_BASE){const r=await apiFetch(`${API_BASE}/api/cohorts`);return r.json();}
    return cohortIds().map((id)=>cohortCard(id,profile));
  },
  async health(){if(!API_BASE)return {ok:false,reason:"demo"};try{const r=await apiFetch(`${API_BASE}/api/health`,{cache:"no-store"});if(!r.ok)return {ok:false,reason:"status"};const j=await r.json();return {ok:true,...j};}catch{return {ok:false,reason:"unreachable"};}},
  async loadGoals(seed){
    if(API_BASE){try{const r=await apiFetch(`${API_BASE}/api/users/${ME}/goals`);const j=await r.json();return normalizeGoals(withIcon(j));}catch{return seed;}}
    const saved=await Store.get(goalsKey());if(!saved||!saved.length)return seed;
    return normalizeGoals(withIcon(saved));
  },
  async loadMemberGoals(memberId){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/users/${memberId}/goals`);if(!r.ok)return null;const j=await r.json();return normalizeGoals(withIcon(j));}catch{return null;}
  },
  async loadMemberWeek(memberId){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/users/${memberId}/week`);if(!r.ok)return [];const j=await r.json();return (j.goals||[]).map((g)=>({id:g.id,title:g.title,count:g.weekDone}));}catch{return [];}
  },
  async loadMemberHistory(memberId){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/users/${memberId}/history-summary`);if(r.status===403)return "forbidden";if(!r.ok)return null;return await r.json();}catch{return null;}
  },
  async regenerateInvite(cohortId){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/cohorts/${cohortId}/invite/regenerate`,{method:"POST"});if(!r.ok)return null;const j=await r.json();return j.inviteCode||null;}catch{return null;}
  },
  async saveGoals(goalsNow){
    if(API_BASE)return null; // server path persists per-mutation via setLog/cohort endpoints
    await Store.set(goalsKey(),stripForSave(goalsNow));return null;
  },
  async setLog(goalId,iso,value,goalsNow){
    if(API_BASE){const r=await apiFetch(`${API_BASE}/api/goals/${goalId}/logs`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:iso,value,tz:USER_TZ})});return r.json();}
    await Store.set(goalsKey(),stripForSave(goalsNow));return null;
  },
  async clear(){await Store.set(goalsKey(),null);},
  // ----- server read paths (return null in demo so callers keep embedded data) -----
  async loadCohorts(){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/cohorts/full`);if(!r.ok)return null;const arr=await r.json();
      const map={};arr.forEach((c)=>{(c.members||[]).forEach(cacheUser);map[c.id]={id:c.id,name:c.name,fullName:c.fullName,theme:c.theme||"pine",description:c.description||"",inviteCode:c.inviteCode,marks:c.marks,target:c.target,members:c.members||[]};});return map;}
    catch{return null;}
  },
  async loadFeed(scope,before,limit){
    if(!API_BASE)return null;
    try{const qs=`userId=${ME}&scope=${scope==="friend"?"friend":"cohort"}`+(before?`&before=${before}`:"")+(limit?`&limit=${limit}`:"");
      const r=await apiFetch(`${API_BASE}/api/feed?${qs}`);if(!r.ok)return null;const arr=await r.json();
      return arr.map((it)=>({id:it.id,who:it.author_id,kind:it.kind,goal:it.goal||null,detail:it.detail||"",mins:it.mins_ago,cheers:it.cheers||0,cheered:false,cursor:it.cursor}));}
    catch{return null;}
  },
  async deleteWallNote(id){if(!API_BASE||!id)return;await apiFetch(`${API_BASE}/api/wall/${id}`,{method:"DELETE"}).catch(()=>{});},
  async menteeProgress(cohortId,memberId){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/cohorts/${cohortId}/members/${memberId}/goal-progress`);if(!r.ok)return null;return r.json();}catch{return null;}},
  async goalProgress(cohortId,goalId){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/cohorts/${cohortId}/goals/${goalId}/member-progress`);if(!r.ok)return null;return r.json();}catch{return null;}},
  async goalHistory(cohortId,memberId,goalId,days){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/cohorts/${cohortId}/members/${memberId}/goals/${goalId}/history?days=${days||365}`);if(!r.ok)return null;return r.json();}catch{return null;}},
  async loadFriends(){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/users/${ME}/friends`);if(!r.ok)return null;const arr=await r.json();arr.forEach(cacheUser);return arr.map((u)=>u.id);}
    catch{return null;}
  },
  async loadWall(mid){
    if(!API_BASE)return null;
    try{const r=await apiFetch(`${API_BASE}/api/users/${mid}/wall`);if(!r.ok)return null;const arr=await r.json();return arr.map((n)=>({id:n.id,from:n.fromId,text:n.text}));}
    catch{return null;}
  },
  // ----- auth -----
  async signup(username,name,password){const r=await apiFetch(`${API_BASE}/api/auth/signup`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,name,password,tz:USER_TZ})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Sign-up failed");return j;},
  async login(username,password){const r=await apiFetch(`${API_BASE}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password,tz:USER_TZ})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Login failed");return j;},
  async joinByCode(code){const r=await apiFetch(`${API_BASE}/api/cohorts/join`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not join");return j;},
  async logout(){try{await apiFetch(`${API_BASE}/api/auth/logout`,{method:"POST"});}catch{/* best effort */}},
  async reset(username,code,newPassword){const r=await apiFetch(`${API_BASE}/api/auth/reset`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,code,newPassword})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Reset failed");return j;},
  async recoveryCode(){const r=await apiFetch(`${API_BASE}/api/auth/recovery`,{method:"POST"});const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not get a code");return j.recoveryCode;},
  async loadFriendRequests(){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/users/${ME}/friend-requests`);if(!r.ok)return null;const j=await r.json();(j.incoming||[]).forEach((u)=>cacheUser({id:u.fromId,username:u.username,name:u.name,avatar:u.avatar,bio:u.bio}));return {incoming:(j.incoming||[]).map((u)=>({id:u.id,fromId:u.fromId})),outgoing:j.outgoing||[]};}catch{return null;}},
  async sendFriendReq(id){if(!API_BASE)return {status:"requested"};const r=await apiFetch(`${API_BASE}/api/users/${ME}/friends/${id}`,{method:"POST"});return r.json().catch(()=>({status:"requested"}));},
  async acceptReq(fromId){if(!API_BASE)return;await apiFetch(`${API_BASE}/api/friend-requests/accept`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromId})}).catch(()=>{});},
  async declineReq(fromId){if(!API_BASE)return;await apiFetch(`${API_BASE}/api/friend-requests/decline`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromId})}).catch(()=>{});},
  async unfriend(id){if(!API_BASE)return;await apiFetch(`${API_BASE}/api/users/${ME}/friends/${id}`,{method:"DELETE"}).catch(()=>{});},
  async deleteAccount(){const r=await apiFetch(`${API_BASE}/api/users/${ME}`,{method:"DELETE"});if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||"Delete failed");}},
  async pushVapid(){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/push/vapid`);if(!r.ok)return null;return r.json();}catch{return null;}},
  async pushSubscribe(sub){if(!API_BASE)return;await apiFetch(`${API_BASE}/api/push/subscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub})}).catch(()=>{});},
  async me(){if(!API_BASE||!AUTH_TOKEN)return null;try{const r=await apiFetch(`${API_BASE}/api/auth/me`);if(!r.ok)return null;const j=await r.json();return j.user;}catch{return null;}},
  async loadNotifications(){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/notifications`);if(!r.ok)return null;return await r.json();}catch{return null;}},
  markNotifRead(id){if(!API_BASE)return;apiFetch(`${API_BASE}/api/notifications/${id}/read`,{method:"POST"}).catch(()=>{});},
  markAllNotifRead(){if(!API_BASE)return;apiFetch(`${API_BASE}/api/notifications/read-all`,{method:"POST"}).catch(()=>{});},
  // ----- goal CRUD (server source of record) -----
  async createGoal(spec){const r=await apiFetch(`${API_BASE}/api/goals`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(spec)});const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not create goal");return j;},
  async updateGoal(id,spec){const r=await apiFetch(`${API_BASE}/api/goals/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(spec)});const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not update goal");return j;},
  async deleteGoal(id){const r=await apiFetch(`${API_BASE}/api/goals/${id}`,{method:"DELETE"});if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||"Could not delete goal");}return true;},
  // ----- profile (server PATCH already authz'd; local persists per account) -----
  async patchProfile(p){
    if(API_BASE){const r=await apiFetch(`${API_BASE}/api/users/${ME}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:p.name,username:p.username,avatar:p.avatar,bio:p.bio})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not save profile");return j;}
    await Store.set(profileKey(),p);return p;
  },
  async loadProfile(fallback){if(API_BASE)return fallback;const saved=await Store.get(profileKey());return saved||fallback;},
};

/* friends — a lightweight connections layer, orthogonal to cohorts/mentorship */
const DB_FRIENDS_ME=["u_yusuf","u_derya","u_lina"];
const SEED_FRIEND_REQS={incoming:[{id:1,fromId:"u_zeynep"},{id:2,fromId:"u_baran"}],outgoing:[]};
// turn a base64url VAPID key into the Uint8Array the Push API expects
const urlB64ToBytes=(b64)=>{const pad="=".repeat((4-(b64.length%4))%4);const s=(b64+pad).replace(/-/g,"+").replace(/_/g,"/");const raw=atob(s);return Uint8Array.from([...raw].map((c)=>c.charCodeAt(0)));};
const FRIENDS_KEY="cetele:friends:v1";
const COHORTS_KEY="cetele:cohorts:v1";
const COHORT_EXPAND_KEY="cetele:cohortExpanded:v1";  // which cohort goal-groups are open on the Tally tab
const SUBS_KEY="cetele:subs:v1";
const FRIEND_FEED=[
  {id:"ff1",who:"u_yusuf",kind:"streak",goal:"Daily steps",detail:"hit a 40-day streak",mins:18,cheers:6,cheered:false},
  {id:"ff2",who:"u_derya",kind:"log",goal:"Meditation",detail:"15 minutes before sunrise",mins:54,cheers:3,cheered:false},
  {id:"ff3",who:"u_lina",kind:"milestone",goal:"Morning reading",detail:"finished her first full week back",mins:120,cheers:9,cheered:false},
  {id:"ff4",who:"u_yusuf",kind:"log",goal:"Deep work",detail:"a focused 2-hour block",mins:200,cheers:2,cheered:false},
];
const friendApi={
  async load(){const s=await Store.get(FRIENDS_KEY);return s||DB_FRIENDS_ME;},
  async save(ids){await Store.set(FRIENDS_KEY,ids);},
};

// Notifications: kind -> icon + accent. Demo seed shown when there's no server.
const NOTIF_KIND={
  cheer:{icon:"Heart",tint:CHEER,soft:CHEER_SOFT},
  nudge:{icon:"Bell",tint:STREAK,soft:STREAK_SOFT},
  join:{icon:"Users",tint:PINE_DEEP,soft:PINE_SOFT},
  new_goal:{icon:"Sparkles",tint:PINE_DEEP,soft:PINE_SOFT},
  friend:{icon:"UserPlus",tint:PINE_DEEP,soft:PINE_SOFT},
  friend_request:{icon:"UserPlus",tint:PINE_DEEP,soft:PINE_SOFT},
  risk:{icon:"Flame",tint:STREAK,soft:STREAK_SOFT},
};
const SEED_NOTIFS=[
  {id:"n1",kind:"cheer",actorId:"u_selin",text:"Selin Aydın cheered your Morning reading",minsAgo:14,read:false},
  {id:"n2",kind:"nudge",actorId:"u_yusuf",text:"Yusuf Demir: proud of that streak — keep it going!",minsAgo:130,read:false},
  {id:"n5",kind:"risk",actorId:null,text:"Your 7-day streak on Deep work is at risk — log today to keep it going.",minsAgo:200,read:false},
  {id:"n3",kind:"new_goal",actorId:"u_selin",text:"New goal in Sunrise: Evening reflection",minsAgo:320,read:false},
  {id:"n4",kind:"join",actorId:"u_lina",text:"Lina joined Sunrise",minsAgo:1500,read:true},
];

/* cohort persistence — created cohorts, theme/name edits, and member changes
   survive a reload (mirrors how goals and friends already persist). */
const cohortStore={
  async load(){return {cohorts:await Store.get(COHORTS_KEY),subs:await Store.get(SUBS_KEY)};},
  async save(subs){await Store.set(COHORTS_KEY,COHORTS);await Store.set(SUBS_KEY,subs);},
  apply(cohorts){Object.keys(COHORTS).forEach((k)=>delete COHORTS[k]);Object.keys(cohorts).forEach((k)=>{COHORTS[k]=cohorts[k];});},
  restoreSeed(){this.apply(JSON.parse(JSON.stringify(COHORTS_SEED)));},
  async clear(){await Store.set(COHORTS_KEY,null);await Store.set(SUBS_KEY,null);},
};

/* server-sync layer — no-ops when API_BASE is null (the in-browser demo);
   when pointed at the Node backend it round-trips every mutation. */
const remote={
  async createCohort(spec){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/cohorts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...spec,ownerId:ME})});if(!r.ok)return null;return await r.json();}catch{return null;}},
  updateCohort(id,patch){if(!API_BASE)return;apiFetch(`${API_BASE}/api/cohorts/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)}).catch(()=>{});},
  setRole(id,uid,role){if(!API_BASE)return;apiFetch(`${API_BASE}/api/cohorts/${id}/members/${uid}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})}).catch(()=>{});},
  removeMember(id,uid){if(!API_BASE)return;apiFetch(`${API_BASE}/api/cohorts/${id}/members/${uid}`,{method:"DELETE"}).catch(()=>{});},
  archiveCohort(id){if(!API_BASE)return;apiFetch(`${API_BASE}/api/cohorts/${id}`,{method:"DELETE"}).catch(()=>{});},
  joinCohort(id){if(!API_BASE)return;apiFetch(`${API_BASE}/api/users/${ME}/cohorts/${id}`,{method:"POST"}).catch(()=>{});},
  leaveCohort(id){if(!API_BASE)return;apiFetch(`${API_BASE}/api/users/${ME}/cohorts/${id}`,{method:"DELETE"}).catch(()=>{});},
  async wall(mid,text){if(!API_BASE)return null;try{const r=await apiFetch(`${API_BASE}/api/users/${mid}/wall`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});const j=await r.json();return j&&j.id;}catch{return null;}},
  cheer(id,add){if(!API_BASE)return;apiFetch(`${API_BASE}/api/feed/${id}/cheer`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({delta:add?1:-1})}).catch(()=>{});},
};

/* ---------- atoms ---------- */
function Avatar({name,size=40,ring,pfp}){
  const ringShadow=ring?`0 0 0 2px #fff, 0 0 0 4px ${ring}`:"none";
  const p=pfp?PFP_BY_ID[pfp]:null;
  if(p){const Ic=p.Icon;return <div className="flex items-center justify-center shrink-0" style={{width:size,height:size,borderRadius:size,background:`linear-gradient(135deg, ${p.from}, ${p.to})`,boxShadow:ringShadow}}><Ic size={Math.round(size*0.5)} color="#fff" strokeWidth={2.2}/></div>;}
  const t=tintFor(name);const initials=name.split(" ").map((w)=>w[0]).slice(0,2).join("");
  return <div className="flex items-center justify-center font-semibold shrink-0" style={{width:size,height:size,borderRadius:size,background:t.bg,color:t.fg,fontSize:size*0.4,boxShadow:ringShadow}}>{initials}</div>;
}
function TallyMarks({count,color=PINE,scale=1}){
  const groups=[];let r=Math.max(0,count);while(r>0){groups.push(Math.min(5,r));r-=5;}if(groups.length===0)groups.push(0);
  return <div className="flex flex-wrap items-end" style={{gap:6*scale}}>{groups.map((n,gi)=>(
    <svg key={gi} width={26*scale} height={22*scale} viewBox="0 0 26 22">
      {[0,1,2,3].map((i)=>i<Math.min(n,4)?<line key={i} x1={4+i*6} y1={2} x2={4+i*6} y2={20} stroke={color} strokeWidth={2.4} strokeLinecap="round"/>:null)}
      {n===5&&<line x1={1} y1={4} x2={25} y2={18} stroke={color} strokeWidth={2.4} strokeLinecap="round"/>}
    </svg>))}</div>;
}
// Kohort mark — the tally-K (logo #1). `boxed` puts it on a Pine Deep tile (app-icon style).
function Logo({size=32,boxed=true,pillar="#a7f3d0",arm="#6ee7d0",bg="#0c6157",radius}){
  const mark=(
    <svg width={size*0.66} height={size*0.66} viewBox="0 0 96 96" fill="none">
      <g stroke={pillar} strokeWidth={6.5} strokeLinecap="round"><line x1="34" y1="22" x2="34" y2="74"/><line x1="44" y1="22" x2="44" y2="74"/><line x1="29" y1="22" x2="49" y2="22"/><line x1="29" y1="74" x2="49" y2="74"/></g>
      <g stroke={arm} strokeWidth={6.5} strokeLinecap="round"><line x1="26" y1="60" x2="73" y2="20"/><line x1="45" y1="43" x2="73" y2="74"/></g>
    </svg>
  );
  if(!boxed)return mark;
  return <div className="flex items-center justify-center" style={{width:size,height:size,background:bg,borderRadius:radius??size*0.32}}>{mark}</div>;
}
function Wordmark({size=22,color=INK}){
  return <span style={{fontFamily:"'Quicksand',ui-sans-serif,sans-serif",fontWeight:600,fontSize:size,color,letterSpacing:-0.5}}>Kohort</span>;
}
// Systematized empty state: soft icon tile + title + line + optional action. One consistent look everywhere.
function EmptyState({icon:Ic,title,body,action,onAction,soft}){
  return (
    <div className="rounded-2xl p-7 text-center flex flex-col items-center" style={soft?{background:SUNKEN}:{border:`2px dashed ${BORDER2}`}}>
      {Ic&&<div className="flex items-center justify-center rounded-2xl mb-2.5" style={{width:44,height:44,background:PINE_SOFT}}><Ic size={20} style={{color:PINE}}/></div>}
      {title&&<p className="font-semibold" style={{fontSize:14.5,color:INK}}>{title}</p>}
      {body&&<p style={{fontSize:12.5,color:INK3,marginTop:3,lineHeight:1.5,maxWidth:280}}>{body}</p>}
      {action&&<button onClick={onAction} className="mt-3.5 rounded-full font-semibold px-4" style={{height:38,background:PINE,color:"#fff",fontSize:13}}>{action}</button>}
    </div>
  );
}
function StreakBadge({n,small}){
  return <span className="inline-flex items-center gap-1 font-semibold rounded-full" style={{color:STREAK,background:STREAK_SOFT,fontSize:small?11:12.5,padding:small?"2px 7px":"3px 9px"}}><Flame size={small?12:14} style={{fill:"#fed7aa"}}/> {n}</span>;
}
function RoleTag({role,small}){
  const mentor=role==="mentor";
  return <span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:small?10:11,padding:small?"1px 7px":"2px 8px",color:mentor?STREAK:INK2,background:mentor?STREAK_SOFT:SUNKEN}}>{mentor&&<GraduationCap size={small?11:12}/>}{role}</span>;
}
function Eyebrow({children,style}){return <p className="font-bold uppercase mb-2" style={{fontSize:11,letterSpacing:1.6,color:INK3,...style}}>{children}</p>;}
function VisChip({vis,onClick}){
  const meta=VIS[vis.type];const I=meta.Icon;
  const label=vis.type==="people"?`${vis.people.length} ${vis.people.length===1?"friend":"friends"}`:meta.label;
  return <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full" style={{background:SUNKEN,color:INK2,fontSize:11.5,fontWeight:600,padding:"3px 9px"}}><I size={12}/> {label} <ChevronRight size={11} style={{color:INK3}}/></button>;
}
/* reusable dropdown for cohort selection */
function CohortDropdown({ids,activeId,onSelect,onJoinOpen,onCreateOpen}){
  const [open,setOpen]=useState(false);const c=COHORTS[activeId];const th=themeOf(activeId);
  return (
    <div className="relative mb-4" style={{zIndex:30}}>
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between rounded-2xl px-4" style={{height:58,background:CARD,border:`1px solid ${BORDER2}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
        <div className="flex items-center gap-3"><div className="flex items-center justify-center rounded-xl" style={{width:34,height:34,background:th.soft}}><Users size={18} style={{color:th.accent}}/></div>
          <div className="text-left"><div className="flex items-center gap-2"><span className="font-semibold" style={{fontFamily:FD,fontSize:17,color:INK}}>{c.fullName}</span><RoleTag role={myRoleIn(activeId)} small/></div><div style={{fontSize:12,color:INK3}}>{c.members.length} members</div></div></div>
        <ChevronDown size={20} style={{color:INK3,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}/>
      </button>
      {open&&(<>
        <div className="fixed inset-0" style={{zIndex:40}} onClick={()=>setOpen(false)}/>
        <div className="absolute left-0 right-0 rounded-2xl overflow-hidden" style={{top:"calc(100% + 8px)",zIndex:50,background:CARD,border:`1px solid ${BORDER2}`,boxShadow:E2}}>
          {ids.map((id)=>{const cc=COHORTS[id];const on=id===activeId;const lt=themeOf(id);return(
            <button key={id} onClick={()=>{onSelect(id);setOpen(false);}} className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{background:on?PINE_SOFT:"transparent",borderBottom:`1px solid ${BORDER}`}}>
              <div className="flex items-center justify-center rounded-lg" style={{width:30,height:30,background:lt.soft}}><Users size={15} style={{color:lt.accent}}/></div>
              <div className="flex-1"><div className="flex items-center gap-2"><span className="font-semibold" style={{fontSize:14,color:on?PINE_DEEP:INK}}>{cc.fullName}</span><RoleTag role={myRoleIn(id)} small/></div><div style={{fontSize:11.5,color:on?PINE:INK3}}>{cc.members.length} members</div></div>
              {on&&<Check size={17} style={{color:PINE}} strokeWidth={3}/>}
            </button>);})}
          {onJoinOpen&&<button onClick={()=>{setOpen(false);onJoinOpen();}} className="w-full flex items-center gap-3 px-4 py-3 text-left"><div className="flex items-center justify-center rounded-lg" style={{width:30,height:30,background:SUNKEN}}><Plus size={15} style={{color:INK2}}/></div><span className="font-semibold" style={{fontSize:14,color:INK2}}>Join a cohort</span></button>}
          {onCreateOpen&&<button onClick={()=>{setOpen(false);onCreateOpen();}} className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{borderTop:`1px solid ${BORDER}`}}><div className="flex items-center justify-center rounded-lg" style={{width:30,height:30,background:PINE_SOFT}}><Sparkles size={15} style={{color:PINE_DEEP}}/></div><span className="font-semibold" style={{fontSize:14,color:PINE_DEEP}}>Create a cohort</span></button>}
        </div>
      </>)}
    </div>
  );
}

/* ---------- goal card ---------- */
function GoalCard({g,onSetValue,onToggle,onEditVis,onEdit,onDelete,onOpen,canManage,selectedIso=TODAY_ISO}){
  const met=metOnDate(g,selectedIso);const val=valueOnDate(g,selectedIso);const done=weekDone(g);const p=g.target?Math.round((done/g.target)*100):0;const complete=g.target>0&&done>=g.target;
  const isToday=selectedIso===TODAY_ISO;const isFuture=isFutureIso(selectedIso);const canLog=dayEditableIso(selectedIso);const dayLabel=isToday?"Today":`${dowOf(selectedIso)} ${domOf(selectedIso)}`;
  const th=g.category==="cohort"?themeOf(g.cohortId):null;
  const [editing,setEditing]=useState(false);const [temp,setTemp]=useState("");const [menu,setMenu]=useState(false);
  const commit=()=>{const v=Math.max(0,parseInt(temp||"0",10)||0);onSetValue(g.id,selectedIso,v);setEditing(false);};
  return (
    <div className="rounded-2xl p-4" style={{background:complete?MINT:CARD,border:`1px solid ${complete?MINT_BORDER:BORDER}`,borderLeft:th?`4px solid ${th.dot}`:`1px solid ${complete?MINT_BORDER:BORDER}`,boxShadow:complete?"none":"0 1px 2px rgba(28,25,23,.04)"}}>
      <div className="flex items-center justify-between mb-2.5">
        {g.category==="cohort"
          ? <span className="inline-flex items-center gap-1 rounded-full" style={{background:th.soft,color:th.accent,fontSize:11,fontWeight:700,padding:"2px 8px"}}><Users size={11}/> {cohortName(g.cohortId)}</span>
          : <VisChip vis={g.vis} onClick={()=>onEditVis(g.id)}/>}
        <div className="flex items-center gap-1.5">
          <StreakBadge n={g.streak} small/>
          {canManage&&(
            <div className="relative">
              <button onClick={()=>setMenu(!menu)} className="flex items-center justify-center rounded-full" style={{width:26,height:26,color:INK3}}><MoreHorizontal size={16}/></button>
              {menu&&(<>
                <div className="fixed inset-0" style={{zIndex:40}} onClick={()=>setMenu(false)}/>
                <div className="absolute right-0 rounded-xl overflow-hidden" style={{top:"calc(100% + 4px)",zIndex:50,background:CARD,border:`1px solid ${BORDER2}`,boxShadow:E2,minWidth:158}}>
                  <button onClick={()=>{setMenu(false);onEdit(g.id);}} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left" style={{color:INK,fontSize:13.5,fontWeight:600,borderBottom:`1px solid ${BORDER}`}}><Pencil size={15}/> Edit goal</button>
                  <button onClick={()=>{setMenu(false);onDelete(g.id);}} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left" style={{color:CHEER,fontSize:13.5,fontWeight:600}}><Trash2 size={15}/> Delete goal</button>
                </div>
              </>)}
            </div>
          )}
        </div>
      </div>
      <button onClick={()=>onOpen&&onOpen(g.id)} className="w-full flex items-start justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5 min-w-0"><g.Icon size={20} style={{color:complete?PINE:INK2}}/><div className="min-w-0"><div className="flex items-start gap-1"><span className="font-semibold" style={{color:INK,fontSize:15.5,overflowWrap:"anywhere"}}>{g.title}</span><ChevronRight size={15} style={{color:INK3,flexShrink:0,marginTop:3}}/></div><div style={{fontSize:12,color:INK3}}>{done}/{g.target} days{g.type==="numeric"?` · min ${g.dailyMin} ${g.unit}`:""}</div></div></div>
        <span style={{fontFamily:FD,fontSize:20,fontWeight:600,color:complete?PINE:INK}}>{p}%</span>
      </button>
      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${p}%`,background:th?th.dot:PINE}}/></div>
      <div className="mt-3 pt-3" style={{borderTop:`1px solid ${complete?MINT_BORDER:BORDER}`}}>
        <div className="flex items-center justify-between mb-2">
          <span className="uppercase font-bold" style={{fontSize:10.5,letterSpacing:0.8,color:isToday?PINE:INK3}}>{dayLabel}</span>
          {canLog?(!isToday&&<span style={{fontSize:10.5,color:INK3}}>logging a past day</span>)
                 :isFuture?<span style={{fontSize:10.5,color:INK3}}>upcoming</span>
                 :<span className="inline-flex items-center gap-1" style={{fontSize:10.5,color:INK3}}><Lock size={11}/> locked</span>}
        </div>
        {!canLog?(
          <div className="flex items-center justify-between rounded-xl px-3.5" style={{height:46,background:SUNKEN}}>
            <span style={{fontSize:13.5,color:INK2}}>{isFuture?`${dowOf(selectedIso)} ${domOf(selectedIso)}`:(g.type==="binary"?(met?"Marked done":"Not done"):`${val} / ${g.dailyMin} ${g.unit}`)}</span>
            {isFuture?<span style={{fontSize:11.5,color:INK3}}>not yet</span>
               :met?<span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:11.5,padding:"3px 9px"}}><Check size={12} strokeWidth={3}/> met</span>
               :<span style={{fontSize:11.5,color:INK3}}>past edit window</span>}
          </div>
        ):g.type==="binary"?(
          <button onClick={()=>onToggle(g.id,selectedIso)} className="w-full flex items-center justify-between rounded-xl px-3.5" style={{height:46,background:met?PINE_SOFT:"transparent",border:met?"none":`1.5px solid ${BORDER2}`}}>
            <span className="font-semibold" style={{color:met?PINE_DEEP:INK2,fontSize:14}}>{met?"Done":`Mark ${isToday?"done":dayLabel+" done"}`}</span>
            <span key={met?"m":"u"} className="flex items-center justify-center rounded-full" style={{width:26,height:26,background:met?PINE:"transparent",border:met?"none":`2px solid ${BORDER2}`}}>{met&&<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="5 13 10 18 19 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="cz-draw" style={{"--cz-dash":30}}/></svg>}</span>
          </button>
        ):(
          <div>
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{fontSize:13,color:INK2}}>Amount</span>
              <div className="flex items-center gap-2">
                <button onClick={()=>onSetValue(g.id,selectedIso,val-g.step)} className="flex items-center justify-center rounded-full" style={{width:34,height:34,background:SUNKEN,color:INK}}><Minus size={16}/></button>
                {editing?<input autoFocus type="number" value={temp} onChange={(e)=>setTemp(e.target.value)} onBlur={commit} onKeyDown={(e)=>{if(e.key==="Enter")commit();}} className="text-center rounded-lg outline-none" style={{width:74,height:34,border:`1.5px solid ${PINE}`,fontFamily:FD,fontSize:18,fontWeight:600,color:INK}}/>
                  :<button onClick={()=>{setTemp(String(val));setEditing(true);}} className="text-center rounded-lg" style={{minWidth:82,padding:"3px 6px"}}><span style={{fontFamily:FD,fontSize:20,fontWeight:600,color:INK}}>{val}</span><span style={{fontSize:11,color:INK3}}> / {g.dailyMin} {g.unit}</span></button>}
                <button onClick={()=>onSetValue(g.id,selectedIso,val+g.step)} className="flex items-center justify-center rounded-full" style={{width:34,height:34,background:PINE,color:"#fff"}}><Plus size={16}/></button>
              </div>
            </div>
            <div className="mt-2.5">
              {met?<span className="inline-flex items-center gap-1.5 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:12,padding:"4px 10px"}}><Flame size={13} style={{fill:"#a7f3d0"}}/> Minimum met — tally earned</span>
                :val>0?<span className="inline-flex items-center gap-1.5 rounded-full font-medium" style={{color:INK2,background:SUNKEN,fontSize:12,padding:"4px 10px"}}>Logged {val}/{g.dailyMin} — counts toward tracking</span>
                :<span style={{fontSize:12,color:INK3}}>Tap the number to enter {isToday?"today's":"the day's"} amount</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Mentor dashboard ---------- */
function MenteeRow({m,onOpenMember,onNudge,nudged}){
  const t=m.trend||0;
  return (
    <div className="flex items-center gap-2 rounded-2xl p-3" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
      <button onClick={()=>onOpenMember(m.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="relative"><Avatar name={m.name} size={42}/><span className="absolute rounded-full" style={{width:11,height:11,right:-1,bottom:-1,background:m.loggedToday?PINE:"#d6d3d1",boxShadow:`0 0 0 2px ${CARD}`}}/></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="font-semibold truncate" style={{color:INK,fontSize:14.5}}>{m.name}</span><StreakBadge n={m.streak} small/></div>
          <div className="flex items-center gap-2 mt-0.5">
            {m.risk?<span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:11,color:CHEER,background:CHEER_SOFT,padding:"1px 7px"}}><AlertCircle size={11}/> {m.reason}</span>:<span className="font-semibold" style={{fontSize:11.5,color:PINE}}>On track</span>}
            <span className="inline-flex items-center gap-0.5" style={{fontSize:11.5,color:t>=0?PINE:CHEER}}>{t>=0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}{Math.abs(t)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${m.weekPct}%`,background:m.risk?"#e7a33e":PINE}}/></div>
        </div>
      </button>
      <button onClick={()=>onNudge(m.id)} disabled={nudged[m.id]} className="flex flex-col items-center justify-center rounded-xl shrink-0" style={{width:58,height:54,background:nudged[m.id]?PINE_SOFT:SUNKEN,color:nudged[m.id]?PINE_DEEP:INK2}}>{nudged[m.id]?<Check size={17}/>:<Bell size={17}/>}<span style={{fontSize:10,fontWeight:700,marginTop:2}}>{nudged[m.id]?"Sent":"Nudge"}</span></button>
    </div>
  );
}
function PulseStat({label,value,tone}){const col=tone==="risk"?CHEER:tone==="warn"?STREAK:PINE;return <div className="flex-1 text-center"><div style={{fontFamily:FD,fontSize:23,fontWeight:600,color:col,lineHeight:1}}>{value}</div><div style={{fontSize:10.5,color:INK3,marginTop:3}}>{label}</div></div>;}
function MentorScreen({cohorts,goals,onOpenMentee,onOpenGoal,onAddGoal,onNudge,nudged}){
  const [activeId,setActiveId]=useState(cohorts[0]);
  const safe=cohorts.includes(activeId)?activeId:cohorts[0];
  const c=COHORTS[safe];
  const mentees=c.members.filter((m)=>m.role==="mentee").map((m)=>({...m,...riskOf(m)}));
  const atRisk=mentees.filter((x)=>x.risk).sort((a,b)=>a.weekPct-b.weekPct);
  const onTrack=mentees.filter((x)=>!x.risk).sort((a,b)=>b.weekPct-a.weekPct);
  const cp=Math.round((c.marks/c.target)*100);const loggedCount=mentees.filter((m)=>m.loggedToday).length;
  const cohortGoals=goals.filter((g)=>g.category==="cohort"&&g.cohortId===safe);const th=themeOf(safe);
  return (
    <div className="px-4 pt-3 pb-28">
      <Eyebrow>Mentor dashboard</Eyebrow>
      <CohortDropdown ids={cohorts} activeId={safe} onSelect={setActiveId}/>

      <div className="rounded-2xl p-4 mb-5" style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`3px solid ${th.dot}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
        <div className="flex items-center justify-between mb-2"><span className="font-bold uppercase" style={{fontSize:11,letterSpacing:1.4,color:INK3}}>Cohort pulse</span><span style={{fontFamily:FD,fontSize:18,fontWeight:600,color:th.accent}}>{cp}%</span></div>
        <div className="h-3 rounded-full overflow-hidden mb-4" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${cp}%`,background:`linear-gradient(90deg, ${th.accent}, ${th.dot})`}}/></div>
        <div className="flex"><PulseStat label="On track" value={onTrack.length}/><div style={{width:1,background:BORDER}}/><PulseStat label="Need attention" value={atRisk.length} tone="risk"/><div style={{width:1,background:BORDER}}/><PulseStat label="Logged today" value={`${loggedCount}/${mentees.length}`}/></div>
      </div>

      {mentees.length===0?(
        <div className="rounded-2xl p-8 text-center" style={{border:`2px dashed ${BORDER2}`}}>
          <UserPlus size={24} style={{color:INK3}} className="mx-auto mb-2"/>
          <p className="font-semibold" style={{fontSize:14.5,color:INK}}>No mentees yet</p>
          <p style={{fontSize:12.5,color:INK3,marginTop:3}}>Invite people to {c.fullName} and they'll appear here with their weekly progress. You can still set shared goals below — they'll be ready the moment someone joins.</p>
        </div>
      ):(<>

      <Eyebrow>Needs attention {atRisk.length>0&&<span style={{color:CHEER}}>· {atRisk.length}</span>}</Eyebrow>
      {atRisk.length===0?(
        <div className="rounded-2xl p-5 flex items-center gap-3 mb-6" style={{background:MINT,border:`1px solid ${MINT_BORDER}`}}><Sparkles size={20} style={{color:PINE}}/><p className="font-semibold" style={{fontSize:13.5,color:PINE_DEEP}}>Everyone's on track this week.</p></div>
      ):(
        <div className="space-y-2.5 mb-6">{atRisk.map((m)=><MenteeRow key={m.id} m={m} onOpenMember={(id)=>onOpenMentee(safe,id)} onNudge={onNudge} nudged={nudged}/>)}</div>
      )}
      {onTrack.length>0&&(<><Eyebrow>On track</Eyebrow><div className="space-y-2.5 mb-6">{onTrack.map((m)=><MenteeRow key={m.id} m={m} onOpenMember={(id)=>onOpenMentee(safe,id)} onNudge={onNudge} nudged={nudged}/>)}</div></>)}
      </>)}

      <div className="flex items-center justify-between mb-1"><Eyebrow style={{margin:0}}>Cohort goals</Eyebrow><button onClick={()=>onAddGoal(safe)} className="inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:12.5,color:PINE_DEEP,background:PINE_SOFT,padding:"5px 11px"}}><Plus size={14}/> Add goal</button></div>
      <p style={{fontSize:12,color:INK3,marginBottom:10}}>{mentees.length?"Tap a goal to compare every member's progress.":"Set the shared goals for this cohort now — members log against them once they join."}</p>
      <div className="space-y-2.5">
        {cohortGoals.map((g)=>{const denom=Math.max(mentees.length,1);const met=mentees.length?adherenceFor(g.id,mentees.length):0;const pp=Math.round((met/denom)*100);const Ic=iconOf(g.icon);return(
          <button key={g.id} onClick={()=>mentees.length&&onOpenGoal(safe,g.id)} className="w-full text-left rounded-2xl p-3.5" style={{background:CARD,border:`1px solid ${BORDER}`}}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 min-w-0"><Ic size={17} style={{color:INK2,flexShrink:0}}/><span className="font-semibold" style={{fontSize:14,color:INK,overflowWrap:"anywhere"}}>{g.title}</span></div><div className="flex items-center gap-1.5 shrink-0"><span className="font-semibold" style={{fontSize:13,color:mentees.length?(pp>=70?PINE:STREAK):INK3}}>{mentees.length?`${met}/${mentees.length}`:"—"}</span>{mentees.length>0&&<ChevronRight size={16} style={{color:INK3}}/>}</div></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${mentees.length?pp:0}%`,background:pp>=70?PINE:"#e7a33e"}}/></div>
          </button>);})}
        {cohortGoals.length===0&&<EmptyState icon={Target} title="No cohort goals yet" body={`Tap Add goal to set the first shared goal for ${c.name}.`}/>}
      </div>
    </div>
  );
}

/* ---------- No cohorts ---------- */
function NoCohortsScreen({onJoinOpen,onCreateOpen}){
  return (
    <div className="px-6 pt-12 pb-28 flex flex-col items-center text-center">
      <div className="flex items-center justify-center rounded-3xl mb-5" style={{width:96,height:96,background:PINE_SOFT}}>
        <TallyMarks count={7} color={PINE} scale={1.3}/>
      </div>
      <h2 style={{fontFamily:FD,fontSize:26,fontWeight:600,color:INK,letterSpacing:-0.5}}>You're not in a cohort yet</h2>
      <p style={{fontSize:14,color:INK2,lineHeight:1.55,marginTop:10,maxWidth:300}}>Cohorts are where it happens — a mentor sets shared goals, and everyone tallies their progress and cheers each other on.</p>
      <button onClick={onJoinOpen} className="mt-7 rounded-2xl font-semibold flex items-center justify-center gap-2" style={{height:52,width:"100%",maxWidth:300,background:PINE,color:"#fff",fontSize:15}}><Compass size={18}/> Join a cohort</button>
      {onCreateOpen&&<button onClick={onCreateOpen} className="mt-2.5 rounded-2xl font-semibold flex items-center justify-center gap-2" style={{height:52,width:"100%",maxWidth:300,background:PINE_SOFT,color:PINE_DEEP,fontSize:15,border:`1px solid ${MINT_BORDER}`}}><Sparkles size={18}/> Create a cohort</button>}
      <div className="flex items-center gap-1.5 mt-3" style={{color:INK3}}><Ticket size={14}/><span style={{fontSize:12.5}}>Have an invite code? Enter it when you join.</span></div>
      <div className="mt-8 rounded-2xl p-4 flex items-start gap-3" style={{background:SUNKEN,maxWidth:330}}>
        <Sparkles size={18} style={{color:PINE,marginTop:1}}/>
        <p style={{fontSize:12.5,color:INK2,textAlign:"left",lineHeight:1.5}}>Your <b style={{color:INK}}>personal goals</b> still live in the Tally tab — you can keep tracking on your own anytime.</p>
      </div>
    </div>
  );
}

/* ---------- Tally (main tab) ---------- */
function CohortGroup({cohortId,goals,expanded,onToggle,selectedIso,onSetValue,onToggleGoal,onEdit,onDelete,onOpenGoal}){
  const th=themeOf(cohortId);const c=COHORTS[cohortId];const name=(c&&c.name)||"Cohort";
  const done=goals.filter((g)=>metOnDate(g,selectedIso)).length;
  const dayWord=selectedIso===TODAY_ISO?"today":fmtMD(selectedIso);
  return (
    <div>
      <button onClick={onToggle} aria-expanded={expanded} className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{background:th.soft,border:`1px solid ${th.border}`}}>
        <span style={{width:4,height:32,borderRadius:3,background:th.dot,flexShrink:0}}/>
        <div className="flex-1 min-w-0 text-left">
          <div style={{fontFamily:FD,fontSize:15.5,fontWeight:600,color:th.accent,overflowWrap:"anywhere",lineHeight:1.15}}>{name}</div>
          <div style={{fontSize:11.5,color:th.accent,opacity:0.82,marginTop:1}}>{goals.length} {goals.length===1?"goal":"goals"} · {done}/{goals.length} logged {dayWord}</div>
        </div>
        <ChevronDown size={20} style={{color:th.accent,transform:expanded?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0}}/>
      </button>
      {expanded&&<div className="space-y-2.5 mt-2.5">{goals.map((g)=><GoalCard key={g.id} g={g} onSetValue={onSetValue} onToggle={onToggleGoal} onEdit={onEdit} onDelete={onDelete} canManage={isMentorOfCohort(g.cohortId)} onOpen={onOpenGoal} selectedIso={selectedIso}/>)}</div>}
    </div>
  );
}
function CeteleScreen({goals,subscribed,onSetValue,onToggle,onEditVis,onEdit,onDelete,onAdd,onOpenGoal,selectedIso,setSelectedIso,cohortExpanded,onToggleCohort}){
  const allCohortGoals=goals.filter((g)=>g.category==="cohort"&&subscribed.includes(g.cohortId));
  const personalGoals=goals.filter((g)=>g.category==="personal");
  const visibleGoals=[...allCohortGoals,...personalGoals];
  const totalDone=visibleGoals.reduce((a,g)=>a+weekDone(g),0);const totalTarget=visibleGoals.reduce((a,g)=>a+g.target,0);const pct=totalTarget?Math.round((totalDone/totalTarget)*100):0;
  const dayPct=(iso)=>{const t=visibleGoals.length;return t?Math.round(visibleGoals.filter((g)=>metOnDate(g,iso)).length/t*100):0;};
  const allCaughtUp=visibleGoals.length>0&&!isFutureIso(selectedIso)&&visibleGoals.every((g)=>metOnDate(g,selectedIso));
  const dayLabel=selectedIso===TODAY_ISO?"today":`${dowOf(selectedIso)} ${domOf(selectedIso)}`;
  const [weekOffset,setWeekOffset]=useState(0);
  const viewWeek=Array.from({length:7},(_,i)=>addDaysIso(WEEK_START_ISO,weekOffset*7+i));
  const goWeek=(delta)=>{const no=Math.max(-4,Math.min(0,weekOffset+delta));if(no===weekOffset)return;setWeekOffset(no);const wk=Array.from({length:7},(_,i)=>addDaysIso(WEEK_START_ISO,no*7+i));const pick=wk.filter((d)=>d<=TODAY_ISO).pop()||wk[0];setSelectedIso(pick);};
  const touchX=useRef(null);
  const onTouchStart=(e)=>{touchX.current=e.changedTouches[0].clientX;};
  const onTouchEnd=(e)=>{if(touchX.current==null)return;const dx=e.changedTouches[0].clientX-touchX.current;touchX.current=null;if(Math.abs(dx)<45)return;goWeek(dx>0?-1:1);};
  const goalsByCohort={};allCohortGoals.forEach((g)=>{(goalsByCohort[g.cohortId]=goalsByCohort[g.cohortId]||[]).push(g);});
  const cohortOrder=subscribed.filter((cid)=>goalsByCohort[cid]&&goalsByCohort[cid].length);
  return (
    <div className="px-4 pt-3 pb-28">
      <div className="flex items-center justify-between mb-3">
        <Eyebrow>{weekOffset===0?"This week":weekOffset===-1?"Last week":`${fmtMD(viewWeek[0])} – ${fmtMD(viewWeek[6])}`}</Eyebrow>
        <div className="flex items-center gap-1">
          <button onClick={()=>goWeek(-1)} disabled={weekOffset<=-4} aria-label="Previous week" className="flex items-center justify-center rounded-full" style={{width:28,height:28,background:weekOffset<=-4?"transparent":SUNKEN,color:weekOffset<=-4?BORDER2:INK2}}><ChevronLeft size={16}/></button>
          <span style={{fontSize:11,color:INK3,minWidth:74,textAlign:"center"}}>{fmtMD(viewWeek[0])} – {fmtMD(viewWeek[6])}</span>
          <button onClick={()=>goWeek(1)} disabled={weekOffset>=0} aria-label="Next week" className="flex items-center justify-center rounded-full" style={{width:28,height:28,background:weekOffset>=0?"transparent":SUNKEN,color:weekOffset>=0?BORDER2:INK2}}><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-end gap-2"><span style={{fontFamily:FD,fontSize:44,fontWeight:600,letterSpacing:-1.5,color:INK,lineHeight:1}}>{pct}%</span><span className="mb-1.5" style={{fontSize:13,color:INK3}}>of weekly goals</span></div>
        <span style={{fontSize:13,color:PINE,fontWeight:600}}>Day {TODAY_INDEX+1} of 7</span>
      </div>
      <div className="flex gap-2 mb-5 overflow-x-auto" style={{scrollbarWidth:"none"}} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {viewWeek.map((iso)=>{const on=iso===selectedIso;const isTd=iso===TODAY_ISO;const fut=isFutureIso(iso);const editable=dayEditableIso(iso);const dp=dayPct(iso);return(
          <button key={iso} onClick={()=>setSelectedIso(iso)} className="flex flex-col items-center justify-center rounded-2xl shrink-0" style={{width:50,height:64,background:on?PINE:CARD,color:on?"#fff":INK,border:`1px solid ${on?PINE:(isTd?PINE:BORDER)}`,boxShadow:on?"none":"0 1px 2px rgba(28,25,23,.04)",opacity:on?1:(fut?0.6:(editable?1:0.5))}}>
            <span style={{fontSize:11,fontWeight:600,opacity:on?0.9:0.6,color:isTd&&!on?PINE:undefined}}>{dowOf(iso)}</span><span style={{fontSize:17,fontWeight:700,marginTop:1}}>{domOf(iso)}</span>
            {fut
              ?<span style={{width:5,height:5,borderRadius:"50%",marginTop:6,background:on?"rgba(255,255,255,.5)":BORDER2}}/>
              :<span className="rounded-full overflow-hidden" style={{width:22,height:3,marginTop:4,opacity:editable?1:0.5,background:on?"rgba(255,255,255,.35)":SUNKEN}}><span style={{display:"block",height:"100%",width:`${dp}%`,background:on?"#fff":(dp===100?PINE:FRESH)}}/></span>}
          </button>);})}
      </div>
      {allCaughtUp&&(
        <div className="flex items-center gap-2.5 rounded-2xl p-3.5 mb-5" style={{background:MINT,border:`1px solid ${MINT_BORDER}`}}>
          <div className="flex items-center justify-center rounded-full" style={{width:34,height:34,background:PINE}}><Sparkles size={18} color="#fff"/></div>
          <div><div className="font-semibold" style={{fontSize:14,color:PINE_DEEP}}>All caught up for {dayLabel}</div><div style={{fontSize:12,color:PINE}}>Every goal logged. Your cohorts can feel it.</div></div>
        </div>
      )}
      <Eyebrow>Cohort goals</Eyebrow>
      <p style={{fontSize:12,color:INK3,marginTop:-4,marginBottom:10}}>Set by your cohorts' mentors. Tap a cohort to open its goals.</p>
      {cohortOrder.length===0?(
        <div className="rounded-2xl p-5 text-center mb-6" style={{border:`2px dashed ${BORDER2}`}}><Users size={22} style={{color:INK3}} className="mx-auto mb-2"/><p style={{fontSize:13,color:INK3}}>Join a cohort to see shared goals here.</p></div>
      ):(
        <div className="space-y-2.5 mb-6">{cohortOrder.map((cid)=>(
          <CohortGroup key={cid} cohortId={cid} goals={goalsByCohort[cid]} expanded={!!(cohortExpanded&&cohortExpanded[cid])} onToggle={()=>onToggleCohort(cid)} selectedIso={selectedIso} onSetValue={onSetValue} onToggleGoal={onToggle} onEdit={onEdit} onDelete={onDelete} onOpenGoal={onOpenGoal}/>
        ))}</div>
      )}
      <Eyebrow>Personal goals</Eyebrow>
      <p style={{fontSize:12,color:INK3,marginTop:-4,marginBottom:10}}>Yours to set. You choose who sees each one.</p>
      {personalGoals.length===0?(
        <div className="rounded-2xl p-6 text-center" style={{border:`2px dashed ${BORDER2}`}}><Target size={26} style={{color:INK3}} className="mx-auto mb-2"/><p className="font-semibold" style={{fontSize:14,color:INK}}>No personal goals yet</p><p style={{fontSize:12.5,color:INK3,marginTop:2}}>Add one only you control — then share it if you want.</p></div>
      ):(
        <div className="space-y-2.5">{personalGoals.map((g)=><GoalCard key={g.id} g={g} onSetValue={onSetValue} onToggle={onToggle} onEditVis={onEditVis} onEdit={onEdit} onDelete={onDelete} canManage={true} onOpen={onOpenGoal} selectedIso={selectedIso}/>)}</div>
      )}
      <button onClick={onAdd} className="w-full mt-4 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-1.5" style={{border:`2px dashed ${BORDER2}`,color:INK3,fontSize:14}}><Plus size={16}/> Add a goal</button>
    </div>
  );
}

/* ---------- Feed ---------- */
function FeedScreen({feed,friendFeed,friends,subscribed,onCheer,onOpenMember,onOpenSearch,onJoinOpen,onCreateOpen,marksToday,profile,feedMore,loadingMore,onLoadMore}){
  const [scope,setScope]=useState("cohort");
  const heroId=subscribed.includes("sunrise")?"sunrise":subscribed[0];const hero=COHORTS[heroId];
  const items=scope==="cohort"?feed:friendFeed.filter((it)=>friends.includes(it.who));
  return (
    <div className="px-4 pt-3 pb-28">
      {scope==="cohort"?(
        hero?(
        <div className="rounded-3xl p-5 mb-4 text-white relative overflow-hidden" style={{background:`linear-gradient(140deg, ${PINE_DEEP}, ${PINE})`}}>
          <div className="absolute -right-6 -top-8 opacity-20"><Sparkles size={120}/></div>
          <p className="font-medium" style={{fontSize:13,opacity:0.85}}>{hero.fullName} · today</p>
          <div className="flex items-end gap-3 mt-1"><span style={{fontFamily:FD,fontSize:48,lineHeight:1,fontWeight:600,letterSpacing:-1.5}}>{marksToday}</span><span className="mb-1.5" style={{fontSize:14,opacity:0.9}}>marks logged together</span></div>
          <div className="mt-3"><TallyMarks count={marksToday} color="#a7f3d0"/></div>
          <div className="flex -space-x-2 mt-4">{hero.members.map((m)=><div key={m.id} style={{boxShadow:`0 0 0 2px ${PINE_DEEP}`,borderRadius:99}}><Avatar name={dispName(m.id,profile)} pfp={dispPfp(m.id,profile)} size={30}/></div>)}<span className="ml-3 self-center" style={{fontSize:12,opacity:0.9}}>{hero.members.length} keeping each other going</span></div>
        </div>
        ):(
        <div className="rounded-3xl p-5 mb-4 flex items-center justify-between" style={{background:CARD,border:`1px solid ${BORDER}`}}>
          <div><p style={{fontFamily:FD,fontSize:22,fontWeight:600,color:INK,letterSpacing:-0.5}}>Your cohorts</p><p style={{fontSize:13,color:INK3,marginTop:1}}>Not in a cohort yet</p></div>
          <button onClick={onJoinOpen} className="inline-flex items-center gap-1.5 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:13,padding:"7px 13px"}}><Compass size={15}/> Join</button>
        </div>
        )
      ):(
        <div className="rounded-3xl p-5 mb-4 flex items-center justify-between" style={{background:CARD,border:`1px solid ${BORDER}`}}>
          <div><p style={{fontFamily:FD,fontSize:22,fontWeight:600,color:INK,letterSpacing:-0.5}}>Your friends</p><p style={{fontSize:13,color:INK3,marginTop:1}}>{friends.length} {friends.length===1?"person":"people"} you follow</p></div>
          <button onClick={onOpenSearch} className="inline-flex items-center gap-1.5 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:13,padding:"7px 13px"}}><UserPlus size={15}/> Find people</button>
        </div>
      )}
      <div className="flex rounded-full p-0.5 mb-5" style={{background:SUNKEN}}>
        {[["cohort","Cohort"],["friends","Friends"]].map(([v,l])=>{const on=scope===v;return(
          <button key={v} onClick={()=>setScope(v)} className="flex-1 rounded-full font-semibold py-2" style={{fontSize:13,background:on?CARD:"transparent",color:on?PINE_DEEP:INK2,boxShadow:on?"0 1px 2px rgba(28,25,23,.06)":"none"}}>{l}</button>);})}
      </div>
      {items.length===0?(
        <div className="rounded-2xl p-8 text-center" style={{border:`2px dashed ${BORDER2}`}}>
          {scope==="friends"?(<>
            <UserPlus size={24} style={{color:INK3}} className="mx-auto mb-2"/>
            <p className="font-semibold" style={{fontSize:14.5,color:INK}}>No friend activity yet</p>
            <p style={{fontSize:12.5,color:INK3,marginTop:3,marginBottom:14}}>Add people to see their wins here and cheer them on.</p>
            <button onClick={onOpenSearch} className="rounded-full font-semibold px-5 py-2.5" style={{background:PINE,color:"#fff",fontSize:13.5}}>Find people to add</button>
          </>):subscribed.length===0?(<>
            <Users size={24} style={{color:INK3}} className="mx-auto mb-2"/>
            <p className="font-semibold" style={{fontSize:14.5,color:INK}}>No cohort yet</p>
            <p style={{fontSize:12.5,color:INK3,marginTop:3,marginBottom:14}}>Join or create a cohort to see shared wins here and keep each other going.</p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={onJoinOpen} className="rounded-full font-semibold px-5 py-2.5" style={{background:PINE,color:"#fff",fontSize:13.5}}>Join a cohort</button>
              <button onClick={onCreateOpen} className="rounded-full font-semibold px-5 py-2.5" style={{background:PINE_SOFT,color:PINE_DEEP,fontSize:13.5,border:`1px solid ${MINT_BORDER}`}}>Create one</button>
            </div>
          </>):(<>
            <Sparkles size={24} style={{color:INK3}} className="mx-auto mb-2"/>
            <p className="font-semibold" style={{fontSize:14.5,color:INK}}>Quiet for now</p>
            <p style={{fontSize:12.5,color:INK3,marginTop:3}}>When your cohort logs, their activity shows up here.</p>
          </>)}
        </div>
      ):(<>
      <Eyebrow>Activity</Eyebrow>
      <div className="space-y-3">{items.map((item)=>{const m=memberById(item.who);return(
        <div key={item.id} className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.05)"}}>
          <div className="flex gap-3">
            <button onClick={()=>onOpenMember(m.id)} className="shrink-0"><Avatar name={dispName(m.id,profile)} pfp={dispPfp(m.id,profile)} size={42} ring={m.role==="mentor"?STREAK:undefined}/></button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap"><button onClick={()=>onOpenMember(m.id)} className="font-semibold" style={{color:INK,fontSize:14}}>{dispName(m.id,profile)}</button>{m.role==="mentor"&&<span className="rounded-full font-semibold" style={{fontSize:10,color:STREAK,background:STREAK_SOFT,padding:"1px 7px"}}>mentor</span>}<span style={{fontSize:12,color:INK3}}>{fmtAgoLabel(item.mins)}</span></div>
              {item.kind==="cheer"?<p className="mt-1.5" style={{color:INK,fontSize:14.5,lineHeight:1.5}}>{item.detail}</p>:<p className="mt-0.5" style={{color:INK2,fontSize:14}}>{item.goal&&<span className="font-semibold" style={{color:INK}}>{item.goal}</span>}{item.goal?" — ":""}{item.detail}</p>}
              {item.kind==="streak"&&<div className="mt-2"><StreakBadge n={34} small/></div>}
              {item.kind==="milestone"&&<div className="mt-2 inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:11,color:PINE_DEEP,background:PINE_SOFT,padding:"2px 8px"}}><Trophy size={12}/> milestone</div>}
              <button onClick={()=>onCheer(item.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-full" style={{fontSize:13,fontWeight:600,padding:"5px 12px",color:item.cheered?"#fff":CHEER,background:item.cheered?CHEER:CHEER_SOFT}}><span key={item.cheered?"on":"off"} className={item.cheered?"czpop":""} style={{display:"inline-flex"}}><Heart size={14} style={{fill:item.cheered?"#fff":"transparent"}}/></span>{item.cheers}</button>
            </div>
          </div>
        </div>);})}</div>
      {(()=>{const apiScope=scope==="cohort"?"cohort":"friend";return feedMore&&feedMore[apiScope]&&onLoadMore?<button onClick={()=>onLoadMore(apiScope)} disabled={loadingMore} className="w-full rounded-2xl font-semibold mt-4" style={{height:46,background:SUNKEN,color:INK2,fontSize:14}}>{loadingMore?"Loading…":"Load more"}</button>:null;})()}
      </>)}
    </div>
  );
}

/* ---------- Cohort ---------- */
function CohortScreen({subscribed,onOpenMember,onJoinOpen,onCreateOpen,onSettingsOpen,onLeave,profile}){
  const [activeId,setActiveId]=useState(subscribed[0]);
  const safe=subscribed.includes(activeId)?activeId:subscribed[0];
  const c=COHORTS[safe];const sorted=[...c.members].sort((a,b)=>b.weekPct-a.weekPct);const cp=Math.round((c.marks/c.target)*100);const mentorHere=isMentorOfCohort(safe);const th=themeOf(safe);
  return (
    <div className="px-4 pt-3 pb-28">
      <div className="flex items-center justify-between"><Eyebrow>Your cohorts</Eyebrow>{mentorHere&&<button onClick={()=>onSettingsOpen(safe)} className="inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:12,color:th.accent,background:th.soft,padding:"4px 10px",marginBottom:8}}><SettingsIcon size={13}/> Cohort settings</button>}</div>
      <CohortDropdown ids={subscribed} activeId={safe} onSelect={setActiveId} onJoinOpen={onJoinOpen} onCreateOpen={onCreateOpen}/>
      <div className="rounded-2xl p-4 mb-5" style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`3px solid ${th.dot}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
        <div className="flex items-center justify-between mb-2"><span className="font-bold uppercase" style={{fontSize:11,letterSpacing:1.4,color:INK3}}>Collective tally · this week</span><span style={{fontFamily:FD,fontSize:18,fontWeight:600,color:th.accent}}>{cp}%</span></div>
        {c.description&&<p style={{fontSize:12.5,color:INK3,marginTop:-2,marginBottom:8}}>{c.description}</p>}
        <div className="flex items-end gap-2 mb-3"><span style={{fontFamily:FD,fontSize:34,fontWeight:600,letterSpacing:-1,color:INK,lineHeight:1}}>{c.marks}</span><span className="mb-1" style={{fontSize:13,color:INK3}}>of {c.target} marks earned together</span></div>
        <div className="h-3 rounded-full overflow-hidden" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${cp}%`,background:`linear-gradient(90deg, ${th.accent}, ${th.dot})`}}/></div>
        <div className="flex items-center justify-between mt-3"><div className="flex -space-x-2">{sorted.slice(0,5).map((m)=><div key={m.id} style={{boxShadow:`0 0 0 2px ${CARD}`,borderRadius:99}}><Avatar name={dispName(m.id,profile)} pfp={dispPfp(m.id,profile)} size={26}/></div>)}</div><TallyMarks count={Math.max(1,Math.round(cp/10))} color={th.dot} scale={0.8}/></div>
      </div>
      {mentorHere&&(
        <div className="flex items-start gap-2.5 rounded-2xl p-3.5 mb-4" style={{background:STREAK_SOFT,border:`1px solid #fcd9a8`}}>
          <GraduationCap size={18} style={{color:STREAK,marginTop:1}}/>
          <div><div className="font-semibold" style={{fontSize:13.5,color:"#92400e"}}>You mentor this cohort</div><div style={{fontSize:12,color:"#b45309"}}>Open the Mentor tab for the full dashboard, or tap any member to see their history.</div></div>
        </div>
      )}
      <Eyebrow>Standings</Eyebrow>
      <div className="space-y-2.5">
        {sorted.map((m,i)=>{const you=m.id===ME;return(
          <button key={m.id} onClick={()=>onOpenMember(m.id)} className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left" style={{background:you?MINT:CARD,border:`1px solid ${you?MINT_BORDER:BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
            <span className="w-5 text-center font-bold" style={{color:i===0?STREAK:"#d6d3d1",fontSize:15}}>{i+1}</span>
            <Avatar name={dispName(m.id,profile)} pfp={dispPfp(m.id,profile)} size={42} ring={m.role==="mentor"?STREAK:(you?PINE:undefined)}/>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-semibold" style={{color:INK,fontSize:14.5}}>{dispName(m.id,profile)}</span>{you&&<span style={{fontSize:11,color:PINE,fontWeight:600}}>you</span>}{m.role==="mentor"&&<span className="rounded-full font-semibold" style={{fontSize:10,color:STREAK,background:STREAK_SOFT,padding:"1px 7px"}}>mentor</span>}</div>
              <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{background:SUNKEN}}><div className="h-full rounded-full" style={{width:`${m.weekPct}%`,background:PINE}}/></div></div>
            <div className="text-right"><div style={{fontFamily:FD,fontWeight:600,color:INK,fontSize:16}}>{m.weekPct}%</div><div className="flex justify-end mt-0.5"><StreakBadge n={m.streak} small/></div></div>
          </button>);})}
      </div>
      <button onClick={()=>onLeave(safe)} className="w-full mt-5 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2" style={{border:`1px solid ${BORDER2}`,color:CHEER,fontSize:13.5,background:CARD}}><LogOut size={15}/> Leave {c.name} Cohort</button>
    </div>
  );
}

/* ---------- Insights ---------- */
function InsightsScreen({goals,subscribed}){
  const visible=goals.filter((g)=>g.category==="personal"||(g.category==="cohort"&&subscribed.includes(g.cohortId)));
  const marks=visible.reduce((a,g)=>a+weekDone(g),0);
  const target=visible.reduce((a,g)=>a+g.target,0);
  const pct=target?Math.round((marks/target)*100):0;
  const dayData=WEEK_DAYS.map((d,i)=>({day:d.d,pct:visible.length?Math.round(visible.filter((g)=>metOn(g,i)).length/visible.length*100):0}));
  const bestDay=dayData.reduce((b,d)=>d.pct>b.pct?d:b,{day:"—",pct:0});
  const goalBars=visible.map((g)=>{const w=g.title.split(" ")[0];return {name:w.length>9?w.slice(0,8)+"…":w,full:g.title,done:weekDone(g)};});
  const streaks=[...visible].sort((a,b)=>b.streak-a.streak);
  const topStreak=streaks.length?streaks[0].streak:0;
  // last 30 days: share of goals met per day (from date-keyed logs / server history)
  const days30=Array.from({length:30},(_,k)=>addDaysIso(TODAY_ISO,-(29-k)));
  const histMet=(g,iso)=>{if(g.log&&iso in g.log)return metValue(g,g.log[iso])?1:0;if(g.history&&g.history[iso]!=null)return g.history[iso]?1:0;return 0;};
  const trend30=days30.map((iso)=>{const md=visible.reduce((a,g)=>a+histMet(g,iso),0);const dt=new Date(iso+"T00:00:00");return {label:`${dt.getMonth()+1}/${dt.getDate()}`,pct:visible.length?Math.round(100*md/visible.length):0};});
  const avg30=trend30.length?Math.round(trend30.reduce((a,d)=>a+d.pct,0)/trend30.length):0;
  const activeDays=trend30.filter((d)=>d.pct>0).length;
  return (
    <div className="px-4 pt-3 pb-28">
      <Eyebrow>Insights</Eyebrow>
      <h2 style={{fontFamily:FD,fontSize:29,fontWeight:600,color:INK,letterSpacing:-0.7,lineHeight:1.02}}>Momentum</h2>
      <p className="mb-5" style={{fontSize:13,color:INK3,marginTop:4}}>How your week and the last 30 days are shaping up.</p>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[[`${pct}%`,"this week"],[marks,"marks earned"],[topStreak,"best streak"]].map(([v,l],i)=>(
          <div key={i} className="rounded-2xl p-3 text-center" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
            <div style={{fontFamily:FD,fontSize:28,fontWeight:600,color:i===2?STREAK:INK,lineHeight:1,letterSpacing:-0.5}}>{v}</div>
            <div className="uppercase" style={{fontSize:9.5,color:INK3,marginTop:5,fontWeight:700,letterSpacing:0.7}}>{l}</div>
          </div>))}
      </div>
      <div className="rounded-2xl p-4 mb-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-1"><p style={{fontFamily:FD,fontSize:15.5,fontWeight:600,color:INK}}>Progress · last 30 days</p><span style={{fontSize:12,fontWeight:700,color:PINE_DEEP}}>{avg30}% avg</span></div>
        <p style={{fontSize:12,color:INK3}} className="mb-3">Share of your goals met each day · {activeDays} active days</p>
        <div style={{height:150}}><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend30} margin={{top:4,right:4,left:-26,bottom:0}}>
            <defs><linearGradient id="g30" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PINE} stopOpacity={0.28}/><stop offset="100%" stopColor={PINE} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="label" tick={{fontSize:9,fill:INK3}} axisLine={false} tickLine={false} interval={6}/><YAxis tick={{fontSize:11,fill:INK3}} axisLine={false} tickLine={false} domain={[0,100]}/>
            <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} formatter={(v)=>[`${v}%`,"complete"]}/>
            <Area type="monotone" dataKey="pct" stroke={PINE} strokeWidth={2.5} fill="url(#g30)"/>
          </AreaChart></ResponsiveContainer></div>
      </div>
      <div className="rounded-2xl p-4 mb-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <p className="mb-1" style={{fontFamily:FD,fontSize:15.5,fontWeight:600,color:INK}}>Completion by day</p><p style={{fontSize:12,color:INK3}} className="mb-3">Share of your goals met each day this week</p>
        <div style={{height:160}}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={dayData} margin={{top:4,right:4,left:-22,bottom:0}}>
            <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="day" tick={{fontSize:11,fill:INK3}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:INK3}} axisLine={false} tickLine={false} domain={[0,100]}/>
            <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} cursor={{fill:"#faf9f7"}} formatter={(v)=>[`${v}%`,"complete"]}/>
            <Bar dataKey="pct" radius={[6,6,0,0]}>{dayData.map((b,i)=><Cell key={i} fill={b.pct>=80?PINE:b.pct>=50?FRESH:"#fbbf24"}/>)}</Bar>
          </BarChart></ResponsiveContainer></div>
        {bestDay.pct>0&&<p style={{fontSize:12.5,color:INK2,marginTop:8}}>Your strongest day is <span style={{fontWeight:700,color:PINE_DEEP}}>{bestDay.day}</span> — {bestDay.pct}% of goals met.</p>}
      </div>
      <div className="rounded-2xl p-4 mb-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <p className="mb-1" style={{fontFamily:FD,fontSize:15.5,fontWeight:600,color:INK}}>My week by goal</p><p style={{fontSize:12,color:INK3}} className="mb-3">Days the minimum was met</p>
        <div style={{overflowX:"auto",overflowY:"hidden"}}><div style={{height:170,minWidth:goalBars.length>5?`${goalBars.length*58}px`:"100%"}}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={goalBars} margin={{top:4,right:4,left:-22,bottom:0}}>
            <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="name" tick={{fontSize:11,fill:INK3}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:INK3}} axisLine={false} tickLine={false} domain={[0,7]}/>
            <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} cursor={{fill:"#faf9f7"}} formatter={(v)=>[`${v}/7 days`,""]} labelFormatter={(l,p)=>(p&&p[0]&&p[0].payload.full)||l}/>
            <Bar dataKey="done" radius={[6,6,0,0]}>{goalBars.map((b,i)=><Cell key={i} fill={b.done>=6?PINE:b.done>=4?FRESH:"#fbbf24"}/>)}</Bar>
          </BarChart></ResponsiveContainer></div></div>
      </div>
      {streaks.length>0&&(<>
        <Eyebrow>Active streaks</Eyebrow>
        <div className="rounded-2xl overflow-hidden" style={{background:CARD,border:`1px solid ${BORDER}`}}>
          {streaks.slice(0,10).map((g,i)=>(
            <div key={g.id} className="flex items-center gap-3 px-4 py-3" style={{borderTop:i?`1px solid ${BORDER}`:"none"}}>
              <g.Icon size={18} style={{color:INK2}}/>
              <span className="flex-1 font-medium" style={{fontSize:13.5,color:INK,overflowWrap:"anywhere"}}>{g.title}</span>
              <StreakBadge n={g.streak} small/>
            </div>))}
        </div>
      </>)}
    </div>
  );
}

/* ---------- Profile ---------- */
function StatCell({label,value}){return <div className="flex-1 text-center"><div style={{fontFamily:FD,fontSize:24,fontWeight:600,color:INK,lineHeight:1}}>{value}</div><div style={{fontSize:11,color:INK3,marginTop:3}}>{label}</div></div>;}
function FriendButton({status,onClick,big}){
  const m=({none:{l:"Add",I:UserPlus,bg:PINE,fg:"#fff"},requested:{l:"Requested",I:Clock,bg:SUNKEN,fg:INK2},incoming:{l:"Accept",I:Check,bg:PINE,fg:"#fff"},friends:{l:"Friends",I:Check,bg:SUNKEN,fg:INK2}})[status]||{l:"Add",I:UserPlus,bg:PINE,fg:"#fff"};
  const I=m.I;
  return <button onClick={onClick} className="inline-flex items-center gap-1 rounded-full font-semibold shrink-0" style={{fontSize:big?13:12,padding:big?"6px 12px":"6px 11px",color:m.fg,background:m.bg}}><I size={big?14:13} strokeWidth={status==="friends"?3:2}/> {m.l}</button>;
}
function ProfileScreen({memberId,wall,onBack,onEncourage,onDeleteNote,profile,onEditProfile,statusOf,onToggleFriend,sharedGoals,weekData,historyData}){
  const m=memberById(memberId);const [text,setText]=useState("");const notes=wall[memberId]||[];const isMe=memberId===ME;
  const seeHistory=canMentorView(memberId);const hist=(historyData&&historyData!=="forbidden")?historyData:null;
  const roleLine=isMe?(mentorCohorts().length?`Mentor in ${mentorCohorts().map(cohortName).join(", ")} · mentee elsewhere`:"mentee"):m.role;
  const dName=isMe?profile.name:m.name;const dPfp=isMe?profile.avatar:null;
  return (
    <div className="pb-28">
      <div className="px-4 pt-3 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
        {isMe?<button onClick={onEditProfile} className="inline-flex items-center gap-1.5 rounded-full font-semibold mb-3" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:13,padding:"6px 12px"}}><Pencil size={14}/> Edit profile</button>
          :<span className="mb-3"><FriendButton status={statusOf(memberId)} onClick={()=>onToggleFriend(memberId)} big/></span>}
      </div>
      <div className="px-4 flex flex-col items-center text-center">
        <Avatar name={dName} pfp={dPfp} size={84} ring={m.role==="mentor"?STREAK:PINE}/>
        <h2 className="mt-3" style={{fontFamily:FD,fontSize:24,fontWeight:600,color:INK}}>{dName}</h2>
        {isMe&&<p style={{fontSize:13,color:PINE,fontWeight:600,marginTop:1}}>@{profile.username}</p>}
        <p style={{fontSize:13,color:INK3}} className={isMe?"":"capitalize"}>{roleLine}{isMe?" · you":""}</p>
        {isMe&&profile.bio&&<p style={{fontSize:13.5,color:INK2,lineHeight:1.5,marginTop:8,maxWidth:300}}>{profile.bio}</p>}
        <div className="flex gap-2 mt-3"><StreakBadge n={m.streak}/><span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:13,padding:"3px 9px"}}><Star size={14} style={{fill:"#5eead4"}}/> {m.weekPct}% this week</span></div>
      </div>
      <div className="px-4 mt-5"><div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-3"><p className="font-semibold" style={{color:INK,fontSize:14}}>This week</p><span style={{fontSize:11,color:INK3}}>cohort goals</span></div>
        {weekData==null?(
          <div className="space-y-2.5">{[0,1,2].map((i)=><div key={i} className="czshim" style={{height:14,background:SUNKEN,borderRadius:6,width:`${80-i*12}%`}}/>)}</div>
        ):weekData.length===0?(
          <p style={{fontSize:13,color:INK3}}>{isMe?"Join a cohort to track shared goals here.":`No cohort goals you share with ${m.name.split(" ")[0]}.`}</p>
        ):(
          <div className="space-y-3">{weekData.map((g)=>(<div key={g.id} className="flex items-center justify-between gap-3"><span className="min-w-0" style={{fontSize:13.5,color:INK2,overflowWrap:"anywhere"}}>{g.title}</span><TallyMarks count={Math.max(0,Math.min(7,g.count))} color={PINE} scale={0.85}/></div>))}</div>
        )}
      </div></div>
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2"><Eyebrow style={{margin:0}}>Full history</Eyebrow><span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{fontSize:10.5,padding:"2px 8px",color:STREAK,background:STREAK_SOFT}}><GraduationCap size={12}/> mentor view</span></div>
        {(seeHistory&&historyData!=="forbidden")?(
          hist==null?(
            <div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}><div className="czshim" style={{height:120,background:SUNKEN,borderRadius:12}}/></div>
          ):(
          <div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
            <div className="flex mb-4"><StatCell label="Total marks" value={hist.totalMarks}/><div style={{width:1,background:BORDER}}/><StatCell label="Best streak" value={hist.bestStreak}/><div style={{width:1,background:BORDER}}/><StatCell label="Weeks active" value={hist.weeksActive}/></div>
            <p style={{fontSize:12,color:INK3}} className="mb-2">Completion · last 8 weeks</p>
            <div style={{height:130,width:"100%"}}><ResponsiveContainer width="99%" height={130} minWidth={0}>
              <AreaChart data={hist.weekly} margin={{top:4,right:4,left:-26,bottom:0}}>
                <defs><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PINE} stopOpacity={0.3}/><stop offset="100%" stopColor={PINE} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="w" tick={{fontSize:10,fill:INK3}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:INK3}} axisLine={false} tickLine={false} domain={[0,100]}/>
                <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} formatter={(v)=>[`${v}%`,"complete"]}/><Area type="monotone" dataKey="pct" stroke={PINE} strokeWidth={2.5} fill="url(#h)"/>
              </AreaChart></ResponsiveContainer></div>
          </div>
          )
        ):(
          <div className="rounded-2xl p-5 flex items-center gap-3" style={{background:SUNKEN,border:`1px dashed ${BORDER2}`}}><Lock size={20} style={{color:INK3}}/><div><p className="font-semibold" style={{fontSize:13.5,color:INK2}}>History is mentor-only</p><p style={{fontSize:12,color:INK3}}>Only mentors of {m.name.split(" ")[0]}'s cohort can see all-time data.</p></div></div>
        )}
      </div>
      {!isMe&&(
        <div className="px-4 mt-5">
          <Eyebrow>Shared with you</Eyebrow>
          <p style={{fontSize:12,color:INK3,marginTop:-4,marginBottom:10}}>Personal goals {m.name.split(" ")[0]} chose to share with you.</p>
          {sharedGoals==null?(
            <div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}><div className="czshim" style={{height:14,width:"55%",background:SUNKEN,borderRadius:6,marginBottom:8}}/><div className="czshim" style={{height:10,width:"35%",background:SUNKEN,borderRadius:6}}/></div>
          ):sharedGoals.length===0?(
            <div className="rounded-2xl p-5 text-center" style={{border:`2px dashed ${BORDER2}`}}><Lock size={18} style={{color:INK3}} className="mx-auto mb-1.5"/><p style={{fontSize:13,color:INK3}}>{m.name.split(" ")[0]} hasn't shared any personal goals with you.</p></div>
          ):(
            <div className="space-y-2.5">{sharedGoals.map((g)=>{const Ic=iconOf(g.icon);const wv=weekViewOf(g);const todayTxt=wv.todayMet?(g.type==="numeric"?`${wv.todayValue} ${g.unit||""}`.trim():"Done"):(g.type==="numeric"&&wv.todayValue>0?`${wv.todayValue} ${g.unit||""}`.trim():"Not yet");return(
              <div key={g.id} className="rounded-2xl p-3.5" style={{background:CARD,border:`1px solid ${BORDER}`}}>
                <div className="flex items-center gap-2 mb-2.5"><div className="flex items-center justify-center rounded-lg shrink-0" style={{width:28,height:28,background:SUNKEN}}><Ic size={15} style={{color:INK2}}/></div><span className="font-semibold flex-1 min-w-0" style={{fontSize:14,color:INK,overflowWrap:"anywhere"}}>{g.title}</span>{g.streak>0&&<span className="inline-flex items-center gap-1 shrink-0" style={{fontSize:12,color:STREAK,fontWeight:600}}><Flame size={12}/> {g.streak}d</span>}</div>
                <div className="flex items-center justify-between">
                  <div style={{fontSize:12.5,color:INK2}}>Today · <b style={{color:wv.todayMet?PINE_DEEP:INK2}}>{todayTxt}</b></div>
                  <div className="flex items-center gap-1.5"><span style={{fontSize:11,color:INK3}}>This week</span><TallyMarks count={Math.min(7,wv.weekMet)} color={PINE} scale={0.8}/></div>
                </div>
              </div>);})}</div>
          )}
        </div>
      )}
      <div className="px-4 mt-5">
        <Eyebrow>Encouragement wall</Eyebrow>
        <div className="space-y-2.5 mb-3">
          {notes.length===0&&<p style={{fontSize:13.5,color:INK3}}>{isMe?"When your cohort-mates write to you, it shows up here.":`Be the first to cheer ${m.name.split(" ")[0]} on.`}</p>}
          {notes.map((n,i)=>{const mine=n.from===ME;return(<div key={n.id||i} className="rounded-2xl p-3 flex gap-2.5 items-start" style={{background:CARD,border:`1px solid ${BORDER}`}}><Avatar name={dispName(n.from,profile)} pfp={dispPfp(n.from,profile)} size={32}/><div className="min-w-0 flex-1"><p className="font-semibold" style={{fontSize:12.5,color:INK}}>{dispName(n.from,profile)}</p><p style={{fontSize:13.5,color:INK2,whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{n.text}</p></div>{mine&&onDeleteNote&&<button onClick={()=>onDeleteNote(memberId,n)} aria-label="Delete note" className="shrink-0 flex items-center justify-center rounded-full" style={{width:28,height:28,background:SUNKEN,color:INK3}}><Trash2 size={14}/></button>}</div>);})}
        </div>
        {!isMe&&(<div className="flex gap-2">
          <input value={text} maxLength={160} onChange={(e)=>setText(e.target.value.slice(0,160))} placeholder="Write something kind…" className="flex-1 rounded-2xl px-4 outline-none" style={{border:`1px solid ${BORDER2}`,fontSize:14,height:46,color:INK}}/>
          <button onClick={()=>{if(text.trim()){onEncourage(memberId,text.trim());setText("");}}} className="rounded-2xl flex items-center justify-center" style={{background:PINE,color:"#fff",width:46,height:46}}><Send size={18}/></button>
        </div>)}
      </div>
    </div>
  );
}

/* ---------- profile editing ---------- */
const RESERVED_HANDLES=["admin","cetele","support","selin","murat_official"];
const DEFAULT_PROFILE={name:"Murat",username:"murat",avatar:null,bio:"On a steady streak with the Sunrise crew.",nameChangesLeft:2};
function ProfileEditScreen({profile,onSave,onBack}){
  const [name,setName]=useState(profile.name);
  const [username,setUsername]=useState(profile.username);
  const [avatar,setAvatar]=useState(profile.avatar);
  const [bio,setBio]=useState(profile.bio);
  const [nameEditing,setNameEditing]=useState(false);
  const [askDiscard,setAskDiscard]=useState(false);
  const changesLeft=profile.nameChangesLeft;
  const nameChanged=name.trim()!==profile.name&&name.trim().length>0;
  const handle=username;const handleValid=/^[a-z0-9_]{3,20}$/.test(handle);
  const taken=handle!==profile.username&&RESERVED_HANDLES.includes(handle);
  const handleState=!handle?"empty":!handleValid?"invalid":taken?"taken":"ok";
  const dirty=nameChanged||username!==profile.username||avatar!==profile.avatar||bio.trim()!==profile.bio;
  const canSave=handleValid&&!taken&&dirty&&(!nameChanged||changesLeft>0);
  const save=()=>{if(!canSave)return;const newLeft=nameChanged?Math.max(0,changesLeft-1):changesLeft;onSave({name:name.trim()||profile.name,username:handle,avatar,bio:bio.trim(),nameChangesLeft:newLeft});};
  const back=()=>{if(dirty)setAskDiscard(true);else onBack();};
  const initialsOf=(s)=>s.split(" ").map((w)=>w[0]).slice(0,2).join("")||"M";
  return (
    <div className="px-4 pt-3 pb-28">
      <div className="flex items-center justify-between mb-3">
        <button onClick={back} className="inline-flex items-center gap-1 font-medium" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
        <button disabled={!canSave} onClick={save} className="rounded-full font-semibold px-4" style={{height:36,background:canSave?PINE:SUNKEN,color:canSave?"#fff":INK3,fontSize:13.5}}>Save</button>
      </div>
      <h1 style={{fontFamily:FD,fontSize:26,fontWeight:600,color:INK,letterSpacing:-0.5,marginBottom:18}}>Edit profile</h1>

      <div className="flex justify-center mb-5"><Avatar name={name||profile.name} pfp={avatar} size={88} ring={PINE}/></div>
      <Eyebrow>Choose a photo</Eyebrow>
      <p style={{fontSize:11.5,color:INK3,marginTop:-4,marginBottom:12}}>Pick a default for now — custom uploads are coming.</p>
      <div className="grid mb-2" style={{gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        <button onClick={()=>setAvatar(null)} className="flex items-center justify-center rounded-full font-semibold" style={{justifySelf:"center",width:"100%",aspectRatio:"1",maxWidth:54,background:tintFor(name||"M").bg,color:tintFor(name||"M").fg,fontSize:15,boxShadow:avatar===null?`0 0 0 2px #fff, 0 0 0 4px ${PINE}`:"none"}}>{initialsOf(name||"M")}</button>
        {PFPS.map((p)=>{const Ic=p.Icon;const on=avatar===p.id;return(
          <button key={p.id} onClick={()=>setAvatar(p.id)} className="flex items-center justify-center rounded-full" style={{justifySelf:"center",width:"100%",aspectRatio:"1",maxWidth:54,background:`linear-gradient(135deg, ${p.from}, ${p.to})`,boxShadow:on?`0 0 0 2px #fff, 0 0 0 4px ${PINE}`:"none"}}><Ic size={21} color="#fff" strokeWidth={2.2}/></button>);})}
      </div>
      <p style={{fontSize:11,color:INK3,marginBottom:22}}>The first tile keeps your initials.</p>

      <Eyebrow>Username</Eyebrow>
      <div className="flex items-center rounded-xl px-3 mb-1.5" style={{height:48,border:`1px solid ${handleState==="ok"?MINT_BORDER:handleState==="taken"||handleState==="invalid"?"#fecdd3":BORDER2}`,background:"#fff"}}>
        <span style={{fontFamily:FD,fontSize:16,color:INK3,marginRight:2}}>@</span>
        <input value={username} onChange={(e)=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20))} placeholder="username" className="flex-1 outline-none" style={{fontSize:15,color:INK,background:"transparent"}}/>
        {handleState==="ok"&&<Check size={17} style={{color:PINE}} strokeWidth={3}/>}
        {handleState==="taken"&&<X size={17} style={{color:CHEER}}/>}
      </div>
      <p style={{fontSize:11.5,color:handleState==="taken"||handleState==="invalid"?CHEER:INK3,marginBottom:22,lineHeight:1.45}}>{handleState==="taken"?"That username is taken — try another.":handleState==="invalid"||handleState==="empty"?"3–20 characters · lowercase letters, numbers, underscores.":`People can find you by @${handle}.`}</p>

      <Eyebrow>Display name</Eyebrow>
      {nameEditing?(
        <>
          <input value={name} onChange={(e)=>setName(e.target.value.slice(0,30))} placeholder="Your name" className="w-full rounded-xl px-4 outline-none" style={{height:48,border:`1px solid ${BORDER2}`,fontSize:15,color:INK,background:"#fff"}}/>
          <div className="flex items-start gap-2 rounded-xl p-3 mt-2" style={{background:STREAK_SOFT,marginBottom:22}}><AlertCircle size={16} style={{color:STREAK,marginTop:1}}/><p style={{fontSize:11.5,color:STREAK,lineHeight:1.45}}>Heads up — saving a new name spends one of your <b>{changesLeft}</b> remaining changes, and that can't be undone.</p></div>
        </>
      ):(
        <>
          <div className="w-full flex items-center justify-between rounded-xl px-4" style={{height:48,background:SUNKEN}}>
            <span className="flex items-center gap-2" style={{fontSize:15,color:INK,fontWeight:600}}><Lock size={15} style={{color:INK3}}/>{name}</span>
            <button disabled={changesLeft<=0} onClick={()=>setNameEditing(true)} className="font-semibold" style={{fontSize:13,color:changesLeft>0?PINE:INK3}}>Change</button>
          </div>
          <p style={{fontSize:11.5,color:INK3,marginTop:6,marginBottom:22,lineHeight:1.45}}>{changesLeft>0?`Your name is locked to keep things stable. You can change it ${changesLeft} more time${changesLeft===1?"":"s"}.`:"You've used all your name changes — your name is now permanent."}</p>
        </>
      )}

      <Eyebrow>Bio</Eyebrow>
      <textarea value={bio} onChange={(e)=>setBio(e.target.value.slice(0,80))} rows={2} placeholder="A short line shown on your profile…" className="w-full rounded-xl px-3.5 py-2.5 outline-none" style={{border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff",resize:"none"}}/>
      <p style={{fontSize:11,color:INK3,marginTop:5,textAlign:"right"}}>{bio.length}/80</p>

      {askDiscard&&<ConfirmDialog title="Discard changes?" body="Your edits to your profile won't be saved." confirmLabel="Discard" danger onCancel={()=>setAskDiscard(false)} onConfirm={onBack}/>}
    </div>
  );
}

/* ---------- visibility & sheets ---------- */
function VisibilityOptions({value,onChange,friends=[]}){
  const order=["private","mentors","cohort","people","everyone"];
  return (
    <div>
      <div className="space-y-2">
        {order.map((key)=>{const meta=VIS[key];const I=meta.Icon;const on=value.type===key;return(
          <button key={key} onClick={()=>onChange({...value,type:key})} className="w-full flex items-center gap-3 rounded-xl p-3 text-left" style={{background:on?PINE_SOFT:SUNKEN,border:on?`1.5px solid ${PINE}`:"1.5px solid transparent"}}>
            <I size={18} style={{color:on?PINE_DEEP:INK2}}/>
            <div className="flex-1"><div className="font-semibold" style={{fontSize:14,color:on?PINE_DEEP:INK}}>{meta.label}</div><div style={{fontSize:11.5,color:on?PINE:INK3}}>{key==="private"?"Only you can see this goal":key==="mentors"?"Every mentor you're connected to":key==="cohort"?"Everyone in your cohort":key==="people"?"Choose from your friends list":"Anyone you're connected to"}</div></div>
            <span className="flex items-center justify-center rounded-full" style={{width:22,height:22,background:on?PINE:"transparent",border:on?"none":`2px solid ${BORDER2}`}}>{on&&<Check size={13} color="#fff" strokeWidth={3}/>}</span>
          </button>);})}
      </div>
      {value.type==="people"&&(
        friends.length===0?(
          <div className="mt-3 rounded-xl p-4 text-center" style={{background:SUNKEN}}><UserPlus size={20} style={{color:INK3}} className="mx-auto mb-1.5"/><p style={{fontSize:12.5,color:INK3}}>Add friends first, then choose who to share this with.</p></div>
        ):(
        <div className="mt-3 rounded-xl p-1" style={{background:SUNKEN}}>
          {friends.map((fid)=>{const pr=profileFor(fid);const on=value.people.includes(fid);return(
            <button key={fid} onClick={()=>{const people=on?value.people.filter((x)=>x!==fid):[...value.people,fid];onChange({...value,people});}} className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left">
              <Avatar name={pr.name} pfp={pr.avatar} size={30}/><div className="flex-1 min-w-0"><div className="font-medium truncate" style={{fontSize:13.5,color:INK}}>{pr.name}</div><div style={{fontSize:11,color:INK3}}>@{pr.username}</div></div>
              <span className="flex items-center justify-center rounded-md" style={{width:20,height:20,background:on?PINE:"transparent",border:on?"none":`2px solid ${BORDER2}`}}>{on&&<Check size={12} color="#fff" strokeWidth={3}/>}</span>
            </button>);})}
        </div>))}
    </div>
  );
}
function Sheet({title,onClose,children,footer}){
  return (
    <div className="fixed inset-0 flex justify-center" style={{zIndex:70,background:"rgba(28,25,23,.35)"}} onClick={onClose}>
      <div className="self-end w-full flex flex-col" style={{maxWidth:430}} onClick={(e)=>e.stopPropagation()}>
        <div className="czsheet flex flex-col" style={{background:CANVAS,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:"88vh"}}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{borderBottom:`1px solid ${BORDER}`}}><span style={{fontFamily:FD,fontSize:20,fontWeight:600,color:INK}}>{title}</span><button onClick={onClose} className="flex items-center justify-center rounded-full" style={{width:32,height:32,background:SUNKEN,color:INK2}}><X size={18}/></button></div>
          <div className="overflow-y-auto px-5 py-4" style={{flex:1}}>{children}</div>
          {footer&&<div className="px-5 pt-3" style={{borderTop:`1px solid ${BORDER}`,paddingBottom:"calc(14px + env(safe-area-inset-bottom))"}}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
function Seg({options,value,onChange}){
  return <div className="flex rounded-full p-1" style={{background:SUNKEN}}>{options.map((o)=>{const on=value===o.v;const dis=o.disabled;return <button key={o.v} disabled={dis} onClick={()=>!dis&&onChange(o.v)} className="flex-1 rounded-full font-semibold" style={{fontSize:13,padding:"9px 0",background:on?"#fff":"transparent",color:dis?INK3:on?PINE_DEEP:INK2,opacity:dis?0.6:1,boxShadow:on?"0 1px 2px rgba(28,25,23,.05)":"none"}}>{o.l}</button>;})}</div>;
}
function JoinSheet({onJoinCode,onClose}){
  const [code,setCode]=useState("");const [err,setErr]=useState("");const [busy,setBusy]=useState(false);
  const fmt=(raw)=>{const s=(raw||"").toUpperCase().replace(/[^A-Z0-9]/g,"");const letters=s.replace(/[0-9]/g,"").slice(0,5);const digits=s.replace(/[^0-9]/g,"").slice(0,3);return letters.length<5?letters:`${letters}-${digits}`;};
  const tryCode=async()=>{if(!code.trim()||busy)return;setBusy(true);setErr("");const e=await onJoinCode(code.trim());setBusy(false);if(e)setErr(e);};
  return (
    <Sheet title="Join a cohort" onClose={onClose}>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Invite code</label>
      <div className="flex gap-2 mt-1.5 mb-1">
        <input value={code} maxLength={9} onChange={(e)=>{setCode(fmt(e.target.value));if(err)setErr("");}} onKeyDown={(e)=>{if(e.key==="Enter")tryCode();}} placeholder="e.g. KDMWZ-482" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" className="flex-1 rounded-xl px-3.5 outline-none" style={{height:46,border:`1px solid ${err?CHEER:BORDER2}`,fontSize:16,color:INK,background:"#fff",letterSpacing:3,fontFamily:FD,textTransform:"uppercase"}}/>
        <button disabled={!code.trim()||busy} onClick={tryCode} className="rounded-xl font-semibold px-5" style={{height:46,background:code.trim()&&!busy?PINE:SUNKEN,color:code.trim()&&!busy?"#fff":INK3,fontSize:14}}>{busy?"…":"Join"}</button>
      </div>
      <p style={{fontSize:12,color:err?CHEER:INK3,marginBottom:18,minHeight:16}}>{err||"Ask a mentor for their cohort's invite code."}</p>
      <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{background:SUNKEN}}>
        <Lock size={15} style={{color:INK2,marginTop:1}}/>
        <p style={{fontSize:12,color:INK2,lineHeight:1.5}}>Cohorts are private. You can only join one with an invite code from someone already inside.</p>
      </div>
    </Sheet>
  );
}
function ThemePicker({value,onChange}){
  return (
    <div className="flex gap-2 flex-wrap">
      {THEME_KEYS.map((k)=>{const t=THEMES[k];const on=value===k;return(
        <button key={k} onClick={()=>onChange(k)} className="flex items-center gap-1.5 rounded-full px-3 py-2" style={{background:on?t.soft:SUNKEN,border:on?`1.5px solid ${t.dot}`:"1.5px solid transparent"}}>
          <span className="rounded-full" style={{width:14,height:14,background:t.dot}}/>
          <span className="font-semibold" style={{fontSize:12.5,color:on?t.accent:INK2}}>{t.label}</span>
        </button>);})}
    </div>
  );
}
function CohortPreview({name,theme,desc}){const t=THEMES[theme];return(
  <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{background:t.soft,border:`1px solid ${t.border}`}}>
    <div className="flex items-center justify-center rounded-xl" style={{width:38,height:38,background:"#fff"}}><Users size={18} style={{color:t.accent}}/></div>
    <div className="min-w-0"><div className="font-semibold truncate" style={{fontSize:14,color:INK}}>{name||"Your cohort"}</div><div className="truncate" style={{fontSize:11.5,color:t.accent}}>{desc||"Cohort goals will carry this color"}</div></div>
  </div>);}
function CreateCohortSheet({onClose,onCreate}){
  const [name,setName]=useState("");const [desc,setDesc]=useState("");const [theme,setTheme]=useState("pine");
  const clean=name.trim();const ok=clean.length>=2;const fullName=clean?`${clean} Cohort`:"";
  return (
    <Sheet title="Create a cohort" onClose={onClose}>
      <p style={{fontSize:13,color:INK3,marginTop:-6,marginBottom:14,lineHeight:1.5}}>You'll be the mentor. Set shared goals and invite members once it's created.</p>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Cohort name</label>
      <input autoFocus value={name} onChange={(e)=>setName(e.target.value.slice(0,24))} placeholder="e.g. Daybreak" className="w-full rounded-xl px-3.5 mt-1.5 mb-1 outline-none" style={{height:46,border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff"}}/>
      <p style={{fontSize:12,color:INK3,marginBottom:14}}>{fullName?`Shows as “${fullName}”.`:"At least 2 characters."}</p>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Short description <span style={{color:INK3,fontWeight:400}}>(optional)</span></label>
      <input value={desc} onChange={(e)=>setDesc(e.target.value.slice(0,60))} placeholder="What this cohort is about" className="w-full rounded-xl px-3.5 mt-1.5 mb-5 outline-none" style={{height:46,border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff"}}/>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Theme</label>
      <div className="mt-2 mb-3"><ThemePicker value={theme} onChange={setTheme}/></div>
      <div className="mb-5"><CohortPreview name={clean} theme={theme} desc={desc.trim()}/></div>
      <button disabled={!ok} onClick={()=>onCreate({name:clean,fullName,theme,description:desc.trim()})} className="w-full rounded-2xl py-3.5 font-semibold" style={{background:ok?PINE:SUNKEN,color:ok?"#fff":INK3,fontSize:15}}>Create cohort</button>
    </Sheet>
  );
}
function CohortSettingsSheet({cohortId,onClose,onSave,onSetRole,onRemoveMember,onArchive,onRegenerate,profile}){
  const c=COHORTS[cohortId];
  const [name,setName]=useState(c.name);const [desc,setDesc]=useState(c.description||"");const [theme,setTheme]=useState(c.theme||"pine");
  const [copied,setCopied]=useState(false);
  const [confirmRegen,setConfirmRegen]=useState(false);const [regenning,setRegenning]=useState(false);
  const doRegen=async()=>{if(!confirmRegen){setConfirmRegen(true);return;}setConfirmRegen(false);setRegenning(true);try{await onRegenerate(cohortId);}finally{setRegenning(false);}};
  const clean=name.trim();const ok=clean.length>=2;
  const dirty=clean!==c.name||theme!==(c.theme||"pine")||desc.trim()!==(c.description||"");
  const code=inviteCode(cohortId);
  const members=c.members;const mentorCount=members.filter((m)=>m.role==="mentor").length;
  const copy=()=>{try{if(navigator.clipboard)navigator.clipboard.writeText(code);}catch{}setCopied(true);setTimeout(()=>setCopied(false),1200);};
  return (
    <Sheet title="Cohort settings" onClose={onClose}>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Name</label>
      <input value={name} onChange={(e)=>setName(e.target.value.slice(0,24))} className="w-full rounded-xl px-3.5 mt-1.5 mb-4 outline-none" style={{height:46,border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff"}}/>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Short description</label>
      <input value={desc} onChange={(e)=>setDesc(e.target.value.slice(0,60))} placeholder="What this cohort is about" className="w-full rounded-xl px-3.5 mt-1.5 mb-5 outline-none" style={{height:46,border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff"}}/>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Theme</label>
      <p style={{fontSize:12,color:INK3,marginTop:2,marginBottom:8}}>Colors this cohort's shared goals across everyone's Kohort.</p>
      <div className="mb-3"><ThemePicker value={theme} onChange={setTheme}/></div>
      <div className="mb-4"><CohortPreview name={clean} theme={theme} desc={desc.trim()}/></div>
      <button disabled={!ok||!dirty} onClick={()=>onSave(cohortId,{name:clean,fullName:`${clean} Cohort`,theme,description:desc.trim()})} className="w-full rounded-2xl py-3.5 font-semibold mb-6" style={{background:(ok&&dirty)?PINE:SUNKEN,color:(ok&&dirty)?"#fff":INK3,fontSize:15}}>Save changes</button>

      <Eyebrow style={{margin:0}}>Invite</Eyebrow>
      <p style={{fontSize:12,color:INK3,margin:"2px 0 8px"}}>Share this code so people can join.</p>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 rounded-xl px-3.5 flex items-center" style={{height:46,background:SUNKEN,border:`1px solid ${BORDER2}`,fontFamily:FD,fontSize:15,letterSpacing:1,color:INK}}>{code}</div>
        <button onClick={copy} className="rounded-xl font-semibold px-4 inline-flex items-center gap-1.5" style={{height:46,background:copied?PINE_SOFT:PINE,color:copied?PINE_DEEP:"#fff",fontSize:13.5}}>{copied?<><Check size={15}/> Copied</>:<><Copy size={15}/> Copy</>}</button>
      </div>
      <button onClick={doRegen} onBlur={()=>setConfirmRegen(false)} disabled={regenning} className="inline-flex items-center gap-1.5 rounded-xl font-semibold px-3 mb-6" style={{height:38,background:confirmRegen?CHEER_SOFT:SUNKEN,color:confirmRegen?CHEER:INK2,fontSize:12.5,border:`1px solid ${confirmRegen?CHEER:BORDER2}`}}><RefreshCw size={14}/>{regenning?"Generating…":confirmRegen?"Tap again — this disables the old code":"Regenerate code"}</button>

      <Eyebrow style={{margin:0}}>Members · {members.length}</Eyebrow>
      <div className="space-y-2 mt-2 mb-6">
        {members.map((m)=>{const isMe=m.id===ME;const isMentor=m.role==="mentor";const lastMentor=isMentor&&mentorCount<=1;return(
          <div key={m.id} className="flex items-center gap-2.5 rounded-2xl p-2.5" style={{background:CARD,border:`1px solid ${BORDER}`}}>
            <Avatar name={dispName(m.id,profile)} pfp={dispPfp(m.id,profile)} size={36} ring={isMentor?STREAK:undefined}/>
            <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:13.5,color:INK}}>{dispName(m.id,profile)}{isMe&&<span style={{fontSize:11,color:PINE,fontWeight:600}}> · you</span>}</div><div className="capitalize" style={{fontSize:11.5,color:isMentor?STREAK:INK3}}>{m.role}</div></div>
            <button disabled={lastMentor} onClick={()=>onSetRole(cohortId,m.id,isMentor?"mentee":"mentor")} className="rounded-full font-semibold px-2.5 py-1.5" style={{fontSize:11.5,background:SUNKEN,color:lastMentor?INK3:INK2,opacity:lastMentor?0.5:1}}>{isMentor?"Demote":"Promote"}</button>
            <button disabled={isMe||lastMentor} onClick={()=>onRemoveMember(cohortId,m.id)} aria-label="Remove member" className="flex items-center justify-center rounded-full" style={{width:30,height:30,color:(isMe||lastMentor)?INK3:CHEER,opacity:(isMe||lastMentor)?0.4:1}}><UserMinus size={16}/></button>
          </div>);})}
      </div>

      <button onClick={()=>onArchive(cohortId)} className="w-full rounded-2xl py-3 font-semibold inline-flex items-center justify-center gap-2" style={{border:`1px solid ${BORDER2}`,background:CARD,color:CHEER,fontSize:14}}><Archive size={16}/> Delete cohort</button>
      <p style={{fontSize:11.5,color:INK3,textAlign:"center",marginTop:8}}>Removes it from your cohorts. You can rejoin with the code.</p>
    </Sheet>
  );
}
function GoalSheet({mode,goal,defaultVis,onClose,onSave,friends=[],preset}){
  const editing=mode==="edit";
  const locked=!editing&&!!preset;
  const [title,setTitle]=useState(editing?goal.title:"");const [category,setCategory]=useState(editing?goal.category:(preset?preset.category:"personal"));const [type,setType]=useState(editing?goal.type:"binary");
  const [icon,setIcon]=useState(editing?(goal.icon||"Target"):"Target");
  const [minStr,setMinStr]=useState(editing&&goal.type==="numeric"?String(goal.dailyMin):"");const [unit,setUnit]=useState(editing&&goal.unit?goal.unit:"pages");
  const [vis,setVis]=useState(editing&&goal.vis?goal.vis:{type:defaultVis||"private",people:[]});const [cid,setCid]=useState(editing?goal.cohortId:((preset&&preset.cohortId)||mentorCohorts()[0]||""));
  const canCreateCohort=mentorCohorts().length>0;const numOk=type!=="numeric"||(parseInt(minStr||"0",10)>0);
  const canSave=title.trim().length>0&&numOk&&!(category==="cohort"&&!canCreateCohort);
  const submit=()=>{const dm=Math.min(9999999,Math.max(1,parseInt(minStr||"0",10)||1));const spec={title:title.trim(),icon,category,cohortId:category==="cohort"?cid:undefined,type,unit:type==="numeric"?unit:"",dailyMin:type==="numeric"?dm:0,step:type==="numeric"?Math.max(1,Math.round(dm/4)):0,vis:category==="personal"?vis:null};onSave(editing?{id:goal.id,...spec}:spec);};
  return (
    <Sheet title={editing?"Edit goal":"New goal"} onClose={onClose} footer={<button disabled={!canSave} onClick={submit} className="w-full rounded-2xl font-semibold" style={{height:50,background:canSave?PINE:SUNKEN,color:canSave?"#fff":INK3}}>{editing?"Save changes":"Create goal"}</button>}>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Goal name</label>
      <input value={title} maxLength={48} onChange={(e)=>setTitle(e.target.value.slice(0,48))} placeholder="e.g. Read every morning" className="w-full rounded-xl px-4 mt-1.5 mb-1 outline-none" style={{height:46,border:`1px solid ${BORDER2}`,fontSize:15,color:INK,background:"#fff"}}/>
      <p style={{fontSize:11,color:INK3,textAlign:"right",marginBottom:14}}>{title.length}/48</p>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Icon</label>
      <div className="flex flex-wrap gap-2 mt-1.5 mb-4">
        {ICON_KEYS.map((k)=>{const Ic=ICONS[k];const on=icon===k;return(
          <button key={k} onClick={()=>setIcon(k)} aria-label={k} className="flex items-center justify-center rounded-xl" style={{width:42,height:42,background:on?PINE_SOFT:SUNKEN,border:on?`1.5px solid ${PINE}`:"1.5px solid transparent"}}><Ic size={19} style={{color:on?PINE_DEEP:INK2}}/></button>);})}
      </div>
      {(editing||locked)?(
        <div className="mb-4"><label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Category</label><div className="mt-1.5 rounded-xl px-3.5 py-3 flex items-center gap-2" style={{background:SUNKEN}}>{category==="cohort"?<><Users size={15} style={{color:PINE_DEEP}}/><span className="font-semibold" style={{fontSize:14,color:INK}}>{COHORTS[editing?goal.cohortId:cid]?COHORTS[editing?goal.cohortId:cid].fullName:"Cohort"}</span></>:<><Lock size={15} style={{color:INK2}}/><span className="font-semibold" style={{fontSize:14,color:INK}}>Personal</span></>}</div></div>
      ):(<>
        <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Category</label>
        <div className="mt-1.5 mb-2"><Seg options={[{v:"cohort",l:"Cohort",disabled:!canCreateCohort},{v:"personal",l:"Personal"}]} value={category} onChange={setCategory}/></div>
        {!canCreateCohort&&<p style={{fontSize:11.5,color:INK3,marginBottom:14}}>You're a mentee in all your cohorts — only mentors create cohort goals.</p>}
        {category==="cohort"&&canCreateCohort&&(<div className="mb-4 mt-2"><label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Which cohort?</label><div className="mt-1.5 space-y-2">{mentorCohorts().map((id)=>{const on=cid===id;return(<button key={id} onClick={()=>setCid(id)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left" style={{background:on?PINE_SOFT:SUNKEN,border:on?`1.5px solid ${PINE}`:"1.5px solid transparent"}}><span className="font-semibold" style={{fontSize:14,color:on?PINE_DEEP:INK}}>{COHORTS[id].fullName}</span>{on&&<Check size={15} style={{color:PINE}} strokeWidth={3}/>}</button>);})}</div></div>)}
      </>)}
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Type</label>
      <div className="mt-1.5 mb-2"><Seg options={[{v:"binary",l:"Completion"},{v:"numeric",l:"Numeric"}]} value={type} onChange={setType}/></div>
      <p style={{fontSize:11.5,color:INK3,marginBottom:16}}>{type==="binary"?"One tap marks the day complete.":"Set a daily minimum. Hitting it earns a tally; your entry is always recorded."}</p>
      {type==="numeric"&&(<div className="rounded-xl p-3.5 mb-4" style={{background:SUNKEN}}>
        <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Daily minimum</label>
        <input type="number" inputMode="numeric" value={minStr} onChange={(e)=>setMinStr(e.target.value.replace(/[^0-9]/g,"").slice(0,7))} placeholder="Type a number, e.g. 20" className="w-full rounded-lg px-3 mt-1.5 mb-3 outline-none" style={{height:44,border:`1px solid ${minStr&&!numOk?CHEER:BORDER2}`,fontFamily:FD,fontSize:17,fontWeight:600,color:INK,background:"#fff"}}/>
        <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Unit</label>
        <input value={unit} maxLength={16} onChange={(e)=>setUnit(e.target.value.slice(0,16))} placeholder="pages, minutes, reps…" className="w-full rounded-lg px-3 mt-1.5 outline-none" style={{height:42,border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff"}}/>
      </div>)}
      {category==="personal"&&!editing&&(<div><label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Who can see this?</label><p style={{fontSize:11.5,color:INK3,margin:"2px 0 10px"}}>Personal goals are private until you share them.</p><VisibilityOptions value={vis} onChange={setVis} friends={friends}/></div>)}
    </Sheet>
  );
}
function VisibilitySheet({goal,onClose,onSave,friends=[]}){const [vis,setVis]=useState(goal.vis);return (<Sheet title={`Share "${goal.title}"`} onClose={onClose} footer={<button onClick={()=>onSave(goal.id,vis)} className="w-full rounded-2xl font-semibold" style={{height:50,background:PINE,color:"#fff"}}>Save visibility</button>}><VisibilityOptions value={vis} onChange={setVis} friends={friends}/></Sheet>);}
function NudgeSheet({member,onClose,onSend}){
  const [text,setText]=useState("");const first=member.name.split(" ")[0];const rk=riskOf(member);
  return (
    <Sheet title={`Nudge ${first}`} onClose={onClose} footer={<button disabled={!text.trim()} onClick={()=>onSend(text.trim())} className="w-full rounded-2xl font-semibold flex items-center justify-center gap-2" style={{height:50,background:text.trim()?PINE:SUNKEN,color:text.trim()?"#fff":INK3}}><Send size={17}/> Send nudge</button>}>
      <div className="flex items-center gap-3 rounded-xl p-3 mb-4" style={{background:SUNKEN}}><Avatar name={member.name} size={38}/><div><div className="font-semibold" style={{fontSize:14,color:INK}}>{member.name}</div><div style={{fontSize:12,color:rk.risk?CHEER:PINE}}>{rk.risk?rk.reason:"On track"} · {member.weekPct}% this week</div></div></div>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Quick nudges</label>
      <div className="space-y-2 mt-1.5 mb-4">{NUDGE_PRESETS.map((p,i)=>(<button key={i} onClick={()=>onSend(p)} className="w-full text-left rounded-xl px-3.5 py-3" style={{background:CARD,border:`1px solid ${BORDER2}`,fontSize:13.5,color:INK}}>{p}</button>))}</div>
      <label className="font-semibold" style={{fontSize:12.5,color:INK2}}>Or write your own</label>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="A personal note…" rows={3} className="w-full rounded-xl px-3.5 py-2.5 mt-1.5 outline-none" style={{border:`1px solid ${BORDER2}`,fontSize:14,color:INK,background:"#fff",resize:"none"}}/>
      <p style={{fontSize:11.5,color:INK3,marginTop:8}}>Sends to {first}'s encouragement wall.</p>
    </Sheet>
  );
}

/* ---------- settings ---------- */
const DEFAULT_SETTINGS={
  notif:{checkin:true,atRisk:true,cheers:true,nudges:true,newGoal:false,milestones:true},
  defaultVis:"private",
  reduceMotion:false,
  weekStart:"sun",
server:{on:true,url:(import.meta.env&&import.meta.env.VITE_API_BASE)||"https://cetele-api.onrender.com"},  // override per build with VITE_API_BASE
  push:false,
};
const SERVER_KEY="cetele:server:v1";
function SoonPill(){return <span className="rounded-full font-bold uppercase" style={{fontSize:9.5,letterSpacing:0.8,padding:"2px 7px",color:INK3,background:SUNKEN}}>Soon</span>;}
function Switch({on,onChange}){
  return <button onClick={onChange} aria-pressed={on} className="rounded-full shrink-0" style={{width:44,height:26,padding:2,background:on?PINE:BORDER2,transition:"background .15s"}}>
    <span className="block rounded-full" style={{width:22,height:22,background:"#fff",boxShadow:"0 1px 2px rgba(28,25,23,.2)",transform:on?"translateX(18px)":"translateX(0)",transition:"transform .15s"}}/>
  </button>;
}
function GroupCard({children}){return <div className="rounded-2xl overflow-hidden mb-2" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>{children}</div>;}
function SettingRow({icon:Ic,label,sub,right,onClick,last,danger}){
  const Tag=onClick?"button":"div";
  return <Tag onClick={onClick} className="w-full flex items-center gap-3 px-4 text-left" style={{minHeight:52,borderBottom:last?"none":`1px solid ${BORDER}`}}>
    {Ic&&<div className="flex items-center justify-center rounded-lg shrink-0" style={{width:30,height:30,background:danger?CHEER_SOFT:SUNKEN}}><Ic size={16} style={{color:danger?CHEER:INK2}}/></div>}
    <div className="flex-1 min-w-0 py-2"><div className="font-semibold" style={{fontSize:14,color:danger?CHEER:INK}}>{label}</div>{sub&&<div style={{fontSize:11.5,color:INK3,marginTop:1}}>{sub}</div>}</div>
    {right}
  </Tag>;
}
function ConfirmDialog({title,body,confirmLabel,danger,onConfirm,onCancel}){
  return <div className="fixed inset-0 flex items-center justify-center px-8" style={{zIndex:70,background:"rgba(28,25,23,.4)"}} onClick={onCancel}>
    <div className="w-full rounded-3xl p-5" style={{maxWidth:330,background:CANVAS,boxShadow:E2}} onClick={(e)=>e.stopPropagation()}>
      <h3 style={{fontFamily:FD,fontSize:19,fontWeight:600,color:INK}}>{title}</h3>
      <p style={{fontSize:13.5,color:INK2,lineHeight:1.5,marginTop:6}}>{body}</p>
      <div className="flex gap-2 mt-5">
        <button onClick={onCancel} className="flex-1 rounded-2xl font-semibold" style={{height:46,background:SUNKEN,color:INK2,fontSize:14}}>Cancel</button>
        <button onClick={onConfirm} className="flex-1 rounded-2xl font-semibold" style={{height:46,background:danger?CHEER:PINE,color:"#fff",fontSize:14}}>{confirmLabel}</button>
      </div>
    </div>
  </div>;
}
function SettingsScreen({settings,onChange,subscribed,onLeave,onJoinOpen,onReset,onBack,profile,onEditProfile,onSwitchAccount,onSignOut,onReplayIntro,serverStatus,onServerChange,onTestConnection,onDeleteAccount,onShowRecovery,onTogglePush}){
  const [visOpen,setVisOpen]=useState(false);
  const [confirm,setConfirm]=useState(null);
  const setNotif=(k)=>onChange({...settings,notif:{...settings.notif,[k]:!settings.notif[k]}});
  const notifRows=[
    ["checkin","Daily check-in reminder","A nudge to log before the day ends"],
    ["atRisk","Streak at risk","When a streak is about to break"],
    ["cheers","Cheers on your activity","When someone cheers you on"],
    ["nudges","Nudges from mentors","When a mentor reaches out"],
    ["newGoal","New cohort goal","When a mentor adds a shared goal"],
    ["milestones","Milestones","Books finished, streaks, comebacks"],
  ];
  const visMeta=VIS[settings.defaultVis];const VisI=visMeta.Icon;
  return (
    <div className="px-4 pt-3 pb-28">
      <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
      <h1 style={{fontFamily:FD,fontSize:26,fontWeight:600,color:INK,letterSpacing:-0.5,marginBottom:16}}>Settings</h1>

      <button onClick={onEditProfile} className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-6 text-left" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
        <Avatar name={profile.name} pfp={profile.avatar} size={52} ring={PINE}/>
        <div className="flex-1 min-w-0"><div className="font-semibold" style={{fontFamily:FD,fontSize:18,color:INK}}>{profile.name}</div><div style={{fontSize:12.5,color:INK3}}>@{profile.username} · Edit profile</div></div>
        <ChevronRight size={18} style={{color:INK3}}/>
      </button>

      <Eyebrow>Data source</Eyebrow>
      <GroupCard>
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-3"><div className="flex items-center justify-center rounded-lg shrink-0" style={{width:30,height:30,background:SUNKEN}}><Database size={16} style={{color:INK2}}/></div><span className="font-semibold" style={{fontSize:14,color:INK}}>Backend</span></div>
            <div style={{width:168}}><Seg options={[{v:"demo",l:"Demo"},{v:"server",l:"Server"}]} value={settings.server.on?"server":"demo"} onChange={(v)=>onServerChange({...settings.server,on:v==="server"})}/></div>
          </div>
          <p style={{fontSize:11.5,color:INK3,marginLeft:42}}>{settings.server.on?"Reads and writes go to your running Kohort server.":"Runs fully in the browser with local persistence."}</p>
          {settings.server.on&&(<>
            <input value={settings.server.url} onChange={(e)=>onServerChange({...settings.server,url:e.target.value})} placeholder="http://localhost:4000" spellCheck={false} className="w-full rounded-xl px-3.5 mt-3 outline-none" style={{height:42,border:`1px solid ${BORDER2}`,fontSize:13,color:INK,background:"#fff"}}/>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2"><span className="rounded-full" style={{width:9,height:9,background:serverStatus?(serverStatus.ok?PINE:CHEER):INK3}}/><span style={{fontSize:12,color:INK2}}>{serverStatus?(serverStatus.ok?"Connected":"Not reachable"):"Not tested"}</span></div>
              <button onClick={onTestConnection} className="rounded-full font-semibold px-3 py-1.5" style={{fontSize:12,background:SUNKEN,color:INK2}}>Test connection</button>
            </div>
          </>)}
        </div>
      </GroupCard>
      <p style={{fontSize:11,color:INK3,margin:"0 4px 8px"}}>Start the server with <span style={{fontFamily:"ui-monospace,monospace"}}>npm start</span> in cetele-backend, then switch to Server.</p>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{background:SUNKEN,margin:"0 0 22px"}}><Clock size={14} style={{color:INK2}}/><p style={{fontSize:11.5,color:INK2,lineHeight:1.45}}>Timezone <b style={{color:INK}}>{USER_TZ}</b> · days roll over at <b style={{color:INK}}>4am</b> your local time, so late-night logging still counts toward the day before.</p></div>

      <Eyebrow>Notifications</Eyebrow>
      <GroupCard>
        {notifRows.map(([k,l,s],i)=><SettingRow key={k} icon={Bell} label={l} sub={s} last={i===notifRows.length-1} right={<Switch on={settings.notif[k]} onChange={()=>setNotif(k)}/>}/>)}
      </GroupCard>
      <p style={{fontSize:11.5,color:INK3,margin:"0 4px 22px",lineHeight:1.45}}>Delivered notifications arrive with the backend — for now these preferences are saved on this device.</p>

      <Eyebrow>Privacy</Eyebrow>
      <GroupCard>
        <SettingRow icon={ShieldCheck} label="Default visibility for new goals" sub="What a new personal goal starts as" onClick={()=>setVisOpen(!visOpen)} last right={<span className="inline-flex items-center gap-1.5" style={{fontSize:13,fontWeight:600,color:PINE_DEEP}}><VisI size={14}/>{visMeta.label}<ChevronDown size={15} style={{color:INK3,transform:visOpen?"rotate(180deg)":"none",transition:"transform .2s"}}/></span>}/>
      </GroupCard>
      {visOpen&&<div className="rounded-2xl p-1 mb-2" style={{background:SUNKEN}}>
        {["private","mentors","cohort","everyone"].map((key)=>{const meta=VIS[key];const I=meta.Icon;const on=settings.defaultVis===key;return(
          <button key={key} onClick={()=>{onChange({...settings,defaultVis:key});setVisOpen(false);}} className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left"><I size={16} style={{color:on?PINE_DEEP:INK2}}/><span className="flex-1 font-medium" style={{fontSize:13.5,color:on?PINE_DEEP:INK}}>{meta.label}</span>{on&&<Check size={15} style={{color:PINE}} strokeWidth={3}/>}</button>);})}
      </div>}
      <div className="mb-6"/>

      <Eyebrow>Appearance</Eyebrow>
      <GroupCard>
        <SettingRow icon={Sparkles} label="Reduce motion" sub="Turn off sheet slides and pops" right={<Switch on={settings.reduceMotion} onChange={()=>onChange({...settings,reduceMotion:!settings.reduceMotion})}/>}/>
        <SettingRow icon={Moon} label="Dark theme" right={<SoonPill/>}/>
        <SettingRow icon={Type} label="Text size" last right={<SoonPill/>}/>
      </GroupCard>
      <div className="mb-6"/>

      <Eyebrow>Language &amp; region</Eyebrow>
      <GroupCard>
        <SettingRow icon={Languages} label="Language" right={<span className="inline-flex items-center gap-2"><span style={{fontSize:13,color:INK2}}>English</span><SoonPill/></span>}/>
        <SettingRow icon={Compass} label="Week Start" last right={
          <div className="flex rounded-full p-0.5" style={{background:SUNKEN}}>{[["sun","Sun"],["mon","Mon"]].map(([v,l])=>{const on=settings.weekStart===v;return <button key={v} onClick={()=>onChange({...settings,weekStart:v})} className="rounded-full font-semibold" style={{fontSize:12,padding:"5px 12px",background:on?"#fff":"transparent",color:on?PINE_DEEP:INK2,boxShadow:on?"0 1px 2px rgba(28,25,23,.05)":"none"}}>{l}</button>;})}</div>
        }/>
      </GroupCard>
      <div className="mb-6"/>

      <Eyebrow>Your cohorts</Eyebrow>
      <GroupCard>
        {subscribed.length===0&&<SettingRow label="You're not in any cohort" sub="Join one to track shared goals" last/>}
        {subscribed.map((id,i)=>{const c=COHORTS[id];return(
          <SettingRow key={id} icon={Users} label={c.fullName} sub={`${c.members.length} members`} last={i===subscribed.length-1} right={
            <span className="flex items-center gap-2"><RoleTag role={myRoleIn(id)} small/><button onClick={()=>setConfirm({kind:"leave",id})} className="font-semibold" style={{fontSize:12.5,color:CHEER}}>Leave</button></span>
          }/>);})}
      </GroupCard>
      <button onClick={onJoinOpen} className="w-full flex items-center gap-3 rounded-2xl px-4 mb-6" style={{minHeight:50,background:SUNKEN,border:`1px dashed ${BORDER2}`}}>
        <div className="flex items-center justify-center rounded-lg" style={{width:30,height:30,background:"#fff"}}><Plus size={16} style={{color:PINE_DEEP}}/></div><span className="font-semibold" style={{fontSize:14,color:PINE_DEEP}}>Join a cohort</span>
      </button>

      <Eyebrow>Data</Eyebrow>
      <GroupCard>
        <SettingRow icon={Database} label="Export my data" right={<SoonPill/>}/>
        <SettingRow icon={Compass} label="Replay welcome tour" onClick={onReplayIntro} right={<ChevronRight size={18} style={{color:INK3}}/>}/>
        <SettingRow icon={RotateCcw} label="Reset to demo data" sub="Restore the original seed and clear your changes" last onClick={()=>setConfirm({kind:"reset"})} right={<ChevronRight size={18} style={{color:INK3}}/>}/>
      </GroupCard>
      <div className="mb-6"/>

      <Eyebrow>Account</Eyebrow>
      <GroupCard>
        <button onClick={onSwitchAccount} className="w-full flex items-center gap-3 px-4 text-left" style={{minHeight:60,borderBottom:`1px solid ${BORDER}`}}>
          <Avatar name={profile.name} pfp={profile.avatar} size={38}/>
          <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14.5,color:INK}}>{profile.name}</div><div style={{fontSize:12,color:INK3}}>@{profile.username}</div></div>
          <span className="inline-flex items-center gap-1 font-semibold" style={{fontSize:12.5,color:PINE_DEEP}}>Switch <ChevronRight size={15}/></span>
        </button>
        {settings.server.on&&<SettingRow icon={BellRing} label="Push notifications" sub={settings.push?"On for this device":"Streak risk & nudges on this device"} right={<Switch on={!!settings.push} onChange={onTogglePush}/>}/>}
        {settings.server.on&&<SettingRow icon={KeyRound} label="Recovery code" sub="View or regenerate your reset code" onClick={onShowRecovery} right={<ChevronRight size={18} style={{color:INK3}}/>}/>}
        <SettingRow icon={LogOut} label="Sign out" onClick={settings.server.on?onSignOut:undefined} right={settings.server.on?<ChevronRight size={18} style={{color:INK3}}/>:<SoonPill/>}/>
        <SettingRow icon={Trash2} label="Delete account" danger last onClick={()=>setConfirm({kind:"delete"})} right={<ChevronRight size={18} style={{color:CHEER}}/>}/>
      </GroupCard>
      <p style={{fontSize:11.5,color:INK3,margin:"0 4px 26px",lineHeight:1.45}}>Switch account lets you experience Kohort as any cohort member. Secure sign-in, passwords, and sync arrive with the backend.</p>

      <div className="flex flex-col items-center text-center pt-2">
        <div className="mb-2.5"><Logo size={44}/></div>
        <div style={{fontFamily:FD,fontSize:16,fontWeight:600,color:INK}}>Kohort 1.2.3</div>
        <p style={{fontSize:12,color:INK3,marginTop:2}}>Made for cohorts who keep each other going.</p>
        <div className="flex items-center gap-3 mt-3" style={{fontSize:12,color:INK2}}><span className="inline-flex items-center gap-1">Terms <SoonPill/></span><span style={{color:BORDER2}}>·</span><span className="inline-flex items-center gap-1">Privacy <SoonPill/></span></div>
      </div>

      {confirm&&confirm.kind==="leave"&&<ConfirmDialog title={`Leave ${COHORTS[confirm.id].name}?`} body={`You'll stop seeing ${COHORTS[confirm.id].name}'s shared goals and standings. You can rejoin anytime.`} confirmLabel="Leave" danger onCancel={()=>setConfirm(null)} onConfirm={()=>{onLeave(confirm.id);setConfirm(null);}}/>}
      {confirm&&confirm.kind==="delete"&&<ConfirmDialog title="Delete your account?" body={settings.server.on?"This permanently removes your account, goals, logs, and history. Cohort goals you created pass to a remaining member. This can't be undone.":"In demo mode this clears your local changes and restores the seed. On a real account this permanently deletes everything."} confirmLabel="Delete account" danger onCancel={()=>setConfirm(null)} onConfirm={()=>{setConfirm(null);onDeleteAccount();}}/>}
      {confirm&&confirm.kind==="reset"&&<ConfirmDialog title="Reset to demo data?" body="This clears every change you've made — goals, logs, cheers, nudges, and settings — and restores the original seed." confirmLabel="Reset" danger onCancel={()=>setConfirm(null)} onConfirm={()=>{onReset();setConfirm(null);}}/>}
    </div>
  );
}

/* ---------- search ---------- */
function SearchScreen({onBack,onOpenMember,subscribed,profile,friends,statusOf,onToggleFriend,requests=[],onAccept,onDecline}){
  const [q,setQ]=useState("");
  const [res,setRes]=useState({users:[],cohorts:[]});
  const [loading,setLoading]=useState(false);
  useEffect(()=>{let live=true;
    if(!q.trim()){api.cohorts(profile).then((cs)=>{if(live)setRes({users:[],cohorts:cs});});return ()=>{live=false;};}
    setLoading(true);
    const t=setTimeout(()=>{api.search(q,profile).then((r)=>{if(live){setRes(r);setLoading(false);}});},300);
    return ()=>{live=false;clearTimeout(t);};
  },[q,profile]);
  const empty=!q.trim();
  const noHits=!empty&&!loading&&res.users.length===0&&res.cohorts.length===0;
  return (
    <div className="px-4 pt-3 pb-28">
      <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
      <h1 style={{fontFamily:FD,fontSize:26,fontWeight:600,color:INK,letterSpacing:-0.5,marginBottom:14}}>Search</h1>
      <div className="flex items-center rounded-2xl px-3.5 mb-5" style={{height:50,background:CARD,border:`1px solid ${BORDER2}`}}>
        <SearchIcon size={18} style={{color:INK3}}/>
        <input autoFocus value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Name, @username, or cohort" className="flex-1 px-2.5 outline-none" style={{fontSize:15,color:INK,background:"transparent"}}/>
        {q&&<button onClick={()=>setQ("")} className="flex items-center justify-center rounded-full" style={{width:24,height:24,background:SUNKEN,color:INK2}}><X size={14}/></button>}
      </div>
      {empty&&requests.length>0&&(<>
        <Eyebrow>Friend requests</Eyebrow>
        <div className="space-y-2 mb-6">
          {requests.map((r)=>{const pr=profileFor(r.fromId);return(
            <div key={r.fromId} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{background:MINT,border:`1px solid ${MINT_BORDER}`}}>
              <button onClick={()=>onOpenMember(r.fromId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar name={pr.name} pfp={pr.avatar} size={42}/>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14.5,color:INK}}>{pr.name}</div><div style={{fontSize:12.5,color:PINE}}>@{pr.username}</div><div style={{fontSize:11.5,color:INK3,marginTop:1}}>wants to be friends</div></div>
              </button>
              <button onClick={()=>onAccept&&onAccept(r.fromId)} className="rounded-full font-semibold px-3.5" style={{height:34,background:PINE,color:"#fff",fontSize:12.5}}>Accept</button>
              <button onClick={()=>onDecline&&onDecline(r.fromId)} className="rounded-full font-semibold px-2.5" style={{height:34,background:"#fff",color:INK2,fontSize:12.5,border:`1px solid ${BORDER2}`}}>Decline</button>
            </div>);})}
        </div>
      </>)}
      {empty&&friends.length>0&&(<>
        <Eyebrow>Your friends</Eyebrow>
        <div className="space-y-2 mb-6">
          {friends.map((id)=>{const u=USER_BY_ID[id]||USER_CACHE[id];if(!u)return null;return(
            <div key={id} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
              <button onClick={()=>onOpenMember(id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar name={dispName(id,profile)} pfp={dispPfp(id,profile)} size={42}/>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14.5,color:INK}}>{dispName(id,profile)}</div><div style={{fontSize:12.5,color:PINE}}>@{profileFor(id).username}</div>{userCohortHint(id)&&<div style={{fontSize:11.5,color:INK3,marginTop:1}}>{userCohortHint(id)}</div>}</div>
              </button>
              <FriendButton status={statusOf(id)} onClick={()=>onToggleFriend(id)}/>
            </div>);})}
        </div>
      </>)}
      {res.users.length>0&&(<>
        <Eyebrow>People</Eyebrow>
        <div className="space-y-2 mb-6">
          {res.users.map((u)=>{const isFriend=friends.includes(u.id);return(
            <div key={u.id} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
              <button onClick={()=>onOpenMember(u.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar name={dispName(u.id,profile)} pfp={dispPfp(u.id,profile)} size={42}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-semibold truncate" style={{fontSize:14.5,color:INK}}>{dispName(u.id,profile)}</span>{u.id===ME&&<span style={{fontSize:11,color:PINE,fontWeight:600}}>you</span>}</div>
                  <div style={{fontSize:12.5,color:PINE}}>@{u.id===ME?profile.username:u.username}</div>
                  {isFriend&&userCohortHint(u.id)&&<div style={{fontSize:11.5,color:INK3,marginTop:1}}>{userCohortHint(u.id)}</div>}
                </div>
              </button>
              {u.id!==ME&&<FriendButton status={statusOf(u.id)} onClick={()=>onToggleFriend(u.id)}/>}
            </div>);})}
        </div>
      </>)}
      {res.cohorts.length>0&&(<>
        <Eyebrow>{empty?"Cohorts to explore":"Cohorts"}</Eyebrow>
        <div className="space-y-2.5">
          {res.cohorts.map((c)=>{const joined=subscribed.includes(c.id);return(
            <div key={c.id} className="flex items-center gap-3 rounded-2xl p-3.5" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
              <div className="flex items-center justify-center rounded-xl" style={{width:42,height:42,background:PINE_SOFT}}><Users size={20} style={{color:PINE_DEEP}}/></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14.5,color:INK}}>{c.fullName}</div><div style={{fontSize:12,color:INK3}}>{c.memberCount} member{c.memberCount===1?"":"s"}</div></div>
              {joined?<span className="inline-flex items-center gap-1 rounded-xl font-semibold px-3" style={{height:36,background:MINT,color:PINE_DEEP,fontSize:13,border:`1px solid ${MINT_BORDER}`}}><Check size={14}/> Joined</span>
                :<span className="inline-flex items-center gap-1 rounded-xl font-medium px-3" style={{height:36,background:SUNKEN,color:INK3,fontSize:12}}><Lock size={12}/> Invite only</span>}
            </div>);})}
        </div>
      </>)}
      {empty&&<p style={{fontSize:12.5,color:INK3,marginTop:16,lineHeight:1.5}}>Search people by name or @username, or tap a cohort above to join it.</p>}
      {noHits&&<div className="rounded-2xl p-6 text-center" style={{border:`2px dashed ${BORDER2}`}}><SearchIcon size={22} style={{color:INK3}} className="mx-auto mb-2"/><p className="font-semibold" style={{fontSize:14,color:INK}}>No matches for “{q}”</p><p style={{fontSize:12.5,color:INK3,marginTop:2}}>Try a different name, @username, or cohort.</p></div>}
    </div>
  );
}

/* ---------- goal detail ---------- */
function GoalDetailScreen({goal:g,onBack,onSetValue,onToggle,onEditVis,onEdit,onDelete,canManage}){
  const [day,setDay]=useState(TODAY_INDEX);
  const [editing,setEditing]=useState(false);const [temp,setTemp]=useState("");
  const th=g.category==="cohort"?themeOf(g.cohortId):null;const accent=th?th.dot:PINE;
  const done=weekDone(g);const p=g.target?Math.round((done/g.target)*100):0;
  const met=metOn(g,day);const val=valueOnDate(g,WEEK_ISO[day]);const canLog=dayEditable(day);const isFuture=isFutureIdx(day);
  const isToday=day===TODAY_INDEX;const dayLabel=isToday?"Today":`${WEEK_DAYS[day].d} ${WEEK_DAYS[day].n}`;
  const maxVal=Math.max(g.dailyMin||1,...(g.values||[1]),1);
  const commit=()=>{const v=Math.max(0,parseInt(temp||"0",10)||0);onSetValue(g.id,WEEK_ISO[day],v);setEditing(false);};
  const numTotal=g.type==="numeric"?(g.values||[]).reduce((a,b)=>a+(b||0),0):0;
  const stats=g.type==="numeric"
    ? [[g.streak,"day streak"],[`${done}/${g.target}`,"days met"],[numTotal,`${g.unit} total`]]
    : [[g.streak,"day streak"],[`${done}/${g.target}`,"days done"],[`${p}%`,"of weekly goal"]];
  return (
    <div className="pb-28">
      <div className="px-4 pt-3 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-2" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
        {canManage&&<button onClick={()=>onEdit(g.id)} className="inline-flex items-center gap-1.5 rounded-full font-semibold mb-2" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:13,padding:"6px 12px"}}><Pencil size={14}/> Edit</button>}
      </div>
      <div className="px-4">
        <div className="flex items-center gap-2 mb-1.5">
          {g.category==="cohort"
            ? <span className="inline-flex items-center gap-1 rounded-full" style={{background:th.soft,color:th.accent,fontSize:11,fontWeight:700,padding:"2px 8px"}}><Users size={11}/> {cohortName(g.cohortId)}</span>
            : <VisChip vis={g.vis} onClick={()=>onEditVis(g.id)}/>}
          <StreakBadge n={g.streak} small/>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-2xl" style={{width:46,height:46,background:th?th.soft:PINE_SOFT}}><g.Icon size={24} style={{color:accent}}/></div>
          <div className="min-w-0" style={{flex:1}}><h2 style={{fontFamily:FD,fontSize:23,fontWeight:600,color:INK,letterSpacing:-0.4,lineHeight:1.15,overflowWrap:"anywhere",wordBreak:"break-word",hyphens:"auto"}}>{g.title}</h2><p style={{fontSize:12.5,color:INK3}}>{g.type==="numeric"?`Minimum ${g.dailyMin} ${g.unit} a day`:"Done each day"} · {g.target}× weekly target</p></div>
        </div>
      </div>

      <div className="px-4 mt-4"><div className="grid grid-cols-3 gap-2.5">
        {stats.map(([v,l],i)=>(
          <div key={i} className="rounded-2xl p-3 text-center" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
            <div style={{fontFamily:FD,fontSize:21,fontWeight:600,color:i===0?STREAK:INK,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10.5,color:INK3,marginTop:3}}>{l}</div>
          </div>))}
      </div></div>

      <div className="px-4 mt-4"><div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-3"><p className="font-semibold" style={{color:INK,fontSize:14}}>This week · {WEEK_LABEL}</p><span style={{fontSize:11.5,color:INK3}}>tap a day</span></div>
        <div className="flex items-end justify-between gap-1.5" style={{height:104}}>
          {WEEK_DAYS.map((d,i)=>{const v=valueOnDate(g,WEEK_ISO[i]);const m=metOn(g,i);const frac=g.type==="binary"?(m?1:0):Math.min((v||0)/maxVal,1);const barColor=m?accent:(v>0?"#fbbf24":"transparent");const on=i===day;return(
            <button key={i} onClick={()=>setDay(i)} className="flex-1 flex flex-col items-center gap-1.5" style={{minWidth:0}}>
              <div className="w-full flex items-end" style={{height:78,background:SUNKEN,borderRadius:7,overflow:"hidden",outline:on?`2px solid ${accent}`:"none",outlineOffset:1}}>
                <div style={{width:"100%",height:`${Math.max(frac*100,frac>0?6:0)}%`,background:barColor,borderRadius:frac>=0.99?"7px 7px 0 0":"4px 4px 0 0"}}/>
              </div>
              <span style={{fontSize:10.5,fontWeight:on?700:500,color:on?accent:INK3}}>{d.d}</span>
              {isFutureIdx(i)?<span style={{width:4,height:4,borderRadius:"50%",background:BORDER2,marginTop:4}}/>:dayEditable(i)?<span style={{fontSize:10,color:m?PINE_DEEP:INK3,height:12}}>{g.type==="numeric"?(v||0):(m?"✓":"·")}</span>:<Lock size={9} style={{color:INK3}}/>}
            </button>);})}
        </div>
      </div></div>

      <div className="px-4 mt-3"><div className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-2">
          <span className="uppercase font-bold" style={{fontSize:10.5,letterSpacing:0.8,color:isToday?accent:INK3}}>{dayLabel}</span>
          {canLog?(!isToday&&<span style={{fontSize:10.5,color:INK3}}>logging a past day</span>):isFuture?<span style={{fontSize:10.5,color:INK3}}>upcoming</span>:<span className="inline-flex items-center gap-1" style={{fontSize:10.5,color:INK3}}><Lock size={11}/> locked</span>}
        </div>
        {!canLog?(
          <div className="flex items-center justify-between rounded-xl px-3.5" style={{height:46,background:SUNKEN}}>
            <span style={{fontSize:13.5,color:INK2}}>{isFuture?`${WEEK_DAYS[day].d} ${WEEK_DAYS[day].n}`:(g.type==="binary"?(met?"Marked done":"Not done"):`${val} / ${g.dailyMin} ${g.unit}`)}</span>
            {isFuture?<span style={{fontSize:11.5,color:INK3}}>not yet</span>:met?<span className="inline-flex items-center gap-1 rounded-full font-semibold" style={{color:PINE_DEEP,background:PINE_SOFT,fontSize:11.5,padding:"3px 9px"}}><Check size={12} strokeWidth={3}/> met</span>:<span style={{fontSize:11.5,color:INK3}}>past edit window</span>}
          </div>
        ):g.type==="binary"?(
          <button onClick={()=>onToggle(g.id,WEEK_ISO[day])} className="w-full flex items-center justify-between rounded-xl px-3.5" style={{height:48,background:met?PINE_SOFT:"transparent",border:met?"none":`1.5px solid ${BORDER2}`}}>
            <span className="font-semibold" style={{color:met?PINE_DEEP:INK2,fontSize:14.5}}>{met?"Done":`Mark ${isToday?"done":dayLabel+" done"}`}</span>
            <span className="flex items-center justify-center rounded-full" style={{width:28,height:28,background:met?PINE:"transparent",border:met?"none":`2px solid ${BORDER2}`}}>{met&&<Check size={16} color="#fff" strokeWidth={3}/>}</span>
          </button>
        ):(
          <div className="flex items-center justify-between">
            <span className="font-medium" style={{fontSize:13.5,color:INK2}}>Amount</span>
            <div className="flex items-center gap-2.5">
              <button onClick={()=>onSetValue(g.id,WEEK_ISO[day],val-g.step)} className="flex items-center justify-center rounded-full" style={{width:38,height:38,background:SUNKEN,color:INK}}><Minus size={18}/></button>
              {editing?<input autoFocus type="number" value={temp} onChange={(e)=>setTemp(e.target.value)} onBlur={commit} onKeyDown={(e)=>{if(e.key==="Enter")commit();}} className="text-center rounded-lg outline-none" style={{width:84,height:38,border:`1.5px solid ${PINE}`,fontFamily:FD,fontSize:19,fontWeight:600,color:INK}}/>
                :<button onClick={()=>{setTemp(String(val));setEditing(true);}} className="text-center" style={{minWidth:92,padding:"3px 6px"}}><span style={{fontFamily:FD,fontSize:22,fontWeight:600,color:INK}}>{val}</span><span style={{fontSize:11.5,color:INK3}}> / {g.dailyMin} {g.unit}</span></button>}
              <button onClick={()=>onSetValue(g.id,WEEK_ISO[day],val+g.step)} className="flex items-center justify-center rounded-full" style={{width:38,height:38,background:PINE,color:"#fff"}}><Plus size={18}/></button>
            </div>
          </div>
        )}
      </div></div>

      {canManage&&(
        <div className="px-4 mt-5 flex gap-2.5">
          <button onClick={()=>onEdit(g.id)} className="flex-1 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2" style={{border:`1px solid ${BORDER2}`,background:CARD,color:INK,fontSize:13.5}}><Pencil size={15}/> Edit goal</button>
          <button onClick={()=>onDelete(g.id)} className="flex-1 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2" style={{border:`1px solid ${BORDER2}`,background:CARD,color:CHEER,fontSize:13.5}}><Trash2 size={15}/> Delete</button>
        </div>
      )}
    </div>
  );
}

/* ---------- shell ---------- */
/* ---------- account switcher (demo identity; secure sign-in lands with the backend) ---------- */
function AccountPicker({current,onPick,onClose}){
  const roster=accountRoster();
  return (
    <Sheet title="Switch account" onClose={onClose}>
      <p style={{fontSize:12.5,color:INK3,marginBottom:12,lineHeight:1.5}}>See Kohort as any cohort member — your cohorts, role, mentor view, and standing all update to match. Passwords and secure sign-in arrive with the backend.</p>
      <div className="space-y-2">
        {roster.map((a)=>{const on=a.id===current;return(
          <button key={a.id} onClick={()=>onPick(a.id)} className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left" style={{background:on?PINE_SOFT:SUNKEN,border:on?`1.5px solid ${PINE}`:"1.5px solid transparent"}}>
            <Avatar name={a.name} size={38} ring={on?PINE:undefined}/>
            <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14.5,color:on?PINE_DEEP:INK}}>{a.name}</div><div style={{fontSize:11.5,color:on?PINE:INK3}}>{a.hint||"no cohort yet"}</div></div>
            {on&&<Check size={18} style={{color:PINE}} strokeWidth={3}/>}
          </button>);})}
      </div>
    </Sheet>
  );
}

/* ---------- sign in / sign up / reset (server mode) ---------- */
function RecoveryPanel({code,onContinue,context}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{try{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{/* clipboard unavailable */}};
  return (
    <div className="px-5 pt-12 pb-28 flex flex-col items-center" style={{minHeight:"70vh"}}>
      <div className="flex items-center justify-center rounded-2xl mb-4" style={{width:56,height:56,background:PINE_SOFT}}><KeyRound size={26} style={{color:PINE_DEEP}}/></div>
      <h1 style={{fontFamily:FD,fontSize:25,fontWeight:600,color:INK,letterSpacing:-0.5,textAlign:"center"}}>Save your recovery code</h1>
      <p style={{fontSize:13,color:INK3,marginTop:6,marginBottom:20,textAlign:"center",maxWidth:330}}>{context==="reset"?"Your password was reset. Here's a fresh recovery code — ":"This is "}the only way to get back in if you forget your password. Store it somewhere safe.</p>
      <div className="w-full rounded-2xl px-4 py-4 flex items-center justify-between mb-3" style={{maxWidth:340,background:CARD,border:`1.5px dashed ${PINE}`}}>
        <span style={{fontFamily:FD,fontSize:22,fontWeight:600,letterSpacing:1,color:INK}}>{code}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 rounded-lg font-semibold px-2.5 py-1.5" style={{background:PINE_SOFT,color:PINE_DEEP,fontSize:12}}>{copied?<><Check size={13} strokeWidth={3}/> Copied</>:<><Copy size={13}/> Copy</>}</button>
      </div>
      <button onClick={onContinue} className="w-full rounded-2xl font-semibold" style={{maxWidth:340,height:52,background:PINE,color:"#fff",fontSize:15}}>I've saved it — continue</button>
    </div>
  );
}
function AuthScreen({serverUrl,onAuthed,onBackToDemo}){
  const [mode,setMode]=useState("signin");                 // signin | signup | reset
  const [username,setUsername]=useState("");
  const [name,setName]=useState("");
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");                       // recovery code (reset)
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [pending,setPending]=useState(null);               // {token,user,recoveryCode,context} -> show RecoveryPanel
  const signup=mode==="signup",reset=mode==="reset";
  const uOk=/^[a-z0-9_]{3,20}$/.test(username);
  const canGo=uOk&&password.length>=6&&(!signup||name.trim().length>0)&&(!reset||code.trim().length>0)&&!busy;
  const submit=async()=>{
    if(!canGo)return;setBusy(true);setErr("");
    try{
      if(reset){const j=await api.reset(username,code.trim(),password);setPending({...j,context:"reset"});setBusy(false);return;}
      const j=signup?await api.signup(username,name.trim(),password):await api.login(username,password);
      if(j.recoveryCode){setPending({...j,context:"signup"});setBusy(false);return;}
      await onAuthed(j.token,j.user);
    }catch(e){setErr(e.message||"Something went wrong");setBusy(false);}
  };
  if(pending)return <RecoveryPanel code={pending.recoveryCode} context={pending.context} onContinue={()=>onAuthed(pending.token,pending.user)}/>;
  return (
    <div className="px-5 pt-10 pb-28 flex flex-col items-center" style={{minHeight:"70vh"}}>
      <div className="mb-4"><Logo size={56}/></div>
      <h1 style={{fontFamily:FD,fontSize:27,fontWeight:600,color:INK,letterSpacing:-0.5}}>{reset?"Reset your password":signup?"Create your account":"Welcome back"}</h1>
      <p style={{fontSize:13,color:INK3,marginTop:4,marginBottom:22,textAlign:"center"}}>{reset?"Enter your recovery code and a new password.":signup?"Pick a handle and password to start tallying.":"Sign in to your Kohort account."}</p>
      <div className="w-full" style={{maxWidth:340}}>
        {signup&&(<>
          <label style={{fontSize:12,fontWeight:600,color:INK2}}>Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value.slice(0,40))} placeholder="Your name" className="w-full rounded-xl px-4 mt-1 mb-3 outline-none" style={{height:48,border:`1px solid ${BORDER2}`,fontSize:15,color:INK,background:"#fff"}}/>
        </>)}
        <label style={{fontSize:12,fontWeight:600,color:INK2}}>Username</label>
        <div className="flex items-center rounded-xl px-3 mt-1 mb-3" style={{height:48,border:`1px solid ${username&&!uOk?"#fecdd3":BORDER2}`,background:"#fff"}}>
          <span style={{fontFamily:FD,fontSize:16,color:INK3,marginRight:2}}>@</span>
          <input value={username} onChange={(e)=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20))} placeholder="username" className="flex-1 outline-none" style={{fontSize:15,color:INK,background:"transparent"}}/>
        </div>
        {reset&&(<>
          <label style={{fontSize:12,fontWeight:600,color:INK2}}>Recovery code</label>
          <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase().slice(0,14))} placeholder="XXXX-XXXX-XXXX" className="w-full rounded-xl px-4 mt-1 mb-3 outline-none" style={{height:48,border:`1px solid ${BORDER2}`,fontSize:15,letterSpacing:1,color:INK,background:"#fff"}}/>
        </>)}
        <label style={{fontSize:12,fontWeight:600,color:INK2}}>{reset?"New password":"Password"}</label>
        <input value={password} type="password" maxLength={64} onChange={(e)=>setPassword(e.target.value.slice(0,64))} onKeyDown={(e)=>{if(e.key==="Enter")submit();}} placeholder="••••••••" className="w-full rounded-xl px-4 mt-1 mb-1 outline-none" style={{height:48,border:`1px solid ${BORDER2}`,fontSize:15,color:INK,background:"#fff"}}/>
        <p style={{fontSize:11,color:INK3,marginBottom:14}}>{signup||reset?"At least 6 characters.":""}</p>
        {err&&<div className="rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2" style={{background:CHEER_SOFT,border:"1px solid #fecdd3"}}><AlertCircle size={15} style={{color:CHEER}}/><span style={{fontSize:12.5,color:CHEER,fontWeight:600}}>{err}</span></div>}
        <button disabled={!canGo} onClick={submit} className="w-full rounded-2xl font-semibold" style={{height:52,background:canGo?PINE:SUNKEN,color:canGo?"#fff":INK3,fontSize:15}}>{busy?"…":(reset?"Reset password":signup?"Create account":"Sign in")}</button>
        {!reset&&<button onClick={()=>{setErr("");setMode(signup?"signin":"signup");}} className="w-full mt-3 font-semibold" style={{fontSize:13.5,color:PINE_DEEP}}>{signup?"Have an account? Sign in":"New here? Create an account"}</button>}
        {!signup&&!reset&&<button onClick={()=>{setErr("");setMode("reset");}} className="w-full mt-2 font-medium" style={{fontSize:12.5,color:INK3}}>Forgot password?</button>}
        {reset&&<button onClick={()=>{setErr("");setMode("signin");}} className="w-full mt-3 font-semibold" style={{fontSize:13.5,color:PINE_DEEP}}>Back to sign in</button>}
        <div className="mt-5 rounded-xl p-3 flex items-start gap-2" style={{background:SUNKEN}}><Database size={15} style={{color:INK2,marginTop:1}}/><p style={{fontSize:11.5,color:INK2,lineHeight:1.5}}>Connected to <b style={{color:INK}}>{serverUrl||"your server"}</b>.</p></div>
        <button onClick={onBackToDemo} className="w-full mt-3 font-medium" style={{fontSize:12.5,color:INK3}}>← Back to demo (no server)</button>
      </div>
    </div>
  );
}

/* ---------- first-run onboarding ---------- */
const ONBOARD_STEPS=[
  {Icon:null,title:"Welcome to Kohort",body:"A çetele is a running tally — a simple mark for each day you show up. Kohort turns that into habits you keep with other people."},
  {Icon:Users,title:"Cohorts keep you going",body:"Join a cohort and its mentor sets shared goals. Everyone tallies their own progress and cheers each other on — reciprocity, not surveillance."},
  {Icon:Sparkles,title:"Two kinds of goals",body:"Mark a goal done for the day, or log an amount like pages or minutes. You can log today and the two days before it — older days lock so the tally stays honest."},
  {Icon:ShieldCheck,title:"You choose who sees what",body:"Every personal goal carries a visibility: keep it private, share with your mentors, your cohort, specific people, or everyone."},
  {Icon:Compass,title:"You're all set",body:"This is a live demo with seeded data — explore freely. When you're ready, connect your own account and server in Settings → Data source."},
];
function Onboarding({onDone}){
  const [i,setI]=useState(0);const step=ONBOARD_STEPS[i];const last=i===ONBOARD_STEPS.length-1;const Ic=step.Icon;
  return (
    <div className="fixed inset-0 flex justify-center" style={{zIndex:90,background:CANVAS}}>
      <div className="w-full flex flex-col" style={{maxWidth:430,padding:"0 24px"}}>
        <div className="flex justify-end pt-4"><button onClick={onDone} className="font-semibold" style={{fontSize:13.5,color:INK3}}>Skip</button></div>
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{paddingBottom:40}}>
          <div className="flex items-center justify-center rounded-3xl mb-7" style={{width:84,height:84,background:PINE}}>
            {Ic?<Ic size={38} color="#fff" strokeWidth={1.8}/>:<TallyMarks count={5} color="#a7f3d0" scale={1.25}/>}
          </div>
          <h1 style={{fontFamily:FD,fontSize:29,fontWeight:600,color:INK,letterSpacing:-0.6,lineHeight:1.1,maxWidth:320}}>{step.title}</h1>
          <p style={{fontSize:15,color:INK2,lineHeight:1.6,marginTop:14,maxWidth:330}}>{step.body}</p>
        </div>
        <div className="flex items-center justify-center gap-2 mb-5">
          {ONBOARD_STEPS.map((_,k)=><span key={k} className="rounded-full" style={{width:k===i?22:7,height:7,background:k===i?PINE:BORDER2,transition:"all .2s"}}/>)}
        </div>
        <div className="flex items-center gap-3 mb-7">
          {i>0&&<button onClick={()=>setI(i-1)} className="rounded-2xl font-semibold" style={{height:52,paddingLeft:22,paddingRight:22,background:SUNKEN,color:INK2,fontSize:15}}>Back</button>}
          <button onClick={()=>last?onDone():setI(i+1)} className="flex-1 rounded-2xl font-semibold flex items-center justify-center gap-2" style={{height:52,background:PINE,color:"#fff",fontSize:15}}>{last?"Get started":"Next"}{!last&&<ChevronRight size={18}/>}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- notifications inbox ---------- */
function NotificationsScreen({items,requests=[],onAccept,onDecline,onOpenMember,onBack,onMarkAll,onDismiss}){
  const anyUnread=items.some((n)=>!n.read);
  const empty=items.length===0&&requests.length===0;
  return (
    <div className="px-4 pt-3 pb-28">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 font-medium" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
        {anyUnread&&<button onClick={onMarkAll} className="font-semibold" style={{fontSize:13,color:PINE_DEEP}}>Mark all read</button>}
      </div>
      <h1 style={{fontFamily:FD,fontSize:26,fontWeight:600,color:INK,letterSpacing:-0.5,marginBottom:16}}>Notifications</h1>
      {requests.length>0&&(<div className="mb-5">
        <Eyebrow>Friend requests</Eyebrow>
        <div className="flex flex-col gap-2">
          {requests.map((r)=>{const pr=profileFor(r.fromId);return(
            <div key={r.fromId} className="flex items-center gap-3 rounded-2xl p-3" style={{background:CARD,border:`1px solid ${BORDER}`}}>
              <button onClick={()=>onOpenMember&&onOpenMember(r.fromId)} className="shrink-0"><Avatar name={pr.name} pfp={pr.avatar} size={40}/></button>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate" style={{fontSize:14,color:INK}}>{pr.name}</div><div className="truncate" style={{fontSize:12,color:PINE}}>@{pr.username}</div></div>
              <button onClick={()=>onAccept(r.fromId)} className="rounded-full font-semibold px-3.5" style={{height:34,background:PINE,color:"#fff",fontSize:12.5}}>Accept</button>
              <button onClick={()=>onDecline(r.fromId)} className="rounded-full font-semibold px-3" style={{height:34,background:SUNKEN,color:INK2,fontSize:12.5}}>Decline</button>
            </div>);})}
        </div>
      </div>)}
      {empty?(
        <div className="flex flex-col items-center justify-center text-center" style={{paddingTop:80}}>
          <div className="flex items-center justify-center rounded-2xl mb-4" style={{width:60,height:60,background:SUNKEN}}><Bell size={26} style={{color:INK3}}/></div>
          <p style={{fontFamily:FD,fontSize:18,color:INK,fontWeight:600}}>You're all caught up</p>
          <p style={{fontSize:13,color:INK3,marginTop:4,maxWidth:250}}>Cheers, nudges, and cohort activity will show up here.</p>
        </div>
      ):items.length>0&&(
        <div className="flex flex-col gap-1.5">
          {items.map((n)=>{const meta=NOTIF_KIND[n.kind]||NOTIF_KIND.cheer;const Ic=ICONS[meta.icon]||Bell;const who=n.actorName||profileFor(n.actorId).name;
            return (
            <div key={n.id} className="flex items-start gap-3 rounded-2xl p-3" style={{background:n.read?CARD:meta.soft,border:`1px solid ${n.read?BORDER:"transparent"}`}}>
              <div className="flex items-center justify-center rounded-full shrink-0" style={{width:38,height:38,background:"#fff",border:`1px solid ${BORDER2}`}}><Ic size={18} style={{color:meta.tint}}/></div>
              <div className="flex-1 min-w-0">
                <p style={{fontSize:13.5,color:INK,lineHeight:1.45}}>{n.text||`${who} sent you a notification`}</p>
                <p style={{fontSize:11.5,color:INK3,marginTop:2}}>{fmtAgoLabel(n.minsAgo||0)}</p>
              </div>
              {!n.read&&<span className="rounded-full shrink-0" style={{width:8,height:8,background:meta.tint,marginTop:6}}/>}
              {onDismiss&&<button onClick={()=>onDismiss(n.id)} aria-label="Dismiss" className="shrink-0 flex items-center justify-center rounded-full" style={{width:26,height:26,background:SUNKEN,color:INK3,marginTop:-1}}><X size={14}/></button>}
            </div>);})}
        </div>
      )}
    </div>
  );
}

/* ---------- streak milestone celebration ---------- */
function CelebrationScreen({title,streak,onClose}){
  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{zIndex:96,background:"rgba(28,25,23,0.55)",backdropFilter:"blur(2px)"}} onClick={onClose}>
      <div className="czpop rounded-3xl px-7 py-9 text-center relative w-full" style={{background:CARD,boxShadow:E2,maxWidth:336}} onClick={(e)=>e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute flex items-center justify-center rounded-full" style={{top:12,right:12,width:30,height:30,background:SUNKEN,color:INK2}}><X size={16}/></button>
        <div className="flex items-center justify-center rounded-full mx-auto mb-4" style={{width:84,height:84,background:STREAK_SOFT}}><Flame size={44} style={{color:STREAK}}/></div>
        <div style={{fontFamily:FD,fontSize:48,fontWeight:600,color:STREAK,letterSpacing:-1.5,lineHeight:1}}>{streak}</div>
        <div style={{fontFamily:FD,fontSize:20,fontWeight:600,color:INK,marginTop:2}}>day streak!</div>
        <p style={{fontSize:14,color:INK2,marginTop:10,lineHeight:1.5}}>You kept <b style={{color:INK}}>{title}</b> going {streak} days straight — that's the kind of consistency the whole cohort feels.</p>
        <button onClick={onClose} className="w-full rounded-2xl font-semibold mt-6" style={{height:48,background:PINE,color:"#fff",fontSize:15}}>Keep it up</button>
      </div>
    </div>
  );
}

/* ---------- end-of-week recap ---------- */
const RECAP_KEY="cetele:recap:lastweek";
const lastWeekStats=(gs)=>{
  const dates=[];for(let d=7;d>=1;d--)dates.push(addDaysIso(WEEK_START_ISO,-d)); // previous Sun–Sat
  let total=0;const perGoal=[];const perDay=dates.map(()=>0);
  gs.forEach((g)=>{let c=0;dates.forEach((iso,di)=>{if(metOnDate(g,iso)){c++;total++;perDay[di]++;}});if(c>0)perGoal.push({title:g.title,count:c});});
  perGoal.sort((a,b)=>b.count-a.count);
  const activeDays=perDay.filter((n)=>n>0).length;
  const possible=gs.length*7;
  return {dates,total,totalMarks:total,perGoal,activeDays,completion:possible>0?Math.round((total/possible)*100):0};
};
function RecapScreen({stats,onClose}){
  const top=stats.perGoal.slice(0,4);
  const line=stats.completion>=80?"Outstanding week — you showed up almost every day.":stats.completion>=50?"A solid week. The tally is adding up.":"Every mark counts. Fresh week, fresh start.";
  return (
    <div className="fixed inset-0 flex justify-center" style={{zIndex:94,background:CANVAS,overflowY:"auto"}}>
      <div className="w-full px-5 pt-4 pb-12" style={{maxWidth:430}}>
        <div className="flex justify-end"><button onClick={onClose} aria-label="Close recap" className="flex items-center justify-center rounded-full" style={{width:32,height:32,background:SUNKEN,color:INK2}}><X size={18}/></button></div>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center rounded-2xl mx-auto mb-3" style={{width:60,height:60,background:PINE}}><Trophy size={28} color="#fff"/></div>
          <h1 style={{fontFamily:FD,fontSize:27,fontWeight:600,color:INK,letterSpacing:-0.5}}>Last week's recap</h1>
          <p style={{fontSize:13.5,color:INK3,marginTop:4}}>A look back at the week you just closed out.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[["Total marks",stats.total],["Active days",`${stats.activeDays}/7`],["Completion",`${stats.completion}%`]].map(([l,v],i)=>(
            <div key={i} className="rounded-2xl p-3 text-center" style={{background:CARD,border:`1px solid ${BORDER}`}}><div style={{fontFamily:FD,fontSize:24,fontWeight:600,color:PINE}}>{v}</div><div style={{fontSize:11,color:INK3,marginTop:2}}>{l}</div></div>
          ))}
        </div>
        {top.length>0&&(<>
          <Eyebrow>By goal</Eyebrow>
          <div className="space-y-2 mb-5">{top.map((g,i)=>(<div key={i} className="flex items-center justify-between rounded-2xl p-3 gap-3" style={{background:CARD,border:`1px solid ${BORDER}`}}><span className="min-w-0" style={{fontSize:13.5,color:INK2,overflowWrap:"anywhere"}}>{g.title}</span><span className="shrink-0"><TallyMarks count={Math.min(7,g.count)} color={PINE} scale={0.85}/></span></div>))}</div>
        </>)}
        <div className="rounded-2xl p-4 text-center mb-5" style={{background:MINT,border:`1px solid ${MINT_BORDER}`}}><p style={{fontSize:14,color:PINE_DEEP,fontWeight:600}}>{line}</p></div>
        <button onClick={onClose} className="w-full rounded-2xl font-semibold" style={{height:50,background:PINE,color:"#fff",fontSize:15}}>Start this week</button>
      </div>
    </div>
  );
}

/* ---------- mentor drill-down: demo progress synthesis + shared pieces ---------- */
const _hash=(s)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const seriesStreak=(s)=>{let n=0;for(let i=s.length-1;i>=0;i--){if(s[i].met)n++;else break;}return n;};
function demoSeries(member,g,days=30){
  const out=[];const base=Math.min(0.95,Math.max(0.1,(member.weekPct||50)/100));let seed=_hash(member.id+":"+g.id);
  for(let d=days-1;d>=0;d--){
    seed=(Math.imul(seed,1103515245)+12345)>>>0;const r=(seed%1000)/1000;
    const met=r<(base*0.85+0.08)?1:0;
    let value;
    if(g.type==="binary")value=met?1:0;
    else value=met?((g.dailyMin||1)+(seed%4)*(g.step||1)):((seed%2)?Math.max(0,(g.dailyMin||1)-(g.step||1)):0);
    out.push({iso:addDaysIso(TODAY_ISO,-d),value,met});
  }
  for(let d=0;d<Math.min(member.streak||0,days);d++){const idx=days-1-d;if(out[idx]){out[idx].met=1;if(g.type==="binary")out[idx].value=1;else if(out[idx].value<(g.dailyMin||1))out[idx].value=(g.dailyMin||1)+(g.step||1);}}
  return out;
}
function demoProgress(member,g){
  const series=demoSeries(member,g);const completion=Math.round(series.filter((x)=>x.met).length/series.length*100);
  const vals=series.map((x)=>x.value).filter((v)=>v>0);const avgValue=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:0;
  const weekDone=series.slice(-7).filter((x)=>x.met).length;
  return {streak:seriesStreak(series),weekDone,weekPct:Math.round(weekDone/(g.target||7)*100),completion,avgValue,series};
}
function MiniTrend({series,type,dailyMin,height=48}){
  if(!series||!series.length)return <div style={{height}}/>;
  if(type==="binary"){
    return <div className="flex items-end gap-px" style={{height}}>{series.map((s,i)=><div key={i} style={{flex:1,height:s.met?height:5,minHeight:5,borderRadius:1.5,background:s.met?PINE:BORDER2,alignSelf:"flex-end"}}/>)}</div>;
  }
  const data=series.map((s,i)=>({i,v:s.value}));const max=Math.max(dailyMin||1,...series.map((s)=>s.value),1);
  return <div style={{height}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:3,right:0,left:0,bottom:0}}>
    <defs><linearGradient id="mtg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PINE} stopOpacity={0.35}/><stop offset="100%" stopColor={PINE} stopOpacity={0}/></linearGradient></defs>
    {dailyMin>0&&<ReferenceLine y={dailyMin} stroke={STREAK} strokeDasharray="3 3" strokeOpacity={0.55}/>}
    <YAxis hide domain={[0,max]}/><Area type="monotone" dataKey="v" stroke={PINE} strokeWidth={2} fill="url(#mtg)" isAnimationActive={false}/>
  </AreaChart></ResponsiveContainer></div>;
}
function DrillLoading({onBack,what}){
  return <div className="px-4 pt-3 pb-28"><button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
    <div className="flex flex-col items-center justify-center" style={{paddingTop:110}}><div className="czspin" style={{width:34,height:34,border:`3px solid ${BORDER2}`,borderTopColor:PINE,borderRadius:"50%"}}/><p style={{fontSize:13,color:INK3,marginTop:14}}>Loading {what}…</p></div></div>;
}
function DrillStat({label,value,tone}){return <div className="flex-1 rounded-2xl p-3 text-center" style={{background:CARD,border:`1px solid ${BORDER}`}}><div style={{fontFamily:FD,fontSize:23,fontWeight:600,color:tone||PINE,letterSpacing:-0.5}}>{value}</div><div style={{fontSize:10.5,color:INK3,marginTop:2,fontWeight:600}}>{label}</div></div>;}

/* interactive last-7-days chart with hover tooltip (mentee page) */
function Trend7({series,type,unit,dailyMin}){
  const last7=(series||[]).slice(-7);
  const data=last7.map((s)=>{const dt=new Date(s.iso+"T00:00:00");return {label:`${dt.getMonth()+1}/${dt.getDate()}`,v:type==="numeric"?s.value:(s.met?1:0),value:s.value,met:s.met};});
  if(type==="binary"){
    return <div style={{height:118}}><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{top:6,right:4,left:-32,bottom:0}}>
        <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="label" tick={{fontSize:10,fill:INK3}} axisLine={false} tickLine={false}/><YAxis hide domain={[0,1]}/>
        <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} formatter={(v)=>[v?"Done":"Missed",""]} separator=""/>
        <Bar dataKey="v" radius={[5,5,0,0]} isAnimationActive={false}>{data.map((b,i)=><Cell key={i} fill={b.met?PINE:BORDER2}/>)}</Bar>
      </BarChart></ResponsiveContainer></div>;
  }
  const max=Math.max(dailyMin||1,...data.map((d)=>d.value),1);
  return <div style={{height:118}}><ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{top:6,right:4,left:-32,bottom:0}}>
      <defs><linearGradient id="t7g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PINE} stopOpacity={0.3}/><stop offset="100%" stopColor={PINE} stopOpacity={0.02}/></linearGradient></defs>
      <CartesianGrid vertical={false} stroke={SUNKEN}/><XAxis dataKey="label" tick={{fontSize:10,fill:INK3}} axisLine={false} tickLine={false}/><YAxis hide domain={[0,max]}/>
      {dailyMin>0&&<ReferenceLine y={dailyMin} stroke={STREAK} strokeDasharray="3 3" strokeOpacity={0.6}/>}
      <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} formatter={(v)=>[`${v} ${unit||""}`.trim(),""]} separator=""/>
      <Area type="monotone" dataKey="v" stroke={PINE} strokeWidth={2.5} fill="url(#t7g)" isAnimationActive={false}/>
    </AreaChart></ResponsiveContainer></div>;
}

/* history stats + demo length */
const bestRun=(series)=>{let best=0,cur=0;for(const s of series){if(s.met){cur++;if(cur>best)best=cur;}else cur=0;}return best;};
function histStats(series,type){
  const n=series.length;const met=series.filter((s)=>s.met).length;
  const vals=series.map((s)=>s.value).filter((v)=>v>0);
  const avgValue=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:0;
  const half=Math.floor(n/2);const early=series.slice(0,half),late=series.slice(half);
  let trend=0,trendUnit="pts";
  if(type==="numeric"){const ev=early.map((s)=>s.value).filter((v)=>v>0),lv=late.map((s)=>s.value).filter((v)=>v>0);const ea=ev.length?ev.reduce((a,b)=>a+b,0)/ev.length:0,la=lv.length?lv.reduce((a,b)=>a+b,0)/lv.length:0;trend=ea?Math.round((la-ea)/ea*100):(la>0?100:0);trendUnit="%";}
  else{const ec=early.length?early.filter((s)=>s.met).length/early.length*100:0,lc=late.length?late.filter((s)=>s.met).length/late.length*100:0;trend=Math.round(lc-ec);trendUnit="pts";}
  return {days:n,metDays:met,activeDays:vals.length,completion:n?Math.round(met/n*100):0,currentStreak:seriesStreak(series),bestStreak:bestRun(series),avgValue,totalValue:series.reduce((a,s)=>a+s.value,0),trend,trendUnit};
}
const demoMemberSince=(member)=>30+(_hash((member&&member.id)||"x")%336); // 30..365 days of synthetic history
// Demo-only: a stable pool of personal goals other members "share", so the friend profile and mentee view have data offline.
const DEMO_PERSONAL=[
  {id:"dp_deepwork",title:"Deep work",icon:"Brain",type:"numeric",unit:"min",dailyMin:90,step:30,target:5},
  {id:"dp_workout",title:"Workout",icon:"Dumbbell",type:"binary",unit:"",dailyMin:0,step:1,target:4},
  {id:"dp_meditate",title:"Meditation",icon:"Moon",type:"binary",unit:"",dailyMin:0,step:1,target:6},
  {id:"dp_journal",title:"Journaling",icon:"Star",type:"binary",unit:"",dailyMin:0,step:1,target:5},
  {id:"dp_water",title:"Hydration",icon:"Leaf",type:"numeric",unit:"glasses",dailyMin:8,step:1,target:7},
];
const demoPersonalById=(gid)=>DEMO_PERSONAL.find((g)=>g.id===gid);
const demoSharedFor=(memberId)=>{
  const member=memberById(memberId)||{id:memberId,weekPct:55,streak:0};
  const h=_hash(memberId);const n=1+(h%3);const start=h%DEMO_PERSONAL.length;const out=[];
  for(let i=0;i<n;i++){const t=DEMO_PERSONAL[(start+i)%DEMO_PERSONAL.length];out.push({...t,category:"personal",...demoProgress(member,t)});}
  return out;
};
// Normalize a goal (server `week`/`values` shape OR a synthesized `series`) into today + last-7 progress.
function weekViewOf(g){
  if(g.series&&g.series.length){const l=g.series.slice(-7);return {week7:l.map((s)=>s.met),vals7:l.map((s)=>s.value),todayMet:l[l.length-1].met,todayValue:l[l.length-1].value,weekMet:l.filter((s)=>s.met).length};}
  const week=g.week||[];const vals=g.values||[];return {week7:week,vals7:vals,todayMet:week[TODAY_INDEX]||0,todayValue:vals[TODAY_INDEX]||0,weekMet:week.filter(Boolean).length};
}

/* Goal History — one mentee's long-range history on one goal (scrollable) */
function MentorGoalHistoryScreen({data,loading,onBack}){
  if(loading||!data)return <DrillLoading onBack={onBack} what="history"/>;
  const {goal,member,series}=data;const Ic=iconOf(goal.icon);const numeric=goal.type==="numeric";
  const st=histStats(series,goal.type);
  const chartData=numeric
    ?series.map((s)=>{const dt=new Date(s.iso+"T00:00:00");return {label:`${dt.getMonth()+1}/${dt.getDate()}`,v:s.value};})
    :series.map((s,i)=>{const w=series.slice(Math.max(0,i-6),i+1);const dt=new Date(s.iso+"T00:00:00");return {label:`${dt.getMonth()+1}/${dt.getDate()}`,v:Math.round(w.filter((x)=>x.met).length/w.length*100)};});
  const wide=series.length>28;const innerW=wide?`${series.length*14}px`:"100%";
  const max=numeric?Math.max(goal.dailyMin||1,...series.map((s)=>s.value),1):100;
  const firstDt=series.length?new Date(series[0].iso+"T00:00:00"):null;
  const since=firstDt?firstDt.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"";
  const up=st.trend>=0;
  return (
    <div className="px-4 pt-3 pb-28">
      <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back to {member.name.split(" ")[0]}</button>
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center justify-center rounded-2xl shrink-0" style={{width:48,height:48,background:PINE_SOFT}}><Ic size={24} style={{color:PINE_DEEP}}/></div>
        <div className="min-w-0"><h1 style={{fontFamily:FD,fontSize:22,fontWeight:600,color:INK,letterSpacing:-0.5,lineHeight:1.1,overflowWrap:"anywhere"}}>{goal.title}</h1><p style={{fontSize:12.5,color:INK3,marginTop:2}}>{member.name} · {numeric?`target ${goal.dailyMin} ${goal.unit}/day`:"done / not done"}</p></div>
      </div>
      <p style={{fontSize:11.5,color:INK3,marginBottom:14}}>{st.days} days of history · since {since}</p>
      <div className="rounded-2xl p-4 mb-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between mb-1"><p className="font-semibold" style={{fontFamily:FD,fontSize:15,fontWeight:600,color:INK}}>{numeric?`Daily ${goal.unit||"amount"}`:"7-day completion"}</p><span className="inline-flex items-center gap-1 rounded-full font-bold" style={{fontSize:11.5,padding:"2px 9px",color:up?PINE_DEEP:CHEER,background:up?MINT:CHEER_SOFT}}>{up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}{up?"+":""}{st.trend}{st.trendUnit}</span></div>
        <p style={{fontSize:11.5,color:INK3,marginBottom:12}}>{wide?"Scroll sideways to explore the full range. ":""}Hover any point for the day's detail.</p>
        <div style={{overflowX:wide?"auto":"hidden",overflowY:"hidden"}}><div style={{height:188,minWidth:innerW}}><ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top:6,right:6,left:-26,bottom:0}}>
            <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={PINE} stopOpacity={0.28}/><stop offset="100%" stopColor={PINE} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid vertical={false} stroke={SUNKEN}/>
            <XAxis dataKey="label" tick={{fontSize:9,fill:INK3}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(series.length/8))} minTickGap={14}/>
            <YAxis tick={{fontSize:10,fill:INK3}} axisLine={false} tickLine={false} domain={[0,max]} width={34}/>
            {numeric&&goal.dailyMin>0&&<ReferenceLine y={goal.dailyMin} stroke={STREAK} strokeDasharray="3 3" strokeOpacity={0.55}/>}
            <Tooltip contentStyle={{borderRadius:12,border:`1px solid ${BORDER2}`,fontSize:12}} formatter={(v)=>[numeric?`${v} ${goal.unit||""}`.trim():`${v}%`,numeric?"logged":"completion"]}/>
            <Area type="monotone" dataKey="v" stroke={PINE} strokeWidth={2.4} fill="url(#hg)" isAnimationActive={false}/>
          </AreaChart></ResponsiveContainer></div></div>
      </div>
      <Eyebrow>Statistics</Eyebrow>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <StatTile label="Completion" value={`${st.completion}%`} sub={`${st.metDays} of ${st.days} days met`}/>
        <StatTile label="Current streak" value={`${st.currentStreak}d`} sub="consecutive days" tone={STREAK}/>
        <StatTile label="Best streak" value={`${st.bestStreak}d`} sub="longest run" tone={STREAK}/>
        <StatTile label="Active days" value={st.activeDays} sub="days with a log"/>
        {numeric?<StatTile label={`Avg ${goal.unit||"value"}`} value={st.avgValue} sub="on logged days"/>:<StatTile label="Days met" value={st.metDays} sub={`of ${st.days}`}/>}
        {numeric?<StatTile label={`Total ${goal.unit||""}`.trim()} value={st.totalValue} sub="all-time logged"/>:<StatTile label="Recent trend" value={`${up?"+":""}${st.trend}${st.trendUnit}`} sub="vs earlier half" tone={up?PINE:CHEER}/>}
      </div>
      <div className="rounded-2xl p-4" style={{background:MINT,border:`1px solid ${MINT_BORDER}`}}>
        <p style={{fontSize:13.5,color:PINE_DEEP,fontWeight:600,lineHeight:1.5}}>{st.trend>=10?`${member.name.split(" ")[0]} is trending up — recent ${numeric?"amounts are":"consistency is"} clearly above earlier in the window.`:st.trend<=-10?`${member.name.split(" ")[0]} has slipped lately — a nudge or check-in might help.`:`${member.name.split(" ")[0]} is holding steady on this goal.`}</p>
      </div>
    </div>
  );
}
function StatTile({label,value,sub,tone}){return <div className="rounded-2xl p-3.5" style={{background:CARD,border:`1px solid ${BORDER}`}}><div style={{fontSize:11,color:INK3,fontWeight:600,marginBottom:3}}>{label}</div><div style={{fontFamily:FD,fontSize:25,fontWeight:600,color:tone||INK,letterSpacing:-0.5,lineHeight:1}}>{value}</div><div style={{fontSize:11,color:INK3,marginTop:3}}>{sub}</div></div>;}

/* Mentee View — one mentee's cohort + shared personal goals (last 7 days, interactive) */
function MentorMenteeScreen({data,loading,cohortName,onBack,onOpenGoal}){
  if(loading||!data)return <DrillLoading onBack={onBack} what="mentee progress"/>;
  const {member,goals}=data;const personalGoals=data.personalGoals||[];
  const all=[...goals,...personalGoals];
  const c7=(g)=>{const l=(g.series||[]).slice(-7);return l.length?Math.round(l.filter((x)=>x.met).length/l.length*100):0;};
  const avg=all.length?Math.round(all.reduce((a,g)=>a+c7(g),0)/all.length):0;
  const best=all.reduce((m,g)=>Math.max(m,g.streak||0),0);
  const card=(g)=>{const Ic=iconOf(g.icon);const comp=c7(g);return(
    <button key={g.id} onClick={()=>onOpenGoal(g.id)} className="w-full text-left rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
      <div className="flex items-center gap-2 mb-3"><div className="flex items-center justify-center rounded-lg shrink-0" style={{width:30,height:30,background:SUNKEN}}><Ic size={16} style={{color:INK2}}/></div><span className="font-semibold flex-1 min-w-0" style={{fontSize:14.5,color:INK,overflowWrap:"anywhere"}}>{g.title}</span><span style={{fontFamily:FD,fontSize:17,fontWeight:600,color:comp>=70?PINE:comp>=40?STREAK:INK3}}>{comp}%</span><ChevronRight size={17} style={{color:INK3}}/></div>
      <div className="flex items-center gap-4 mb-1">
        <span className="inline-flex items-center gap-1" style={{fontSize:12.5,color:STREAK,fontWeight:600}}><Flame size={13}/> {g.streak}d</span>
        <span style={{fontSize:12.5,color:INK2,fontWeight:600}}>This week {g.weekDone}/{g.target}</span>
        {g.type==="numeric"&&<span className="ml-auto" style={{fontSize:11.5,color:INK3}}>target {g.dailyMin} {g.unit}</span>}
      </div>
      <Trend7 series={g.series} type={g.type} unit={g.unit} dailyMin={g.dailyMin}/>
    </button>);};
  return (
    <div className="px-4 pt-3 pb-28">
      <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
      <div className="flex items-center gap-3 mb-5">
        <Avatar name={member.name} pfp={member.avatar} size={56} ring={PINE}/>
        <div className="min-w-0"><h1 style={{fontFamily:FD,fontSize:24,fontWeight:600,color:INK,letterSpacing:-0.5,lineHeight:1.1}}>{member.name}</h1><p style={{fontSize:13,color:INK3,marginTop:2}}>Mentee in {cohortName} · {all.length} {all.length===1?"goal":"goals"}</p></div>
      </div>
      <div className="flex gap-2 mb-6"><DrillStat label="7-DAY AVG" value={`${avg}%`}/><DrillStat label="GOALS" value={all.length}/><DrillStat label="BEST STREAK" value={best} tone={STREAK}/></div>
      <Eyebrow>Goals & progress · last 7 days</Eyebrow>
      <p style={{fontSize:12,color:INK3,marginTop:-4,marginBottom:10}}>Hover the chart for each day. Tap a goal for its full history.</p>
      {all.length===0?(
        <div className="rounded-2xl p-7 text-center" style={{border:`2px dashed ${BORDER2}`}}><Target size={22} style={{color:INK3}} className="mx-auto mb-2"/><p className="font-semibold" style={{fontSize:14,color:INK}}>Nothing to show yet</p><p style={{fontSize:12.5,color:INK3,marginTop:3}}>No cohort goals, and {member.name.split(" ")[0]} hasn't shared any personal goals with you.</p></div>
      ):(<>
        <div className="flex items-center gap-1.5 mb-2.5" style={{color:INK2}}><Users size={13}/><span className="uppercase font-bold" style={{fontSize:11,letterSpacing:0.5}}>Cohort goals</span><span style={{fontSize:11,color:INK3}}>· {goals.length}</span></div>
        {goals.length===0?<p className="mb-4" style={{fontSize:12.5,color:INK3}}>No cohort goals set yet.</p>:<div className="space-y-3 mb-6">{goals.map(card)}</div>}
        <div className="flex items-center gap-1.5 mb-2.5" style={{color:INK2}}><Lock size={13}/><span className="uppercase font-bold" style={{fontSize:11,letterSpacing:0.5}}>Personal goals shared with you</span><span style={{fontSize:11,color:INK3}}>· {personalGoals.length}</span></div>
        {personalGoals.length===0?<p style={{fontSize:12.5,color:INK3}}>{member.name.split(" ")[0]} hasn't shared any personal goals with you.</p>:<div className="space-y-3">{personalGoals.map(card)}</div>}
      </>)}
    </div>
  );
}

/* Goal View — every member's progress toward one cohort goal */
function MentorGoalScreen({data,loading,cohortName,onBack,onOpenMentee}){
  if(loading||!data)return <DrillLoading onBack={onBack} what="goal progress"/>;
  const {goal,members}=data;const Ic=iconOf(goal.icon);
  const ranked=[...members].sort((a,b)=>(b.completion||0)-(a.completion||0));
  const avg=members.length?Math.round(members.reduce((a,m)=>a+(m.completion||0),0)/members.length):0;
  const top=ranked[0];
  return (
    <div className="px-4 pt-3 pb-28">
      <button onClick={onBack} className="inline-flex items-center gap-1 font-medium mb-3" style={{color:INK2,fontSize:14}}><ChevronLeft size={18}/> Back</button>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center rounded-2xl shrink-0" style={{width:52,height:52,background:PINE_SOFT}}><Ic size={26} style={{color:PINE_DEEP}}/></div>
        <div className="min-w-0"><h1 style={{fontFamily:FD,fontSize:23,fontWeight:600,color:INK,letterSpacing:-0.5,lineHeight:1.1,overflowWrap:"anywhere"}}>{goal.title}</h1><p style={{fontSize:13,color:INK3,marginTop:2}}>{cohortName} · {goal.type==="numeric"?`${goal.dailyMin} ${goal.unit}/day target`:"done / not done"}</p></div>
      </div>
      <div className="flex gap-2 mb-6"><DrillStat label="COHORT AVG" value={`${avg}%`}/><DrillStat label="MEMBERS" value={members.length}/><DrillStat label="TOP" value={top?`${top.completion}%`:"—"} tone={STREAK}/></div>
      <Eyebrow>Per member · last 30 days</Eyebrow>
      <p style={{fontSize:12,color:INK3,marginTop:-4,marginBottom:10}}>Ranked by completion. {goal.type==="numeric"?"Shows the actual logged amounts, not just done/not-done.":"Each bar is a day met."}</p>
      <div className="space-y-3">{ranked.map((m)=>(
        <button key={m.id} onClick={()=>onOpenMentee(m.id)} className="w-full text-left rounded-2xl p-3.5" style={{background:CARD,border:`1px solid ${BORDER}`,boxShadow:"0 1px 2px rgba(28,25,23,.04)"}}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar name={m.name} pfp={m.avatar} size={34} ring={m.role==="mentor"?STREAK:undefined}/>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="font-semibold truncate" style={{fontSize:14,color:INK}}>{m.name}</span>{m.role==="mentor"&&<span className="rounded-full font-semibold shrink-0" style={{fontSize:9.5,color:STREAK,background:STREAK_SOFT,padding:"1px 6px"}}>mentor</span>}</div>
              <div className="flex items-center gap-3" style={{fontSize:11.5,color:INK3,marginTop:1}}><span className="inline-flex items-center gap-0.5" style={{color:STREAK,fontWeight:600}}><Flame size={11}/> {m.streak}d</span>{goal.type==="numeric"&&m.avgValue>0&&<span>avg {m.avgValue} {goal.unit}</span>}<span>wk {m.weekDone}/{goal.target}</span></div>
            </div>
            <span className="shrink-0" style={{fontFamily:FD,fontSize:18,fontWeight:600,color:m.completion>=70?PINE:m.completion>=40?STREAK:INK3}}>{m.completion}%</span>
          </div>
          <MiniTrend series={m.series} type={goal.type} dailyMin={goal.dailyMin} height={38}/>
        </button>))}</div>
    </div>
  );
}

/* first-load skeleton (server slow) */
function SkeletonScreen(){
  return (
    <div className="px-4 pt-4 pb-28">
      <div className="czshim" style={{width:150,height:26,borderRadius:8,background:SUNKEN,marginBottom:18}}/>
      <div className="grid grid-cols-3 gap-2.5 mb-5">{[0,1,2].map((i)=><div key={i} className="czshim" style={{height:70,borderRadius:16,background:SUNKEN}}/>)}</div>
      <div className="czshim" style={{width:120,height:13,borderRadius:6,background:SUNKEN,marginBottom:12}}/>
      <div className="space-y-3">{[0,1,2,3].map((i)=>(
        <div key={i} className="rounded-2xl p-4" style={{background:CARD,border:`1px solid ${BORDER}`}}>
          <div className="flex items-center gap-3 mb-3"><div className="czshim" style={{width:42,height:42,borderRadius:12,background:SUNKEN}}/><div className="flex-1"><div className="czshim" style={{width:"55%",height:13,borderRadius:6,background:SUNKEN,marginBottom:8}}/><div className="czshim" style={{width:"32%",height:11,borderRadius:6,background:SUNKEN}}/></div></div>
          <div className="czshim" style={{height:10,borderRadius:6,background:SUNKEN}}/>
        </div>))}</div>
    </div>
  );
}

export default function App(){
  const [subscribed,setSubscribed]=useState(DEFAULT_SUBS);
  const mentoredSubscribed=mentorCohorts().filter((id)=>subscribed.includes(id));
  const [tab,setTab]=useState(mentoredSubscribed.length?"mentor":"cetele");
  const [openMember,setOpenMember]=useState(null);
  const [mentorView,setMentorView]=useState(null);
  const [memberGoals,setMemberGoals]=useState({});
  const [memberWeek,setMemberWeek]=useState({});
  const [memberHist,setMemberHist]=useState({});
  const [cohortExpanded,setCohortExpanded]=useState({});
  const toggleCohortExpand=(cid)=>setCohortExpanded((m)=>{const next={...m,[cid]:!m[cid]};Store.set(COHORT_EXPAND_KEY,next);return next;});
  const [feed,setFeed]=useState(SEED_FEED);
  const [goals,setGoals]=useState(SEED_GOALS_PD);
  const [wall,setWall]=useState(WALL_SEED);
  const [selectedIso,setSelectedIso]=useState(TODAY_ISO);
  const [sheet,setSheet]=useState(null);
  const [nudged,setNudged]=useState({});
  const [settings,setSettings]=useState(DEFAULT_SETTINGS);
  const [showSettings,setShowSettings]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [confirmArchive,setConfirmArchive]=useState(null);
  const [confirmLeave,setConfirmLeave]=useState(null);
  const [detailGoalId,setDetailGoalId]=useState(null);
  const [cohortRev,setCohortRev]=useState(0);
  const [profile,setProfile]=useState(DEFAULT_PROFILE);
  const [meId,setMeId]=useState(DEFAULT_ME);          // mirrors module ME; forces re-render on switch
  const [showAccounts,setShowAccounts]=useState(false);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const unreadNotifs=notifications.filter((n)=>!n.read&&(n.minsAgo||0)<7*1440).length;
  const [editProfile,setEditProfile]=useState(false);
  const [friends,setFriends]=useState(DB_FRIENDS_ME);
  const [friendReqs,setFriendReqs]=useState(SEED_FRIEND_REQS);
  const inboxCount=unreadNotifs+friendReqs.incoming.length;
  const [friendFeed,setFriendFeed]=useState(FRIEND_FEED);
  const [feedMore,setFeedMore]=useState({cohort:false,friend:false});
  const [feedLoadingMore,setFeedLoadingMore]=useState(false);
  const [serverStatus,setServerStatus]=useState(null);
  const [dataState,setDataState]=useState("ready"); // ready | loading | error
  const [waking,setWaking]=useState(false);         // backend cold-start (free tier can sleep)
  const [refreshing,setRefreshing]=useState(false); // silent background live-refresh in flight
  const [toast,setToast]=useState(null);
  const [recoveryView,setRecoveryView]=useState(null);
  const deleteAccount=async()=>{
    if(API_BASE){try{await api.deleteAccount();}catch(e){setToast(e.message||"Couldn't delete account.");return;}await signOut();setToast("Your account was deleted.");}
    else{resetDemo();setToast("Demo data cleared.");}
  };
  const showRecovery=async()=>{
    if(!API_BASE){setToast("Recovery codes apply to server accounts.");return;}
    try{const code=await api.recoveryCode();setRecoveryView(code);}catch(e){setToast(e.message||"Couldn't load a code.");}
  };
  const enablePush=async()=>{
    if(!API_BASE){setToast("Push needs a connected server.");return;}
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||typeof Notification==="undefined"){setToast("This device doesn't support push.");return;}
    try{
      const perm=await Notification.requestPermission();
      if(perm!=="granted"){setToast("Notification permission was denied.");return;}
      const reg=await navigator.serviceWorker.register("/sw.js");
      const v=await api.pushVapid();
      if(!v||!v.key||!v.enabled){setToast("Push isn't enabled on the server.");return;}
      const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlB64ToBytes(v.key)});
      await api.pushSubscribe(sub.toJSON?sub.toJSON():sub);
      setSettings((s)=>({...s,push:true}));setToast("Push notifications on.");
    }catch{setToast("Couldn't enable push on this device.");}
  };
  const disablePush=async()=>{
    try{const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();
      if(sub){if(API_BASE)apiFetch(`${API_BASE}/api/push/unsubscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub.toJSON?sub.toJSON():sub})}).catch(()=>{});await sub.unsubscribe().catch(()=>{});}
    }catch{/* nothing subscribed */}
    setSettings((s)=>({...s,push:false}));setToast("Push notifications off.");
  };
  const togglePush=()=>{(settings.push?disablePush:enablePush)();};
  const [authed,setAuthed]=useState(false);         // server mode: do we have a valid session
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),3400);return ()=>clearTimeout(t);},[toast]);

  const hydrated=useRef(false);
  const refreshRef=useRef(null);
  const profileFromUser=(u)=>({name:u.name,username:u.username,avatar:u.avatar,bio:u.bio||"",nameChangesLeft:u.nameChangesLeft==null?2:u.nameChangesLeft});
  const hydrateFromServer=async()=>{
    setDataState("loading");
    const wakeT=setTimeout(()=>setWaking(true),3500); // if health is slow, the server is likely waking up
    const health=await api.health();
    clearTimeout(wakeT);setWaking(false);
    setServerStatus(health);
    if(!health.ok){setDataState("error");return;}
    try{
      const meUser=await api.me();if(meUser)setProfile(profileFromUser(meUser));
      const cohorts=await api.loadCohorts();
      if(cohorts){cohortStore.apply(cohorts);setSubscribed(Object.keys(cohorts).filter((id)=>cohorts[id].members.some((m)=>m.id===ME)));}
      const gs=await api.loadGoals(seedGoalsFor(ME));if(gs)setGoals(gs);
      const cf=await api.loadFeed("cohort",null,25);if(cf){setFeed(cf);setFeedMore((mm)=>({...mm,cohort:cf.length>=25}));}
      const ff=await api.loadFeed("friend",null,25);if(ff){setFriendFeed(ff);setFeedMore((mm)=>({...mm,friend:ff.length>=25}));}
      const fr=await api.loadFriends();if(fr)setFriends(fr);
      const frq=await api.loadFriendRequests();setFriendReqs(frq||{incoming:[],outgoing:[]});
      const ns=await api.loadNotifications();setNotifications(ns||[]);
      hydrated.current=true;setCohortRev((v)=>v+1);setDataState("ready");
    }catch{setDataState("error");}
  };
  // Silent background refresh — keeps cohorts/feed/requests/notifications fresh without the loading UI.
  const refreshLive=async()=>{
    if(!API_BASE||!authed||(typeof document!=="undefined"&&document.hidden))return;
    setRefreshing(true);
    try{
      const cohorts=await api.loadCohorts();
      if(cohorts){cohortStore.apply(cohorts);setSubscribed(Object.keys(cohorts).filter((id)=>cohorts[id].members.some((m)=>m.id===ME)));}
      const cf=await api.loadFeed("cohort",null,25);if(cf){setFeed(cf);setFeedMore((mm)=>({...mm,cohort:cf.length>=25}));}
      const ff=await api.loadFeed("friend",null,25);if(ff){setFriendFeed(ff);setFeedMore((mm)=>({...mm,friend:ff.length>=25}));}
      const frq=await api.loadFriendRequests();if(frq)setFriendReqs(frq);
      const fr=await api.loadFriends();if(fr)setFriends(fr);
      const ns=await api.loadNotifications();if(ns)setNotifications(ns);
      setCohortRev((v)=>v+1);
    }catch{/* stay on last-good data */}
    setRefreshing(false);
  };
  refreshRef.current=refreshLive;
  const hydrateLocal=async()=>{
    cohortStore.restoreSeed();
    const {cohorts}=await cohortStore.load();
    if(cohorts&&Object.keys(cohorts).length)cohortStore.apply(cohorts);
    setSubscribed(subscribedFor(ME));
    const gs=await api.loadGoals(seedGoalsFor(ME));if(gs)setGoals(gs);
    const p=await api.loadProfile(profileFor(ME));setProfile(p);
    setFeed(SEED_FEED);setFriendFeed(FRIEND_FEED);setNotifications(SEED_NOTIFS);
    const ids=await friendApi.load();if(ids)setFriends(ids);
    hydrated.current=true;setCohortRev((v)=>v+1);setDataState("ready");
  };
  const switchAccount=async(id)=>{
    if(id===ME){setShowAccounts(false);return;}
    setMe(id);setMeId(id);Store.set(ACCOUNT_KEY,id);
    setShowAccounts(false);setShowSettings(false);setEditProfile(false);setOpenMember(null);setDetailGoalId(null);setSheet(null);setSelectedIso(TODAY_ISO);
    if(API_BASE){await hydrateFromServer();}
    else{setSubscribed(subscribedFor(id));const gs=await api.loadGoals(seedGoalsFor(id));setGoals(gs);const p=await api.loadProfile(profileFor(id));setProfile(p);setNotifications(SEED_NOTIFS);}
    setShowNotifs(false);
    setCohortRev((v)=>v+1);
    setTab(mentorCohorts().length?"mentor":"cetele");
  };
  // server session lifecycle
  const enterServer=async()=>{const u=await api.me();if(u){setMe(u.id);setMeId(u.id);Store.set(ACCOUNT_KEY,u.id);setAuthed(true);await hydrateFromServer();}else{setAuthed(false);}};
  const onAuthed=async(token,user)=>{setAuthToken(token);Store.set(AUTH_KEY,token);setMe(user.id);setMeId(user.id);Store.set(ACCOUNT_KEY,user.id);setProfile(profileFromUser(user));setAuthed(true);await hydrateFromServer();};
  const signOut=async()=>{
    await api.logout();
    setAuthToken(null);Store.set(AUTH_KEY,null);setAuthed(false);
    hydrated.current=false;
    // tear down every per-account view + cache so nothing carries into the next sign-in
    setShowSettings(false);setEditProfile(false);setShowNotifs(false);setShowSearch(false);setShowAccounts(false);
    setOpenMember(null);setDetailGoalId(null);setMentorView(null);setSheet(null);
    cohortStore.clear();api.clear();
    for(const k in USER_CACHE)delete USER_CACHE[k];
    setSubscribed([]);setGoals([]);setFeed([]);setFriendFeed([]);setFriends([]);
    setNotifications([]);setFriendReqs({incoming:[],outgoing:[]});setWall({});
    setMemberGoals({});setMemberWeek({});setMemberHist({});setNudged({});
    setCohortRev((v)=>v+1);
  };
  const openNotifs=()=>{setShowSettings(false);setEditProfile(false);setShowSearch(false);setOpenMember(null);setDetailGoalId(null);setShowNotifs(true);};
  const markAllNotifs=()=>{setNotifications((ns)=>ns.map((n)=>({...n,read:true})));api.markAllNotifRead();};
  const dismissNotif=(id)=>setNotifications((ns)=>ns.filter((n)=>n.id!==id));
  const NOTIF_MAX_AGE=7*1440; // auto-hide notifications older than 7 days
  const closeNotifs=()=>{setShowNotifs(false);if(notifications.some((n)=>!n.read)){markAllNotifs();}};
  const applyServer=(server)=>{setSettings((s)=>({...s,server}));Store.set(SERVER_KEY,server);setApiBase(server.on?server.url:null);if(server.on){enterServer();}else{setServerStatus(null);setAuthed(false);hydrateLocal();}};
  const retryServer=()=>{if(settings.server.on)enterServer();};
  const [booted,setBooted]=useState(false);
  useEffect(()=>{let live=true;
    Store.get(ACCOUNT_KEY).then((savedId)=>{if(live&&savedId&&USER_BY_ID[savedId]){setMe(savedId);setMeId(savedId);}return Store.get(AUTH_KEY);})
    .then((tok)=>{if(tok)setAuthToken(tok);return Store.get(SERVER_KEY);})
    .then(async(sv)=>{if(!live)return;const server=sv||DEFAULT_SETTINGS.server;if(server&&server.on){setApiBase(server.url);setSettings((s)=>({...s,server}));await enterServer();}else{await hydrateLocal();}if(live)setBooted(true);});
    return ()=>{live=false;};},[]);
  useEffect(()=>{if(hydrated.current&&!API_BASE)cohortStore.save(subscribed);},[subscribed,cohortRev]);
  useEffect(()=>{let live=true;Store.get(ONBOARDED_KEY).then((v)=>{if(live&&!v)setShowOnboarding(true);});return ()=>{live=false;};},[]);
  const finishOnboarding=()=>{setShowOnboarding(false);Store.set(ONBOARDED_KEY,true);};

  useEffect(()=>{if(!API_BASE||!openMember)return;let live=true;api.loadWall(openMember).then((notes)=>{if(live&&notes)setWall((w)=>({...w,[openMember]:notes}));});return ()=>{live=false;};},[openMember]);
  useEffect(()=>{
    if(!openMember||openMember===ME)return;let live=true;
    (async()=>{let list;if(API_BASE){const gs=await api.loadMemberGoals(openMember);list=(gs||[]).filter((g)=>g.category==="personal");}else{list=demoSharedFor(openMember);}if(live)setMemberGoals((m)=>({...m,[openMember]:list}));})();
    return ()=>{live=false;};
  },[openMember]);
  useEffect(()=>{
    if(!openMember)return;let live=true;const who=openMember;
    setMemberWeek((m)=>({...m,[who]:undefined}));setMemberHist((m)=>({...m,[who]:undefined}));
    (async()=>{
      let week,hist;
      if(API_BASE){week=await api.loadMemberWeek(who);hist=await api.loadMemberHistory(who);}
      else{
        const isMe=who===ME;
        const cg=goals.filter((g)=>g.category==="cohort"&&subscribed.includes(g.cohortId)&&(isMe||(COHORTS[g.cohortId]&&COHORTS[g.cohortId].members.some((mm)=>mm.id===who))));
        week=isMe?cg.map((g)=>({id:g.id,title:g.title,count:weekDone(g)})):cg.map((g)=>{const p=demoProgress(memberById(who)||{weekPct:55,streak:0},g);return {id:g.id,title:g.title,count:p.weekDone};});
        hist=memberHistory(who);
      }
      if(live){setMemberWeek((m)=>({...m,[who]:week}));setMemberHist((m)=>({...m,[who]:hist}));}
    })();
    return ()=>{live=false;};
  },[openMember]);
  useEffect(()=>{setSessionExpiredHandler(()=>{setAuthToken(null);Store.set(AUTH_KEY,null);setAuthed(false);setToast("Your session expired — please sign in again.");});return ()=>setSessionExpiredHandler(null);},[]);
  useEffect(()=>{let live=true;Store.get(COHORT_EXPAND_KEY).then((v)=>{if(live&&v&&typeof v==="object")setCohortExpanded(v);});return ()=>{live=false;};},[]);
  useEffect(()=>{applyWeekStart(settings.weekStart==="mon");setGoals((gs)=>gs.map((g)=>g.log?deriveGoal(g):g));setSelectedIso((cur)=>WEEK_ISO.indexOf(cur)>=0||cur===TODAY_ISO?cur:TODAY_ISO);setCohortRev((v)=>v+1);},[settings.weekStart]);
  useEffect(()=>{
    if(!settings.server.on||!authed)return;
    const tick=()=>{if(typeof document==="undefined"||!document.hidden){if(refreshRef.current)refreshRef.current();}};
    const iv=setInterval(tick,25000);            // gentle poll while the app is open
    window.addEventListener("focus",tick);        // and immediately when you return to it
    document.addEventListener("visibilitychange",tick);
    return ()=>{clearInterval(iv);window.removeEventListener("focus",tick);document.removeEventListener("visibilitychange",tick);};
  },[settings.server.on,authed]);
  useEffect(()=>{
    if(!booted||recapCheckedRef.current||showOnboarding||goals.length===0||(settings.server.on&&!authed))return;
    recapCheckedRef.current=true;
    (async()=>{
      const shown=await Store.get(RECAP_KEY);
      await Store.set(RECAP_KEY,WEEK_START_ISO);           // mark this week handled so the recap shows at most once
      if(shown===WEEK_START_ISO)return;                    // already shown for the current week
      const stats=lastWeekStats(goals);
      if(stats.totalMarks>0)setRecap(stats);               // only when there was real activity last week
    })();
  },[goals,showOnboarding,booted]);

  const marksToday=(API_BASE?0:23)+goals.filter((g)=>metToday(g)).length;   // demo shows a lively base; server counts only real logs
  const loadMoreFeed=async(scope)=>{
    if(!API_BASE||feedLoadingMore)return;
    const list=scope==="friend"?friendFeed:feed;const last=list[list.length-1];const before=last&&last.cursor;
    if(!before){setFeedMore((mm)=>({...mm,[scope]:false}));return;}
    setFeedLoadingMore(true);const more=await api.loadFeed(scope,before,25);setFeedLoadingMore(false);
    if(!more)return;const seen=new Set(list.map((x)=>x.id));const dedup=more.filter((x)=>!seen.has(x.id));
    if(scope==="friend")setFriendFeed((ff)=>[...ff,...dedup]);else setFeed((ff)=>[...ff,...dedup]);
    setFeedMore((mm)=>({...mm,[scope]:more.length>=25}));
  };
  const buildDemoMentee=(cohortId,memberId)=>{const c=COHORTS[cohortId];const member=(c&&c.members.find((m)=>m.id===memberId))||{id:memberId,name:dispName(memberId,profile),weekPct:55,streak:0};const cg=goals.filter((g)=>g.category==="cohort"&&g.cohortId===cohortId);return {member:{id:memberId,name:dispName(memberId,profile),avatar:dispPfp(memberId,profile)},goals:cg.map((g)=>({id:g.id,title:g.title,icon:g.icon,type:g.type,unit:g.unit,dailyMin:g.dailyMin,target:g.target,...demoProgress(member,g)})),personalGoals:demoSharedFor(memberId)};};
  const buildDemoGoal=(cohortId,goalId)=>{const c=COHORTS[cohortId];const g=goals.find((x)=>x.id===goalId);if(!g||!c)return {goal:{title:"Goal"},members:[]};return {goal:{id:g.id,title:g.title,icon:g.icon,type:g.type,unit:g.unit,dailyMin:g.dailyMin,target:g.target},members:c.members.map((m)=>({id:m.id,name:dispName(m.id,profile),avatar:dispPfp(m.id,profile),role:m.role,...demoProgress(m,g)}))};};
  const openMenteeView=async(cohortId,memberId)=>{setMentorView({kind:"mentee",cohortId,id:memberId,loading:true,data:null});if(API_BASE){const d=await api.menteeProgress(cohortId,memberId);setMentorView((v)=>(v&&v.kind==="mentee"&&v.id===memberId)?{...v,loading:false,data:d||buildDemoMentee(cohortId,memberId)}:v);}else{const d=buildDemoMentee(cohortId,memberId);setMentorView((v)=>(v&&v.kind==="mentee"&&v.id===memberId)?{...v,loading:false,data:d}:v);}};
  const openGoalView=async(cohortId,goalId)=>{setMentorView({kind:"goal",cohortId,id:goalId,loading:true,data:null});if(API_BASE){const d=await api.goalProgress(cohortId,goalId);setMentorView((v)=>(v&&v.kind==="goal"&&v.id===goalId)?{...v,loading:false,data:d||buildDemoGoal(cohortId,goalId)}:v);}else{const d=buildDemoGoal(cohortId,goalId);setMentorView((v)=>(v&&v.kind==="goal"&&v.id===goalId)?{...v,loading:false,data:d}:v);}};
  const closeMentorView=()=>setMentorView(null);
  const buildDemoHistory=(cohortId,memberId,goalId)=>{const c=COHORTS[cohortId];const member=(c&&c.members.find((m)=>m.id===memberId))||{id:memberId,name:dispName(memberId,profile),weekPct:55,streak:0};const g=goals.find((x)=>x.id===goalId)||demoPersonalById(goalId);if(!g)return {goal:{title:"Goal"},member:{name:dispName(memberId,profile)},series:[]};const series=demoSeries(member,g,demoMemberSince(member));return {goal:{id:g.id,title:g.title,icon:g.icon,type:g.type,unit:g.unit,dailyMin:g.dailyMin,target:g.target},member:{id:memberId,name:dispName(memberId,profile),avatar:dispPfp(memberId,profile)},series};};
  const openGoalHistory=async(cohortId,memberId,goalId)=>{setMentorView({kind:"history",cohortId,memberId,goalId,loading:true,data:null});if(API_BASE){const d=await api.goalHistory(cohortId,memberId,goalId,365);setMentorView((v)=>(v&&v.kind==="history"&&v.goalId===goalId&&v.memberId===memberId)?{...v,loading:false,data:d||buildDemoHistory(cohortId,memberId,goalId)}:v);}else{const d=buildDemoHistory(cohortId,memberId,goalId);setMentorView((v)=>(v&&v.kind==="history"&&v.goalId===goalId&&v.memberId===memberId)?{...v,loading:false,data:d}:v);}};
  const cheer=(id)=>{const cur=feed.find((i)=>i.id===id)||friendFeed.find((i)=>i.id===id);remote.cheer(id,!(cur&&cur.cheered));const fn=(f)=>f.map((it)=>it.id===id?{...it,cheered:!it.cheered,cheers:it.cheers+(it.cheered?-1:1)}:it);setFeed(fn);setFriendFeed(fn);};
  const friendStatus=(id)=>friends.includes(id)?"friends":friendReqs.outgoing.includes(id)?"requested":friendReqs.incoming.some((x)=>x.fromId===id)?"incoming":"none";
  const acceptReq=(fromId)=>{
    setFriends((fs)=>{const n=fs.includes(fromId)?fs:[...fs,fromId];if(!API_BASE)friendApi.save(n);return n;});
    setFriendReqs((r)=>({incoming:r.incoming.filter((x)=>x.fromId!==fromId),outgoing:r.outgoing.filter((x)=>x!==fromId)}));
    api.acceptReq(fromId);
  };
  const declineReq=(fromId)=>{setFriendReqs((r)=>({...r,incoming:r.incoming.filter((x)=>x.fromId!==fromId)}));api.declineReq(fromId);};
  const toggleFriend=async(id)=>{
    const st=friendStatus(id);
    if(st==="friends"){setFriends((fs)=>{const n=fs.filter((x)=>x!==id);if(!API_BASE)friendApi.save(n);return n;});api.unfriend(id);return;}
    if(st==="requested"){setFriendReqs((r)=>({...r,outgoing:r.outgoing.filter((x)=>x!==id)}));api.declineReq(id);return;}
    if(st==="incoming"){acceptReq(id);return;}
    if(API_BASE){const j=await api.sendFriendReq(id);if(j&&j.status==="friends"){setFriends((fs)=>fs.includes(id)?fs:[...fs,id]);}else{setFriendReqs((r)=>({...r,outgoing:[...r.outgoing,id]}));setToast("Friend request sent.");}}
    else{setFriendReqs((r)=>({...r,outgoing:[...r.outgoing,id]}));setToast("Friend request sent.");}
  };
  const celebratedRef=useRef(new Set());
  const [celebration,setCelebration]=useState(null);
  const [recap,setRecap]=useState(null);
  const recapCheckedRef=useRef(false);
  const checkMilestone=(id,title,streak)=>{if(!MILESTONES.includes(streak))return;const key=id+":"+streak;if(celebratedRef.current.has(key))return;celebratedRef.current.add(key);setCelebration({title:title||"your goal",streak});};
  const setValue=(id,iso,val)=>{if(!dayEditableIso(iso))return;
    const g0=goals.find((x)=>x.id===id);
    const wasMet=g0?metOnDate(g0,iso):false;
    const v0=Math.min(9999999,Math.max(0,Math.round(val)||0));
    const justCompleted=!!g0&&!wasMet&&metValue(g0,v0)&&iso<=TODAY_ISO;
    if(justCompleted){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(14);}catch{/* no haptics */}}
    if(API_BASE){
      const inWeek=WEEK_ISO.indexOf(iso)>=0;const di=dowIndex(iso);
      setGoals((gs)=>gs.map((g)=>{if(g.id!==id)return g;const v=Math.min(9999999,Math.max(0,Math.round(val)||0));const m=metValue(g,v)?1:0;let values=g.values,week=g.week;if(inWeek){values=[...(g.values||Array(7).fill(0))];values[di]=v;week=[...(g.week||Array(7).fill(0))];week[di]=m;}const history={...(g.history||{}),[iso]:m};return {...g,values,week,history};}));
      api.setLog(id,iso,val,null).then((u)=>{if(u&&u.id){setGoals((gs)=>gs.map((g)=>g.id===id?{...g,...u,Icon:g.Icon}:g));if(justCompleted)checkMilestone(id,u.title,u.streak);}});
      return;
    }
    setGoals((gs)=>{const next=gs.map((g)=>{if(g.id!==id)return g;const v=Math.min(9999999,Math.max(0,Math.round(val)||0));const log={...(g.log||{}),[iso]:v};return deriveGoal({...g,log});});api.setLog(id,iso,val,next);const ng=next.find((g)=>g.id===id);if(justCompleted&&ng)checkMilestone(id,ng.title,ng.streak);return next;});
  };
  const toggle=(id,iso)=>{const g=goals.find((x)=>x.id===id);setValue(id,iso,metOnDate(g,iso)?0:1);};
  const setVisibility=(id,vis)=>{setGoals((gs)=>gs.map((g)=>g.id===id?{...g,vis}:g));setSheet(null);};
  const sameGoal=(a,b)=>a.title.trim().toLowerCase()===b.title.trim().toLowerCase()&&a.category===b.category&&(a.category!=="cohort"||a.cohortId===b.cohortId)&&a.type===b.type&&(a.type!=="numeric"||(Number(a.dailyMin)===Number(b.dailyMin)&&(a.unit||"").trim().toLowerCase()===(b.unit||"").trim().toLowerCase()));
  const addGoal=async(spec)=>{
    if(goals.some((g)=>sameGoal(g,spec))){setSheet(null);setToast("You already have a goal exactly like this.");return;}
    if(spec.category==="personal"&&goals.filter((g)=>g.category==="personal").length>=25){setSheet(null);setToast("You've reached 25 personal goals. Archive some before adding more.");return;}
    setSheet(null);
    if(API_BASE){try{const g=await api.createGoal({title:spec.title,icon:spec.icon||"Target",category:spec.category,cohortId:spec.cohortId,type:spec.type,unit:spec.unit,dailyMin:spec.dailyMin,step:spec.step,target:spec.target,vis:spec.vis});setGoals((gs)=>[...gs,deriveGoal({...g,Icon:iconOf(g.icon)})]);}catch(e){setToast(e.message);}return;}
    const id=`g${Date.now()}`;const icon=spec.icon||"Target";setGoals((gs)=>{const next=[...gs,deriveGoal({id,target:7,...spec,icon,Icon:iconOf(icon),log:{}})];api.saveGoals(next);return next;});};
  const editGoal=async(spec)=>{setSheet(null);
    if(API_BASE){try{const g=await api.updateGoal(spec.id,{title:spec.title,icon:spec.icon,type:spec.type,unit:spec.unit,dailyMin:spec.dailyMin,step:spec.step,target:spec.target,vis:spec.vis});setGoals((gs)=>gs.map((x)=>x.id===spec.id?deriveGoal({...x,...g,Icon:iconOf(g.icon)}):x));}catch(e){setToast(e.message);}return;}
    setGoals((gs)=>{const next=gs.map((g)=>{if(g.id!==spec.id)return g;const icon=spec.icon||g.icon||"Target";return deriveGoal({...g,...spec,icon,Icon:iconOf(icon)});});api.saveGoals(next);return next;});};
  const deleteGoal=async(id)=>{
    if(API_BASE){try{await api.deleteGoal(id);setGoals((gs)=>gs.filter((g)=>g.id!==id));}catch(e){setToast(e.message);}return;}
    setGoals((gs)=>{const next=gs.filter((g)=>g.id!==id);api.saveGoals(next);return next;});};
  const encourage=(mid,text)=>{
    const localId="wl_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    setWall((w)=>({...w,[mid]:[...(w[mid]||[]),{id:localId,from:ME,text}]}));
    Promise.resolve(remote.wall(mid,text)).then((serverId)=>{if(serverId)setWall((w)=>({...w,[mid]:(w[mid]||[]).map((n)=>n.id===localId?{...n,id:serverId}:n)}));});
  };
  const deleteNote=(mid,note)=>{setWall((w)=>({...w,[mid]:(w[mid]||[]).filter((n)=>note.id?n.id!==note.id:n!==note)}));if(note.id)api.deleteWallNote(note.id);};
  const sendNudge=(mid,text)=>{encourage(mid,text);setNudged((n)=>({...n,[mid]:true}));setSheet(null);};
  const joinCohort=(id)=>{setSubscribed((s)=>s.includes(id)?s:[...s,id]);remote.joinCohort(id);setSheet(null);};
  const joinByCode=async(code)=>{
    const c=String(code||"").trim();if(!c)return "Enter an invite code.";
    if(API_BASE){try{const r=await api.joinByCode(c);await hydrateFromServer();setSubscribed((s)=>r.cohortId&&!s.includes(r.cohortId)?[...s,r.cohortId]:s);setSheet(null);return null;}catch(e){const m=(e.message||"").toLowerCase();if(m.includes("invalid"))return "That code didn't match any cohort. Double-check it and try again.";if(m.includes("already"))return "You're already in that cohort.";return e.message||"Couldn't join — please try again.";}}
    const id=cohortByCode(c);if(!id)return "No cohort matches that code.";if(subscribed.includes(id))return "You're already in that cohort.";joinCohort(id);return null;
  };
  const leaveCohort=(id)=>{
    setSubscribed((s)=>s.filter((x)=>x!==id));
    if(!API_BASE&&COHORTS[id]){COHORTS[id].members=COHORTS[id].members.filter((m)=>m.id!==ME);if(COHORTS[id].members.length===0){delete COHORTS[id];}setCohortRev((v)=>v+1);}
    remote.leaveCohort(id);
  };
  const createCohort=async({name,fullName,theme,description})=>{
    if(API_BASE){
      const r=await remote.createCohort({name,fullName,theme,description:description||""});
      setSheet(null);
      if(r&&r.id){await hydrateFromServer();setSubscribed((s)=>s.includes(r.id)?s:[...s,r.id]);setCohortRev((v)=>v+1);setTab("cohort");}
      else{setToast("Couldn't create the cohort — please try again.");}
      return;
    }
    const id="c_"+Date.now().toString(36);
    COHORTS[id]={id,name,fullName,theme,description:description||"",marks:0,target:7,members:[{id:ME,name:profile.name,role:"mentor",weekPct:0,streak:0,loggedToday:true,trend:0}]};
    setSubscribed((s)=>[...s,id]);setCohortRev((v)=>v+1);setSheet(null);setTab("cohort");
  };
  const updateCohort=(id,{name,fullName,theme,description})=>{
    if(COHORTS[id]){COHORTS[id]={...COHORTS[id],name,fullName,theme,description};}
    setCohortRev((v)=>v+1);setSheet(null);remote.updateCohort(id,{name,fullName,theme,description});
  };
  const regenerateInvite=async(id)=>{
    let nc;
    if(API_BASE){nc=await api.regenerateInvite(id);}
    else{const c=COHORTS[id];const base=((c&&c.name)||"COHORT").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8)||"COHORT";nc=`${base}-${100+Math.floor(Math.random()*900)}`;}
    if(nc&&COHORTS[id]){COHORTS[id]={...COHORTS[id],inviteCode:nc};setCohortRev((v)=>v+1);setToast("New invite code generated. The old one no longer works.");}
    return nc;
  };
  const setMemberRole=(cid,uid,role)=>{const c=COHORTS[cid];if(!c)return;
    const mentors=c.members.filter((m)=>m.role==="mentor").length;
    if(role==="mentee"&&mentors<=1&&c.members.find((m)=>m.id===uid)?.role==="mentor")return; // keep ≥1 mentor
    COHORTS[cid]={...c,members:c.members.map((m)=>m.id===uid?{...m,role}:m)};
    setCohortRev((v)=>v+1);remote.setRole(cid,uid,role);
  };
  const removeMember=(cid,uid)=>{const c=COHORTS[cid];if(!c||uid===ME)return;
    const target=c.members.find((m)=>m.id===uid);
    if(target?.role==="mentor"&&c.members.filter((m)=>m.role==="mentor").length<=1)return;
    COHORTS[cid]={...c,members:c.members.filter((m)=>m.id!==uid)};
    setCohortRev((v)=>v+1);remote.removeMember(cid,uid);
  };
  const archiveCohort=(id)=>{
    setSubscribed((s)=>s.filter((x)=>x!==id));
    if(id.startsWith("c_"))delete COHORTS[id];
    setCohortRev((v)=>v+1);setSheet(null);setConfirmArchive(null);remote.archiveCohort(id);
  };
  const resetDemo=()=>{setMe(DEFAULT_ME);setMeId(DEFAULT_ME);Store.set(ACCOUNT_KEY,null);setAuthToken(null);Store.set(AUTH_KEY,null);setAuthed(false);cohortStore.restoreSeed();cohortStore.clear();setApiBase(null);Store.set(SERVER_KEY,null);setServerStatus(null);setGoals(SEED_GOALS_PD);api.clear();setFeed(SEED_FEED);setFeedMore({cohort:false,friend:false});setCohortExpanded({});Store.set(COHORT_EXPAND_KEY,{});setWall(WALL_SEED);setSubscribed(subscribedFor(DEFAULT_ME));setNudged({});setSettings(DEFAULT_SETTINGS);setProfile(profileFor(DEFAULT_ME));setEditProfile(false);setSelectedIso(TODAY_ISO);setOpenMember(null);setSheet(null);setShowSettings(false);setShowAccounts(false);setShowSearch(false);setShowNotifs(false);setNotifications(SEED_NOTIFS);setFriendReqs(SEED_FRIEND_REQS);setCohortRev((v)=>v+1);setTab(mentorCohorts().length?"mentor":"cetele");};

  const tabs=[{id:"feed",label:"Feed",icon:Home},{id:"cetele",label:"Tally",icon:Sparkles},{id:"cohort",label:"Cohort",icon:Users},...(mentoredSubscribed.length?[{id:"mentor",label:"Mentor",icon:GraduationCap}]:[]),{id:"insights",label:"Insights",icon:BarChart3}];
  const safeTab=tabs.some((t)=>t.id===tab)?tab:"cetele";
  const noCohorts=subscribed.length===0;
  const onAuthScreen=settings.server.on&&!authed;   // sign-in takeover: hide chrome + first-run/recap overlays
  const visGoal=sheet&&sheet.kind==="vis"?goals.find((g)=>g.id===sheet.goalId):null;
  const editGoalObj=sheet&&sheet.kind==="edit"?goals.find((g)=>g.id===sheet.goalId):null;
  const nudgeMember=sheet&&sheet.kind==="nudge"?memberById(sheet.memberId):null;
  const detailGoal=detailGoalId?goals.find((g)=>g.id===detailGoalId):null;

  return (
    <div className="w-full flex justify-center" style={{background:BORDER2,minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=Quicksand:wght@500;600;700&display=swap');
        .cz,.cz *{font-family:${FU}} .cz button{cursor:pointer;transition:transform .1s} .cz button:active{transform:scale(.97)}
        .cz{font-variant-numeric:tabular-nums}                                   /* stats never jitter as numbers change */
        .cz{background-image:radial-gradient(rgba(28,25,23,.022) 0.5px, transparent 0.5px);background-size:14px 14px}   /* faint paper texture */
        @keyframes czdraw{from{stroke-dashoffset:var(--cz-dash,60)}to{stroke-dashoffset:0}}
        .cz-draw{stroke-dasharray:var(--cz-dash,60);animation:czdraw .34s cubic-bezier(.3,.7,.3,1) forwards}          /* tally stroke draws in on log */
        .cz-rule{height:0;border:0;border-top:1.5px dashed ${BORDER2};margin:0}                                        /* tally-style divider */
        .cz :focus-visible{outline:2px solid ${PINE};outline-offset:2px}
        .cz ::-webkit-scrollbar{display:none}
        .cz input[type=number]::-webkit-inner-spin-button,.cz input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        @keyframes czUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .czsheet{animation:czUp .26s cubic-bezier(.2,.8,.2,1)}
        @keyframes czpop{0%{transform:scale(.6)}55%{transform:scale(1.3)}100%{transform:scale(1)}}
        .czpop{animation:czpop .32s ease}
        @keyframes czspin{to{transform:rotate(360deg)}}
        .czspin{animation:czspin .7s linear infinite}
        @keyframes czshim{0%,100%{opacity:.5}50%{opacity:1}}
        .czshim{animation:czshim 1.3s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.czsheet,.czpop,.czspin,.czshim,.cz-draw{animation:none}.cz button:active{transform:none}}
        .cz-reduce .czsheet,.cz-reduce .czpop,.cz-reduce .czspin,.cz-reduce .czshim,.cz-reduce .cz-draw{animation:none}.cz-reduce button:active{transform:none}`}</style>

      <div lang="en" data-rev={cohortRev} className={"cz w-full flex flex-col"+(settings.reduceMotion?" cz-reduce":"")} style={{maxWidth:430,background:CANVAS,minHeight:"100vh"}}>
        {!onAuthScreen&&<header className="sticky top-0 px-4 py-3 flex items-center justify-between" style={{zIndex:60,background:"#faf9f7e6",backdropFilter:"blur(8px)",borderBottom:`1px solid ${BORDER}`}}>
          <button onClick={()=>{setShowSettings(false);setEditProfile(false);setShowSearch(false);setShowNotifs(false);setOpenMember(null);setDetailGoalId(null);setMentorView(null);}} aria-label="Home" className="flex items-center gap-2"><Logo size={32}/><Wordmark size={22}/></button>
          <div className="flex items-center gap-1.5">
            <button onClick={openNotifs} aria-label="Notifications" className="flex items-center justify-center rounded-full" style={{position:"relative",width:34,height:34,color:showNotifs?PINE:INK2,background:showNotifs?PINE_SOFT:"transparent"}}><Bell size={20}/>{inboxCount>0&&<span className="flex items-center justify-center rounded-full" style={{position:"absolute",top:2,right:2,minWidth:15,height:15,padding:"0 3px",background:CHEER,color:"#fff",fontSize:9,fontWeight:800,lineHeight:1}}>{inboxCount>9?"9+":inboxCount}</span>}</button>
            <button onClick={()=>{setOpenMember(null);setEditProfile(false);setShowSettings(false);setDetailGoalId(null);setShowNotifs(false);setShowSearch(true);}} aria-label="Search" className="flex items-center justify-center rounded-full" style={{width:34,height:34,color:showSearch?PINE:INK2,background:showSearch?PINE_SOFT:"transparent"}}><SearchIcon size={20}/></button>
            <button onClick={()=>{setOpenMember(null);setEditProfile(false);setShowSearch(false);setDetailGoalId(null);setShowNotifs(false);setShowSettings(true);}} aria-label="Settings" className="flex items-center justify-center rounded-full" style={{width:34,height:34,color:showSettings?PINE:INK2,background:showSettings?PINE_SOFT:"transparent"}}><SettingsIcon size={20}/></button>
            <button onClick={()=>{setShowSettings(false);setEditProfile(false);setShowSearch(false);setDetailGoalId(null);setShowNotifs(false);setOpenMember(ME);}}><Avatar name={profile.name} pfp={profile.avatar} size={34} ring={PINE}/></button>
          </div>
        </header>}

        {settings.server.on&&dataState==="loading"&&(
          <div className="px-4 py-2 flex items-center gap-2" style={{background:PINE_SOFT,borderBottom:`1px solid ${MINT_BORDER}`}}>
            <span className="czspin" style={{width:13,height:13,border:`2px solid ${PINE}`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block"}}/>
            <span style={{fontSize:12.5,color:PINE_DEEP,fontWeight:600}}>{waking?"Waking up the server… this can take up to a minute the first time.":"Connecting to your server…"}</span>
          </div>
        )}
        {settings.server.on&&dataState==="error"&&(
          <div className="px-4 py-2.5 flex items-center gap-2" style={{background:CHEER_SOFT,borderBottom:`1px solid #fecdd3`}}>
            <AlertCircle size={15} style={{color:CHEER}}/>
            <span className="flex-1" style={{fontSize:12.5,color:CHEER,fontWeight:600}}>Can't reach the server — showing demo data.</span>
            <button onClick={retryServer} className="rounded-full font-semibold px-2.5 py-1" style={{fontSize:11.5,background:"#fff",color:CHEER,border:`1px solid #fecdd3`}}>Retry</button>
            <button onClick={()=>applyServer({...settings.server,on:false})} className="rounded-full font-semibold px-2.5 py-1" style={{fontSize:11.5,background:CHEER,color:"#fff"}}>Use demo</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {(settings.server.on&&!authed)?<AuthScreen serverUrl={settings.server.url} onAuthed={onAuthed} onBackToDemo={()=>applyServer({...settings.server,on:false})}/>
          :showNotifs?<NotificationsScreen items={notifications.filter((n)=>(n.minsAgo||0)<NOTIF_MAX_AGE)} requests={friendReqs.incoming} onAccept={acceptReq} onDecline={declineReq} onOpenMember={(id)=>{closeNotifs();setOpenMember(id);}} onBack={closeNotifs} onMarkAll={markAllNotifs} onDismiss={dismissNotif}/>
          :editProfile?<ProfileEditScreen profile={profile} onSave={async(p)=>{try{const saved=await api.patchProfile(p);setProfile((cur)=>(API_BASE&&saved)?{...cur,name:saved.name??p.name,username:saved.username??p.username,avatar:saved.avatar!==undefined?saved.avatar:p.avatar,bio:saved.bio??p.bio,nameChangesLeft:saved.nameChangesLeft??p.nameChangesLeft}:p);setEditProfile(false);}catch(e){setToast(e.message);}}} onBack={()=>setEditProfile(false)}/>
            :showSettings?<SettingsScreen settings={settings} onChange={setSettings} subscribed={subscribed} onLeave={leaveCohort} onJoinOpen={()=>setSheet({kind:"join"})} onReset={resetDemo} onBack={()=>setShowSettings(false)} profile={profile} onEditProfile={()=>setEditProfile(true)} onSwitchAccount={()=>{if(settings.server.on){signOut();}else{setShowAccounts(true);}}} onSignOut={signOut} onReplayIntro={()=>{setShowSettings(false);setShowOnboarding(true);}} serverStatus={serverStatus} onServerChange={applyServer} onTestConnection={()=>{setServerStatus(null);api.health().then(setServerStatus);}} onDeleteAccount={deleteAccount} onShowRecovery={showRecovery} onTogglePush={togglePush}/>
            :showSearch?<SearchScreen onBack={()=>setShowSearch(false)} onOpenMember={(id)=>{setShowSearch(false);setOpenMember(id);}} subscribed={subscribed} profile={profile} friends={friends} statusOf={friendStatus} onToggleFriend={toggleFriend} requests={friendReqs.incoming} onAccept={acceptReq} onDecline={declineReq}/>
            :openMember?<ProfileScreen memberId={openMember} wall={wall} onBack={()=>setOpenMember(null)} onEncourage={encourage} onDeleteNote={deleteNote} profile={profile} onEditProfile={()=>setEditProfile(true)} statusOf={friendStatus} onToggleFriend={toggleFriend} sharedGoals={memberGoals[openMember]} weekData={memberWeek[openMember]} historyData={memberHist[openMember]}/>
            :detailGoal?<GoalDetailScreen goal={detailGoal} onBack={()=>setDetailGoalId(null)} onSetValue={setValue} onToggle={toggle} onEditVis={(id)=>setSheet({kind:"vis",goalId:id})} onEdit={(id)=>setSheet({kind:"edit",goalId:id})} onDelete={(id)=>setConfirmDelete(id)} canManage={detailGoal.category==="personal"||isMentorOfCohort(detailGoal.cohortId)}/>
            :mentorView?(mentorView.kind==="mentee"?<MentorMenteeScreen data={mentorView.data} loading={mentorView.loading} cohortName={COHORTS[mentorView.cohortId]?COHORTS[mentorView.cohortId].name:""} onBack={closeMentorView} onOpenGoal={(gid)=>openGoalHistory(mentorView.cohortId,mentorView.id,gid)}/>:mentorView.kind==="goal"?<MentorGoalScreen data={mentorView.data} loading={mentorView.loading} cohortName={COHORTS[mentorView.cohortId]?COHORTS[mentorView.cohortId].name:""} onBack={closeMentorView} onOpenMentee={(mid)=>openMenteeView(mentorView.cohortId,mid)}/>:<MentorGoalHistoryScreen data={mentorView.data} loading={mentorView.loading} onBack={()=>openMenteeView(mentorView.cohortId,mentorView.memberId)}/>)
            :(settings.server.on&&dataState==="loading"&&!hydrated.current)?<SkeletonScreen/>
            :safeTab==="cohort"&&noCohorts?<NoCohortsScreen onJoinOpen={()=>setSheet({kind:"join"})} onCreateOpen={()=>setSheet({kind:"create"})}/>
            :safeTab==="feed"?<FeedScreen feed={feed} friendFeed={friendFeed} friends={friends} subscribed={subscribed} onCheer={cheer} onOpenMember={setOpenMember} onOpenSearch={()=>{setShowSettings(false);setEditProfile(false);setOpenMember(null);setShowSearch(true);}} onJoinOpen={()=>setSheet({kind:"join"})} onCreateOpen={()=>setSheet({kind:"create"})} marksToday={marksToday} profile={profile} feedMore={feedMore} loadingMore={feedLoadingMore} onLoadMore={loadMoreFeed}/>
            :safeTab==="cetele"?<CeteleScreen goals={goals} subscribed={subscribed} onSetValue={setValue} onToggle={toggle} onEditVis={(id)=>setSheet({kind:"vis",goalId:id})} onEdit={(id)=>setSheet({kind:"edit",goalId:id})} onDelete={(id)=>setConfirmDelete(id)} onAdd={()=>setSheet({kind:"add"})} onOpenGoal={(id)=>setDetailGoalId(id)} selectedIso={selectedIso} setSelectedIso={setSelectedIso} cohortExpanded={cohortExpanded} onToggleCohort={toggleCohortExpand}/>
            :safeTab==="cohort"?<CohortScreen subscribed={subscribed} onOpenMember={setOpenMember} onJoinOpen={()=>setSheet({kind:"join"})} onCreateOpen={()=>setSheet({kind:"create"})} onSettingsOpen={(id)=>setSheet({kind:"cohortSettings",id})} onLeave={(id)=>setConfirmLeave(id)} profile={profile}/>
            :safeTab==="mentor"?<MentorScreen cohorts={mentoredSubscribed} goals={goals} onOpenMentee={openMenteeView} onOpenGoal={openGoalView} onAddGoal={(cid)=>setSheet({kind:"add",preset:{category:"cohort",cohortId:cid}})} onNudge={(id)=>setSheet({kind:"nudge",memberId:id})} nudged={nudged}/>
            :<InsightsScreen goals={goals} subscribed={subscribed}/>}
        </main>

        {!onAuthScreen&&<nav className="sticky bottom-0 flex items-stretch" style={{zIndex:60,background:"#fffffff2",backdropFilter:"blur(8px)",borderTop:`1px solid ${BORDER}`}}>
          {tabs.map((t)=>{const active=!openMember&&!showSettings&&!editProfile&&!showSearch&&!showNotifs&&!detailGoal&&!mentorView&&safeTab===t.id;const Icon=t.icon;return(
            <button key={t.id} onClick={()=>{setOpenMember(null);setShowSettings(false);setEditProfile(false);setShowSearch(false);setShowNotifs(false);setDetailGoalId(null);setMentorView(null);setTab(t.id);}} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{color:active?PINE:INK3}}>
              <Icon size={21} strokeWidth={active?2.4:2}/><span style={{fontSize:10.5,fontWeight:active?700:500}}>{t.label}</span>
            </button>);})}
        </nav>}
      </div>

      {sheet&&sheet.kind==="add"&&<GoalSheet mode="add" preset={sheet.preset} defaultVis={settings.defaultVis} friends={friends} onClose={()=>setSheet(null)} onSave={addGoal}/>}
      {editGoalObj&&<GoalSheet mode="edit" goal={editGoalObj} friends={friends} onClose={()=>setSheet(null)} onSave={editGoal}/>}
      {visGoal&&<VisibilitySheet goal={visGoal} friends={friends} onClose={()=>setSheet(null)} onSave={setVisibility}/>}
      {nudgeMember&&<NudgeSheet member={nudgeMember} onClose={()=>setSheet(null)} onSend={(text)=>sendNudge(sheet.memberId,text)}/>}
      {sheet&&sheet.kind==="join"&&<JoinSheet onJoinCode={joinByCode} onClose={()=>setSheet(null)}/>}
      {sheet&&sheet.kind==="create"&&<CreateCohortSheet onClose={()=>setSheet(null)} onCreate={createCohort}/>}
      {sheet&&sheet.kind==="cohortSettings"&&<CohortSettingsSheet cohortId={sheet.id} onClose={()=>setSheet(null)} onSave={updateCohort} onSetRole={setMemberRole} onRemoveMember={removeMember} onArchive={(id)=>setConfirmArchive(id)} onRegenerate={regenerateInvite} profile={profile}/>}
      {showAccounts&&<AccountPicker current={meId} onPick={switchAccount} onClose={()=>setShowAccounts(false)}/>}
      {showOnboarding&&!onAuthScreen&&<Onboarding onDone={finishOnboarding}/>}
      {recoveryView&&<div className="fixed inset-0 flex justify-center" style={{zIndex:95,background:CANVAS,overflowY:"auto"}}><div className="w-full" style={{maxWidth:430}}><RecoveryPanel code={recoveryView} context="view" onContinue={()=>setRecoveryView(null)}/></div></div>}
      {recap&&!onAuthScreen&&<RecapScreen stats={recap} onClose={()=>setRecap(null)}/>}
      {celebration&&<CelebrationScreen title={celebration.title} streak={celebration.streak} onClose={()=>setCelebration(null)}/>}
      {toast&&<div className="fixed left-0 right-0 flex justify-center px-4" style={{bottom:96,zIndex:80,pointerEvents:"none"}}><div className="rounded-full px-4 py-2.5 flex items-center gap-2" style={{background:INK,color:"#fff",fontSize:13,fontWeight:600,maxWidth:360,boxShadow:E2}}><AlertCircle size={15} style={{color:"#fca5a5"}}/>{toast}</div></div>}
      {confirmArchive&&<ConfirmDialog title="Delete this cohort?" body="This permanently removes the cohort and its shared goals for every member. This can't be undone." confirmLabel="Delete" danger onCancel={()=>setConfirmArchive(null)} onConfirm={()=>archiveCohort(confirmArchive)}/>}
      {confirmLeave&&(()=>{const c=COHORTS[confirmLeave];const last=c&&c.members&&c.members.length<=1;return <ConfirmDialog title={`Leave ${c?c.name:"cohort"}?`} body={last?"You're the last member, so this cohort and its shared goals will be permanently deleted. This can't be undone.":"You'll stop seeing its shared goals and standings. You can rejoin later with the invite code."} confirmLabel={last?"Leave & delete":"Leave"} danger onCancel={()=>setConfirmLeave(null)} onConfirm={()=>{leaveCohort(confirmLeave);setConfirmLeave(null);}}/>;})()}
      {confirmDelete&&<ConfirmDialog title="Delete this goal?" body="Its weekly history and streak will be removed. This can't be undone." confirmLabel="Delete" danger onCancel={()=>setConfirmDelete(null)} onConfirm={()=>{deleteGoal(confirmDelete);setConfirmDelete(null);setDetailGoalId(null);}}/>}
    </div>
  );
}
