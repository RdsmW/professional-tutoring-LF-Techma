import './_group.css';
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Users,
  UserCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';

type QueueItem = {
  id: string;
  kind: 'assignment' | 'payment' | 'capacity';
  title: string;
  detail: string;
  meta: string;
  action: string;
  tone: 'urgent' | 'watch' | 'routine';
};

const nav = [
  ['Dashboard', LayoutDashboard],
  ['Families', Users],
  ['Guardians', UserCircle],
  ['Students', GraduationCap],
  ['Tutors', BookOpen],
  ['Sessions', CalendarDays],
  ['Billing', CreditCard],
  ['Reports', ShieldAlert],
  ['Settings', Settings],
] as const;

const initialQueue: QueueItem[] = [
  { id: 'assignment-1', kind: 'assignment', title: 'Marcus Johnson', detail: 'Algebra II · New registration', meta: 'Since Jun 8', action: 'Assign tutor', tone: 'urgent' },
  { id: 'payment-1', kind: 'payment', title: 'Williams Family', detail: 'Ava Williams · Card declined', meta: '$420.00 · Jun 6', action: 'Review payment', tone: 'urgent' },
  { id: 'assignment-2', kind: 'assignment', title: 'Priya Patel', detail: 'SAT Prep · Tutor unavailable', meta: 'Preferred time not booked', action: 'Find a match', tone: 'watch' },
  { id: 'capacity-1', kind: 'capacity', title: 'Monday capacity', detail: '12 of 15 sessions booked', meta: '3 openings remain', action: 'Open schedule', tone: 'watch' },
  { id: 'assignment-3', kind: 'assignment', title: 'Ethan Brooks', detail: 'AP Chemistry · New registration', meta: 'Since Jun 7', action: 'Assign tutor', tone: 'routine' },
  { id: 'payment-2', kind: 'payment', title: 'Chen Household', detail: 'Leo Chen · Payment retry needed', meta: '$210.00 · Jun 5', action: 'Review payment', tone: 'routine' },
];

const students = [
  ['Marcus Johnson', 'Algebra II, Physics', '10th', 'Active'],
  ['Priya Patel', 'SAT Prep', '11th', 'Active'],
  ['Ethan Brooks', 'AP Chemistry', '12th', 'Pending'],
  ['Ava Williams', 'Pre-Calculus', '9th', 'Active'],
  ['Noah Kim', 'English, History', '8th', 'Onboarding'],
  ['Sofia Martinez', 'Biology, Spanish', '10th', 'Active'],
];

function IconFor({ kind }: { kind: QueueItem['kind'] }) {
  if (kind === 'payment') return <CreditCard size={17} />;
  if (kind === 'capacity') return <CalendarDays size={17} />;
  return <GraduationCap size={17} />;
}

