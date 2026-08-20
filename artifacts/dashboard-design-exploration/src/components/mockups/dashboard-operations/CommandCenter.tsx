import './_group.css';
import {
  Activity,
  AlertCircle,
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';

type Urgency = 'assignment' | 'payment' | 'capacity';
type QueueItem = { id: string; urgency: Urgency; name: string; detail: string; meta: string; action: string };

const queue: QueueItem[] = [
  { id: 'q1', urgency: 'assignment', name: 'Marcus Johnson', detail: 'New registration · Algebra II', meta: 'Due today', action: 'Assign tutor' },
  { id: 'q2', urgency: 'assignment', name: 'Priya Patel', detail: 'SAT Prep · preferred time not booked', meta: 'Waiting 2d', action: 'Resolve time' },
  { id: 'q3', urgency: 'payment', name: 'Williams Family', detail: 'Ava Williams · invoice #1048', meta: '$420.00 · Jun 6', action: 'Review payment' },
  { id: 'q4', urgency: 'capacity', name: 'Monday schedule', detail: '12 of 15 sessions booked', meta: '80% utilized', action: 'Open schedule' },
];

const students = [
  ['Marcus Johnson', 'Algebra II, Physics', '10th', 'Active', 'Jun 8'],
  ['Priya Patel', 'SAT Prep', '11th', 'Active', 'Jun 7'],
  ['Ethan Brooks', 'AP Chemistry', '12th', 'Pending', 'Jun 7'],
  ['Ava Williams', 'Pre-Calculus', '9th', 'Active', 'Jun 5'],
  ['Noah Kim', 'English, History', '8th', 'Onboarding', 'Jun 4'],
  ['Sofia Martinez', 'Biology, Spanish', '10th', 'Active', 'Jun 3'],
];

const nav = [
  [LayoutDashboard, 'Dashboard'], [Users, 'Families'], [UserCircle, 'Guardians'],
  [GraduationCap, 'Students'], [BookOpen, 'Tutors'], [Calendar, 'Sessions'],
  [CreditCard, 'Billing'], [BarChart2, 'Reports'], [Settings, 'Settings'],
] as const;

const urgencyCopy: Record<Urgency, { label: string; color: string }> = {
  assignment: { label: 'ASSIGNMENT', color: '#d4774b' },
  payment: { label: 'PAYMENT', color: '#a75d75' },
  capacity: { label: 'CAPACITY', color: '#3e7b76' },
};

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`cc-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <button className="cc-brand" onClick={onToggle} aria-label={collapsed ? 'Reopen navigation' : 'Collapse navigation'}>
        <span className="cc-logo">P</span>
        {!collapsed && <span className="cc-wordmark">professional<br />tutoring <i>LLC</i></span>}
      </button>
      <nav aria-label="Staff navigation">
        {nav.map(([Icon, label], index) => (
          <button key={label} className={`cc-nav-item ${index === 0 ? 'active' : ''}`} title={label}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </nav>
      {!collapsed && <div className="cc-sidebar-bottom">
        <button className="cc-nav-item"><Search size={17} /><span>Search</span></button>
        <button className="cc-nav-item"><Bell size={17} /><span>Alerts <b className="cc-alert-dot">3</b></span></button>
        <div className="cc-profile"><span className="cc-avatar">J</span><span><strong>Jordan Rivera</strong><small>Staff operator</small></span></div>
      </div>}
    </aside>
  );
}

function StatusBar() {
  return (
    <section className="cc-status-bar" aria-label="Operational status">
      <div className="cc-status-lead"><span className="cc-live-dot" /> <strong>OPERATIONS LIVE</strong><span>Monday, June 9 · 9:42 AM</span></div>
      <div className="cc-status-signals">
        <span><ShieldCheck size={15} /> All systems normal</span>
        <span><Activity size={15} /> 23 sessions this week</span>
        <span className="cc-signal-warn"><AlertCircle size={15} /> 3 payment issues</span>
      </div>
    </section>
  );
}

function PriorityQueue() {
  const [resolved, setResolved] = useState<string[]>([]);
  return (
    <section className="cc-queue cc-surface">
      <header className="cc-section-head">
        <div><span className="cc-kicker">CONTROL SURFACE / PRIORITY WORK</span><h2><b>{queue.length - resolved.length}</b> items need a decision</h2></div>
        <button className="cc-quiet-button">View all queue <ChevronRight size={15} /></button>
      </header>
      <div className="cc-queue-list">
        {queue.map((item) => resolved.includes(item.id) ? null : (
          <article className={`cc-queue-row ${item.urgency}`} key={item.id}>
            <span className="cc-urgency" style={{ color: urgencyCopy[item.urgency].color }}><i />{urgencyCopy[item.urgency].label}</span>
            <div className="cc-queue-person"><strong>{item.name}</strong><span>{item.detail}</span></div>
            <span className="cc-queue-meta">{item.meta}</span>
            <button className="cc-row-action" onClick={() => setResolved((items) => [...items, item.id])}>{item.action}<ChevronRight size={14} /></button>
          </article>
        ))}
        {resolved.length === queue.length && <div className="cc-clear"><CheckCircle2 size={20} /> Priority queue is clear.</div>}
      </div>
    </section>
  );
}

function CapacitySignal() {
  const days = [['SUN 08', 60, '9 / 15'], ['MON 09', 80, '12 / 15'], ['TUE 10', 47, '7 / 15'], ['WED 11', 33, '5 / 15'], ['THU 12', 67, '10 / 15']];
  return <section className="cc-surface cc-signal-card"><header className="cc-section-head"><div><span className="cc-kicker">CAPACITY PULSE</span><h3>Week at a glance</h3></div><button className="cc-icon-button" aria-label="Open schedule"><Calendar size={16} /></button></header><div className="cc-capacity-chart">{days.map(([day, width, count]) => <div className="cc-capacity-line" key={day as string}><span>{day}</span><div><i style={{ width: `${width}%` }} /></div><b>{count}</b></div>)}</div><p className="cc-callout"><span /> Monday is nearing capacity — 3 seats remain</p></section>;
}

function BillingSignal() {
  return <section className="cc-surface cc-signal-card"><header className="cc-section-head"><div><span className="cc-kicker">CASH CONTROL</span><h3><b className="cc-inline-count">3</b> payment issues</h3></div><button className="cc-quiet-button">Open billing <ChevronRight size={15} /></button></header><div className="cc-billing-total"><strong>$945.00</strong><span>outstanding across 3 families</span></div><div className="cc-mini-list"><div><span className="cc-mini-avatar">W</span><strong>Williams Family</strong><b>$420.00</b></div><div><span className="cc-mini-avatar rose">C</span><strong>Chen Household</strong><b>$210.00</b></div><div><span className="cc-mini-avatar gold">M</span><strong>Martinez Family</strong><b>$315.00</b></div></div></section>;
}

function Students() {
  return <section className="cc-surface cc-students"><header className="cc-section-head"><div><span className="cc-kicker">RECENT ACTIVITY</span><h3><b className="cc-inline-count navy">6</b> students</h3></div><button className="cc-quiet-button">Directory <ChevronRight size={15} /></button></header><div className="cc-table-wrap"><div className="cc-table-head"><span>Student</span><span>Focus</span><span>Grade</span><span>Status</span><span>Added</span></div>{students.map(([name, focus, grade, status, date]) => <div className="cc-table-row" key={name}><strong>{name}</strong><span>{focus}</span><span>{grade}</span><span className={`cc-pill ${status.toLowerCase()}`}>{status}</span><span>{date}</span></div>)}</div></section>;
}

export function CommandCenter() {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="cc-root"><style>{`
    .cc-root{--cc-ink:#1c2c35;--cc-navy:#173c46;--cc-canvas:#eef1ed;--cc-paper:#fbfcf8;--cc-line:#d8dfda;--cc-muted:#71807f;min-height:100vh;background:var(--cc-canvas);color:var(--cc-ink);font:13px/1.35 'DM Sans',system-ui,sans-serif;display:flex}
    .cc-root *{box-sizing:border-box}.cc-sidebar{background:#173c46;color:#d7e4df;width:232px;min-height:100vh;padding:22px 14px;display:flex;flex-direction:column;transition:width .2s ease;flex-shrink:0}.cc-sidebar.is-collapsed{width:76px}.cc-brand{border:0;background:none;color:inherit;display:flex;align-items:center;gap:10px;padding:0 8px 27px;cursor:pointer;text-align:left}.cc-logo{background:#e5b65c;color:#173c46;width:37px;height:37px;display:grid;place-items:center;font:700 22px Georgia;border-radius:6px;flex-shrink:0}.cc-wordmark{font:700 11px/1.15 Georgia;color:#f7f4e9;letter-spacing:.02em}.cc-wordmark i{font:400 9px Georgia;color:#9db6b2;font-style:normal}.cc-sidebar nav{display:grid;gap:5px}.cc-nav-item{border:0;background:none;color:#adc2be;display:flex;align-items:center;gap:11px;width:100%;padding:10px 11px;border-radius:6px;cursor:pointer;text-align:left;font-weight:600}.cc-nav-item:hover,.cc-nav-item.active{background:#285761;color:#fff}.cc-nav-item.active{box-shadow:inset 3px 0 #e5b65c}.cc-nav-item svg{color:#e5b65c;flex-shrink:0}.cc-sidebar.is-collapsed .cc-nav-item{justify-content:center;padding:11px}.cc-sidebar.is-collapsed .cc-nav-item span{display:none}.cc-sidebar-bottom{margin-top:auto;display:grid;gap:6px;border-top:1px solid #37606a;padding-top:14px}.cc-alert-dot{background:#d4774b;color:#fff;border-radius:99px;font-size:10px;padding:2px 6px;margin-left:auto}.cc-profile{display:flex;gap:9px;align-items:center;border-top:1px solid #37606a;padding:14px 9px 0;margin-top:8px}.cc-avatar,.cc-mini-avatar{width:29px;height:29px;border-radius:50%;background:#416c71;color:#f7f4e9;display:grid;place-items:center;font-weight:800}.cc-profile strong,.cc-profile small{display:block}.cc-profile strong{font-size:12px;color:#f5f8f4}.cc-profile small{color:#91aaa6;font-size:11px;margin-top:2px}
    .cc-main{min-width:0;flex:1;padding:22px 30px 40px;max-width:1500px;margin:auto}.cc-status-bar{height:44px;background:#e4ebe5;border:1px solid #d1ddd6;border-radius:7px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin-bottom:18px;color:#58706c;font-size:11px}.cc-status-lead,.cc-status-signals{display:flex;align-items:center;gap:10px}.cc-status-lead strong{font-size:10px;letter-spacing:.1em;color:#28665b}.cc-status-signals{gap:18px}.cc-status-signals span{display:flex;align-items:center;gap:5px}.cc-signal-warn{color:#a75d75}.cc-live-dot{width:7px;height:7px;background:#3e987f;border-radius:50%;box-shadow:0 0 0 4px #c9e1d6}.cc-hero{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px}.cc-hero h1{font:700 31px/1.05 Georgia,serif;color:var(--cc-navy);margin:5px 0 5px;letter-spacing:-.035em}.cc-hero p{margin:0;color:var(--cc-muted)}.cc-kicker{display:block;color:#b17928;font-size:10px;font-weight:800;letter-spacing:.13em}.cc-actions{display:flex;gap:8px}.cc-action{border:1px solid var(--cc-line);background:var(--cc-paper);padding:9px 13px;border-radius:5px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px;cursor:pointer}.cc-action.primary{background:var(--cc-navy);color:white;border-color:var(--cc-navy)}.cc-surface{background:var(--cc-paper);border:1px solid var(--cc-line);border-radius:7px;box-shadow:0 3px 10px #3855500b}.cc-queue{border-top:4px solid #b17928;margin-bottom:16px}.cc-section-head{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px 14px;gap:12px}.cc-section-head h2,.cc-section-head h3{margin:4px 0 0;color:var(--cc-navy);font:700 19px/1.1 Georgia,serif}.cc-section-head h2 b{font-family:'DM Sans',sans-serif;font-size:22px;color:#b17928}.cc-section-head h3{font-size:17px}.cc-quiet-button,.cc-icon-button{border:0;background:none;color:#477c7e;font-weight:800;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px}.cc-icon-button{border:1px solid var(--cc-line);padding:7px;border-radius:5px}.cc-queue-list{padding:0 20px 9px}.cc-queue-row{min-height:64px;border-top:1px solid #e6ebe7;display:grid;grid-template-columns:108px minmax(180px,1fr) 120px 145px;align-items:center;gap:14px}.cc-urgency{font-size:9px;font-weight:900;letter-spacing:.1em;display:flex;align-items:center;gap:7px}.cc-urgency i{width:7px;height:7px;border-radius:50%;background:currentColor}.cc-queue-person strong,.cc-queue-person span{display:block}.cc-queue-person strong{font-size:13px}.cc-queue-person span,.cc-queue-meta{color:var(--cc-muted);font-size:11px;margin-top:3px}.cc-queue-meta{text-align:right}.cc-row-action{border:1px solid #cfdad3;background:#f5f7f3;color:var(--cc-navy);font-weight:800;font-size:11px;padding:8px 10px;border-radius:5px;display:flex;align-items:center;justify-content:space-between;cursor:pointer}.cc-row-action:hover{background:#e7f0ea}.cc-clear{padding:20px;display:flex;align-items:center;gap:8px;color:#3e7b76;font-weight:800}.cc-support-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-bottom:16px}.cc-signal-card{min-height:248px}.cc-capacity-chart{padding:0 20px}.cc-capacity-line{display:grid;grid-template-columns:52px 1fr 48px;gap:10px;align-items:center;margin:13px 0;font-size:10px;color:var(--cc-muted);font-weight:800}.cc-capacity-line div{height:8px;background:#e7ece7;border-radius:9px;overflow:hidden}.cc-capacity-line i{display:block;height:100%;background:#4d8a82;border-radius:9px}.cc-capacity-line b{text-align:right;color:var(--cc-ink);font-size:11px}.cc-callout{border-top:1px solid var(--cc-line);margin:12px 20px 0;padding:12px 0 0;color:#926c2d;font-size:11px;display:flex;gap:8px;align-items:center}.cc-callout span{width:7px;height:7px;background:#d8a14b;border-radius:50%}.cc-inline-count{background:#f7ecd1;color:#976c22;border-radius:4px;padding:3px 7px;font:700 12px 'DM Sans',sans-serif;vertical-align:2px;margin-right:6px}.cc-inline-count.navy{background:#dcebed;color:#28616b}.cc-billing-total{padding:0 20px 14px;border-bottom:1px solid var(--cc-line)}.cc-billing-total strong{display:block;font:700 27px Georgia,serif;color:var(--cc-navy)}.cc-billing-total span{color:var(--cc-muted);font-size:11px}.cc-mini-list{padding:4px 20px}.cc-mini-list div{display:grid;grid-template-columns:25px 1fr auto;gap:9px;align-items:center;border-bottom:1px solid #edf0ed;padding:9px 0;font-size:11px}.cc-mini-list div:last-child{border:0}.cc-mini-avatar{width:24px;height:24px;font-size:10px;background:#dcebed;color:#28616b}.cc-mini-avatar.rose{background:#f5e3e8;color:#96516b}.cc-mini-avatar.gold{background:#f7ecd1;color:#916b27}.cc-mini-list b{font-size:11px}.cc-students{overflow:hidden}.cc-table-wrap{overflow:auto;max-height:293px;padding:0 20px 8px}.cc-table-head,.cc-table-row{display:grid;grid-template-columns:1.3fr 1.4fr .5fr .75fr .5fr;gap:12px;align-items:center;min-width:650px}.cc-table-head{color:var(--cc-muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;border-bottom:2px solid var(--cc-line);padding:0 0 9px}.cc-table-row{min-height:45px;border-bottom:1px solid #e9eeea;font-size:11px}.cc-table-row strong{font-size:12px}.cc-pill{justify-self:start;padding:4px 7px;border-radius:4px;font-size:9px;font-weight:900}.cc-pill.active{background:#e0f0e9;color:#327565}.cc-pill.pending{background:#f7ecd1;color:#916b27}.cc-pill.onboarding{background:#dcebed;color:#28616b}.cc-root button:focus-visible{outline:3px solid #d8a14b;outline-offset:2px}
    @media(max-width:900px){.cc-sidebar{width:76px}.cc-sidebar .cc-wordmark,.cc-sidebar .cc-nav-item span,.cc-sidebar-bottom{display:none}.cc-sidebar .cc-nav-item{justify-content:center}.cc-main{padding:16px}.cc-status-signals span:nth-child(2){display:none}.cc-support-grid{grid-template-columns:1fr}.cc-queue-row{grid-template-columns:100px 1fr 120px}.cc-queue-meta{display:none}}
  `}</style><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /><main className="cc-main"><StatusBar /><header className="cc-hero"><div><span className="cc-kicker">STAFF COMMAND CENTER</span><h1>Good morning, Jordan.</h1><p>Here’s the operating picture for your tutoring team.</p></div><div className="cc-actions"><button className="cc-action"><UserPlus size={15} /> Add student</button><button className="cc-action primary"><Plus size={15} /> Create</button></div></header><PriorityQueue /><div className="cc-support-grid"><CapacitySignal /><BillingSignal /></div><Students /></main></div>;
}