export function UnifiedPriorityQueue() {
  const [collapsed, setCollapsed] = useState(false);
  const [queue, setQueue] = useState(initialQueue);
  const [notice, setNotice] = useState('');

  const complete = (item: QueueItem) => {
    setQueue((current) => current.filter((entry) => entry.id !== item.id));
    setNotice(`${item.title} moved out of your priority queue.`);
    window.setTimeout(() => setNotice(''), 2600);
  };

  return (
    <div className={`unified-root ${collapsed ? 'is-collapsed' : ''}`}>
      <style>{`
        .unified-root { --u-ink:#192b3a; --u-navy:#102b42; --u-muted:#71808a; --u-canvas:#f3f6f4; --u-paper:#fff; --u-line:#dce5e1; --u-teal:#19796e; --u-teal-soft:#e3f2ee; --u-amber:#a56d19; --u-amber-soft:#fff2d7; --u-red:#a64d45; --u-red-soft:#fbe9e6; min-height:100vh; background:var(--u-canvas); color:var(--u-ink); font:13px/1.4 "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
        .unified-root * { box-sizing:border-box; } .unified-root button { font:inherit; }
        .u-shell { min-height:100vh; display:grid; grid-template-columns:232px minmax(0,1fr); transition:grid-template-columns .2s ease; }
        .is-collapsed .u-shell { grid-template-columns:72px minmax(0,1fr); }
        .u-side { background:var(--u-navy); color:#d6e1e6; padding:17px 10px; display:flex; flex-direction:column; gap:26px; }
        .u-brand { display:flex; align-items:center; gap:10px; border:0; background:none; color:white; padding:0 7px; cursor:pointer; text-align:left; min-height:40px; }
        .u-logo { width:38px;height:38px;display:grid;place-items:center;flex:none;background:#e2b34c;color:var(--u-navy);font:700 22px Georgia,serif;border-radius:7px; }
        .u-wordmark { font:700 12px/1.15 Georgia,serif; white-space:nowrap; } .u-brand:focus-visible,.u-nav button:focus-visible,.u-action:focus-visible,.u-quiet:focus-visible { outline:2px solid #f4c85b; outline-offset:2px; }
        .u-nav { display:grid; gap:4px; } .u-nav button { border:0;background:transparent;color:#b9c9d1;display:flex;align-items:center;gap:12px;padding:11px 10px;border-radius:7px;cursor:pointer;text-align:left; }
        .u-nav button:hover,.u-nav button.active { color:white;background:#1c425a; } .u-nav button.active { box-shadow:inset 3px 0 #e2b34c; } .u-nav svg { color:#d0a13d; flex:none; } .u-side-foot { margin-top:auto;border-top:1px solid #315064;padding-top:14px;display:grid;gap:14px; }
        .u-side-tools { display:flex;gap:6px; } .u-side-tools button { flex:1;display:flex;justify-content:center;align-items:center;gap:6px;color:#b9c9d1;background:transparent;border:0;padding:7px;cursor:pointer; } .u-side-tools button:hover { color:white; }
        .u-user { display:flex;gap:9px;align-items:center; } .u-avatar { width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#28536b;color:white;font-weight:700; } .u-user small,.u-user strong { display:block; } .u-user small { color:#9eb2bd;font-size:11px; }
        .u-main { min-width:0; padding:28px clamp(22px,4vw,58px) 46px; max-width:1500px; width:100%; margin:auto; } .u-top { display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px; }
        .u-kicker { color:var(--u-teal);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase; } .u-title { margin:5px 0 4px;font:700 clamp(27px,3vw,38px)/1.1 Georgia,serif;letter-spacing:-.035em;color:var(--u-navy); } .u-sub { margin:0;color:var(--u-muted); }
        .u-actions { display:flex;gap:9px; } .u-quiet,.u-primary { border-radius:6px;padding:10px 14px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:7px; } .u-quiet { background:white;border:1px solid var(--u-line);color:var(--u-navy); } .u-primary { border:1px solid var(--u-navy);background:var(--u-navy);color:white; }
        .u-summary { display:grid;grid-template-columns:1.3fr repeat(3,1fr);gap:10px;margin-bottom:18px; } .u-stat { background:white;border:1px solid var(--u-line);padding:15px 17px;border-radius:7px; } .u-stat:first-child { background:#e5f2ee;border-color:#b9ddd3; } .u-stat strong { display:block;font:700 28px/1 Georgia,serif;color:var(--u-navy); } .u-stat span { color:var(--u-muted);font-size:12px; } .u-stat:first-child span { color:var(--u-teal);font-weight:700; }
        .u-queue { background:white;border:1px solid var(--u-line);border-radius:8px;overflow:hidden; } .u-queue-head { display:flex;justify-content:space-between;align-items:center;padding:18px 20px 14px;border-bottom:1px solid var(--u-line); } .u-queue-head h2,.u-support h2 { margin:0;font:700 20px Georgia,serif;color:var(--u-navy); } .u-queue-head p { margin:4px 0 0;color:var(--u-muted);font-size:12px; } .u-count { display:inline-grid;place-items:center;min-width:26px;height:26px;border-radius:50%;background:var(--u-red-soft);color:var(--u-red);font-weight:800;margin-right:8px; }
        .u-row { display:grid;grid-template-columns:34px minmax(180px,1.2fr) minmax(180px,1.5fr) minmax(130px,1fr) max-content;gap:15px;align-items:center;padding:14px 20px;border-bottom:1px solid #edf1ef; } .u-row:last-child { border:0; } .u-row:hover { background:#f8fbfa; } .u-marker { width:28px;height:28px;border-radius:7px;display:grid;place-items:center; } .u-marker.urgent { background:var(--u-red-soft);color:var(--u-red); } .u-marker.watch { background:var(--u-amber-soft);color:var(--u-amber); } .u-marker.routine { background:var(--u-teal-soft);color:var(--u-teal); } .u-row strong { display:block;color:var(--u-ink); } .u-row small { display:block;color:var(--u-muted);font-size:11px;margin-top:3px; } .u-status { display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em; } .u-status i { width:7px;height:7px;border-radius:50%;background:currentColor; } .u-status.urgent { color:var(--u-red); } .u-status.watch { color:var(--u-amber); } .u-status.routine { color:var(--u-teal); } .u-action { border:0;background:transparent;color:var(--u-teal);font-weight:800;cursor:pointer;white-space:nowrap;padding:8px 0; } .u-action:hover { color:var(--u-navy); }
        .u-lower { display:grid;grid-template-columns:1fr 1.6fr;gap:14px;margin-top:14px; } .u-support { background:white;border:1px solid var(--u-line);border-radius:8px;padding:18px 20px; } .u-support h2 { font-size:17px;margin-bottom:14px; } .u-capacity { display:flex;justify-content:space-between;align-items:center;margin-bottom:10px; } .u-capacity strong { font:700 26px Georgia,serif;color:var(--u-navy); } .u-bar { height:9px;background:#e9efec;border-radius:10px;overflow:hidden;margin:10px 0 15px; } .u-bar span { display:block;width:80%;height:100%;background:var(--u-teal);border-radius:10px; } .u-mini { display:flex;justify-content:space-between;color:var(--u-muted);font-size:11px; }
        .u-students { max-height:252px;overflow:auto; } .u-student-head,.u-student { display:grid;grid-template-columns:1.3fr 1.3fr 70px 88px;gap:10px;align-items:center; } .u-student-head { color:var(--u-muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--u-line);padding-bottom:9px; } .u-student { padding:10px 0;border-bottom:1px solid #edf1ef;font-size:12px; } .u-student:last-child { border:0; } .u-student span:nth-child(2) { color:var(--u-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; } .u-pill { justify-self:start;border-radius:20px;padding:4px 7px;font-size:10px;font-weight:800;background:var(--u-teal-soft);color:var(--u-teal); } .u-pill.pending { background:var(--u-amber-soft);color:var(--u-amber); } .u-pill.onboarding { background:#e8edf7;color:#4c638b; }
        .u-toast { position:fixed;right:22px;bottom:22px;background:var(--u-navy);color:white;padding:12px 15px;border-radius:6px;box-shadow:0 8px 25px #102b4233;display:flex;gap:9px;align-items:center; } .is-collapsed .u-wordmark,.is-collapsed .u-nav span,.is-collapsed .u-side-tools span,.is-collapsed .u-user > div:last-child { display:none; } .is-collapsed .u-brand { justify-content:center;padding:0; } .is-collapsed .u-nav button { justify-content:center; } .is-collapsed .u-side-tools { display:block; } .is-collapsed .u-side-tools button { width:100%;margin-bottom:6px; } 
        @media (max-width:900px) { .u-shell,.is-collapsed .u-shell { grid-template-columns:72px minmax(0,1fr); } .u-wordmark,.u-nav span,.u-side-tools span,.u-user > div:last-child { display:none; } .u-brand { justify-content:center;padding:0; } .u-nav button { justify-content:center; } .u-side-tools { display:block; } .u-side-tools button { width:100%;margin-bottom:6px; } .u-summary { grid-template-columns:repeat(4,1fr); } .u-lower { grid-template-columns:1fr; } }
        @media (max-width:650px) { .u-main { padding:20px 14px 35px; } .u-top { align-items:flex-start;flex-direction:column; } .u-actions { width:100%; } .u-actions button { flex:1; } .u-summary { grid-template-columns:repeat(2,1fr); } .u-row { grid-template-columns:30px minmax(0,1fr) max-content;gap:10px;padding:13px 12px; } .u-row > div:nth-child(3),.u-row > div:nth-child(4) { display:none; } .u-queue-head { padding:15px 12px; } }
      `}</style>
      <div className="u-shell">
        <aside className="u-side">
          <button className="u-brand" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Reopen navigation' : 'Collapse navigation'}>
            <span className="u-logo">P</span><span className="u-wordmark">Professional<br />Tutoring, LLC</span>
          </button>
          <nav className="u-nav" aria-label="Staff navigation">
            {nav.map(([label, NavIcon]) => <button key={label} className={label === 'Dashboard' ? 'active' : ''} onClick={() => setNotice(`${label} is available in the staff workspace.`)}><NavIcon size={18} /><span>{label}</span></button>)}
          </nav>
          <div className="u-side-foot">
            <div className="u-side-tools"><button onClick={() => setNotice('Search is ready for students and families.')}><Search size={15} /><span>Search</span></button><button onClick={() => setNotice('You have 3 operational alerts.')}><Bell size={15} /><span>Alerts</span></button></div>
            <div className="u-user"><span className="u-avatar">J</span><div><strong>Jordan Rivera</strong><small>Staff</small></div></div>
          </div>
        </aside>
        <main className="u-main">
          <header className="u-top"><div><div className="u-kicker">Monday, June 9 · Daily operations</div><h1 className="u-title">Good morning, Jordan.</h1><p className="u-sub">Start with the work that can move a student forward today.</p></div><div className="u-actions"><button className="u-quiet" onClick={() => setNotice('Student creation opened.')}><Plus size={15} /> Add student</button><button className="u-primary" onClick={() => setNotice('Create menu opened.')}><Plus size={15} /> Create</button></div></header>
          <section className="u-summary" aria-label="Operational summary"><div className="u-stat"><strong>{queue.length}</strong><span>items needing a decision</span></div><div className="u-stat"><strong>4</strong><span>families onboarding</span></div><div className="u-stat"><strong>23</strong><span>sessions this week</span></div><div className="u-stat"><strong>7</strong><span>open tutor seats</span></div></section>
          <section className="u-queue" aria-labelledby="priority-title"><div className="u-queue-head"><div><h2 id="priority-title"><span className="u-count">{queue.length}</span>Priority queue</h2><p>Ranked by impact on today's tutoring operations.</p></div><button className="u-quiet" onClick={() => setNotice('Queue filters opened.')}><Menu size={15} /> Filter</button></div>{queue.length === 0 ? <div style={{padding:32,textAlign:'center',color:'var(--u-muted)'}}><Check size={24} color="var(--u-teal)" /><p>Everything urgent is cleared for now.</p></div> : queue.map((item) => <div className="u-row" key={item.id}><span className={`u-marker ${item.tone}`}><IconFor kind={item.kind} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><div><strong className={`u-status ${item.tone}`}><i />{item.tone === 'urgent' ? 'Needs action' : item.tone === 'watch' ? 'Watch today' : 'Plan next'}</strong><small>{item.meta}</small></div><div><small>{item.kind === 'payment' ? 'Payment' : item.kind === 'capacity' ? 'Capacity' : 'Assignment'}</small></div><button className="u-action" onClick={() => complete(item)}>{item.action} <ChevronRight size={14} /></button></div>)}</section>
          <div className="u-lower"><section className="u-support"><h2>Capacity signal</h2><div className="u-capacity"><div><strong>12 / 15</strong><div style={{color:'var(--u-muted)',fontSize:12}}>sessions booked Monday</div></div><span className="u-pill">3 open</span></div><div className="u-bar"><span /></div><div className="u-mini"><span>Sun 9 / 15</span><span>Mon 12 / 15</span><span>Thu 10 / 15</span></div><button className="u-action" onClick={() => setNotice('Schedule opened.')}>Open full schedule <ChevronRight size={14} /></button></section><section className="u-support"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2>Recent students</h2><button className="u-action" onClick={() => setNotice('Student directory opened.')}>View all <ChevronRight size={14} /></button></div><div className="u-students"><div className="u-student-head"><span>Name</span><span>Subjects</span><span>Grade</span><span>Status</span></div>{students.map(([name, subjects, grade, status]) => <div className="u-student" key={name}><strong>{name}</strong><span>{subjects}</span><span>{grade}</span><span className={`u-pill ${status.toLowerCase()}`}>{status}</span></div>)}</div></section></div>
        </main>
      </div>
      {notice && <div className="u-toast"><Check size={16} />{notice}<button onClick={() => setNotice('')} style={{ border: 0, background: 'none', color: 'white', cursor: 'pointer' }} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}