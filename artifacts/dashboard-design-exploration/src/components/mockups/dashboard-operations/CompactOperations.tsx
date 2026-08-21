import './_group.css';
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

const nav = [
  ['Dashboard', LayoutDashboard],
  ['Families', Users],
  ['Guardians', UserCircle],
  ['Students', GraduationCap],
  ['Tutors', BookOpen],
  ['Sessions', Calendar],
  ['Billing', CreditCard],
  ['Reports', Activity],
  ['Settings', Settings],
] as const;

const assignments = [
  { name: 'Marcus Johnson', subject: 'Algebra II', detail: 'New registration', action: 'Choose tutor', tone: 'amber' },
  { name: 'Priya Patel', subject: 'SAT Prep', detail: 'Tutor unavailable', action: 'Review timing', tone: 'coral' },
  { name: 'Ethan Brooks', subject: 'AP Chemistry', detail: 'New registration', action: 'Choose tutor', tone: 'amber' },
];

const payments = [
  { family: 'Williams Family', student: 'Ava Williams', amount: '$420.00', date: 'Jun 6' },
  { family: 'Chen Household', student: 'Leo Chen', amount: '$210.00', date: 'Jun 5' },
  { family: 'Martinez Family', student: 'Sofia Martinez', amount: '$315.00', date: 'Jun 3' },
];

const students = [
  ['Marcus Johnson', 'Johnson Family', 'Algebra II, Physics', '10th', 'Active'],
  ['Priya Patel', 'Patel Household', 'SAT Prep', '11th', 'Active'],
  ['Ethan Brooks', 'Brooks Family', 'AP Chemistry', '12th', 'Pending'],
  ['Ava Williams', 'Williams Family', 'Pre-Calculus', '9th', 'Active'],
  ['Noah Kim', 'Kim Household', 'English, History', '8th', 'Onboarding'],
  ['Sofia Martinez', 'Martinez Family', 'Biology, Spanish', '10th', 'Active'],
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`compact-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <button className="compact-brand" onClick={collapsed ? onToggle : undefined} aria-label={collapsed ? 'Reopen navigation' : 'Professional Tutoring home'}>
        <span className="compact-mark">P</span>
        {!collapsed && <span className="compact-wordmark">professional<br />tutoring <i>llc</i></span>}
      </button>
      {!collapsed && (
        <>
          <nav className="compact-nav" aria-label="Staff navigation">
            {nav.map(([label, Icon], index) => (
              <a href="#" key={label} className={index === 0 ? 'active' : ''} onClick={(e) => e.preventDefault()}>
                <Icon size={17} /><span>{label}</span>
                {label === 'Billing' && <b>3</b>}
              </a>
            ))}
          </nav>
          <div className="compact-sidebar-bottom">
            <button onClick={() => window.alert('Search is ready for a student, family, or session.')}><Search size={16} /> Search</button>
            <button onClick={() => window.alert('You have 3 payment alerts.')}><Bell size={16} /> Alerts <b>3</b></button>
            <div className="compact-user"><span>J</span><div><strong>Jordan Rivera</strong><small>Staff operations</small></div></div>
            <button className="compact-collapse" onClick={onToggle}><Menu size={16} /> Collapse sidebar</button>
          </div>
        </>
      )}
    </aside>
  );
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="compact-action" onClick={onClick}>{children}<ChevronRight size={14} /></button>;
}

export function CompactOperations() {
  const [collapsed, setCollapsed] = useState(false);
  const [notice, setNotice] = useState('');
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400); };

  return (
    <div className={`compact-root ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="compact-main">
        <header className="compact-header">
          <div><span className="compact-kicker">MONDAY · JUNE 9, 2025</span><h1>Good morning, Jordan.</h1></div>
          <div className="compact-header-actions">
            <button className="compact-secondary" onClick={() => notify('Add student form opened')}><Plus size={15} /> Add student</button>
            <button className="compact-primary" onClick={() => notify('Create menu opened')}><Plus size={15} /> Create</button>
          </div>
        </header>

        <section className="compact-kpis" aria-label="Operating snapshot">
          <div><strong>4</strong><span>families setting up</span><em className="kpi-blue" /></div>
          <div><strong>23</strong><span>sessions this week</span><em className="kpi-teal" /></div>
          <div><strong>7</strong><span>open tutor seats</span><em className="kpi-green" /></div>
          <div><strong>3</strong><span>payment issues</span><em className="kpi-red" /></div>
        </section>

        <section className="compact-priority">
          <div className="priority-head">
            <div><span className="compact-kicker">WORK QUEUE · SORTED BY URGENCY</span><h2>Today’s priorities</h2></div>
            <span className="queue-total">6 open items</span>
          </div>
          <div className="priority-grid">
            <article className="priority-column assignment">
              <div className="priority-title"><span className="priority-icon"><GraduationCap size={17} /></span><h3><b>3</b> Tutor assignment</h3><a href="#" onClick={(e) => e.preventDefault()}>Open queue</a></div>
              {assignments.map((item) => <div className="priority-row" key={item.name}><span className={`urgency-dot ${item.tone}`} /><div><strong>{item.name}</strong><small>{item.detail} · {item.subject}</small></div><ActionButton onClick={() => notify(`${item.action}: ${item.name}`)}>{item.action}</ActionButton></div>)}
            </article>
            <article className="priority-column payments">
              <div className="priority-title"><span className="priority-icon"><CircleDollarSign size={17} /></span><h3><b>3</b> Payment issues</h3><a href="#" onClick={(e) => e.preventDefault()}>Open billing</a></div>
              {payments.map((item) => <div className="priority-row" key={item.family}><span className="urgency-dot red" /><div><strong>{item.family}</strong><small>{item.student} · {item.date}</small></div><ActionButton onClick={() => notify(`Reviewing ${item.amount} for ${item.family}`)}>{item.amount}</ActionButton></div>)}
            </article>
          </div>
        </section>

        <section className="compact-capacity">
          <div className="capacity-heading"><div><span className="compact-kicker">CAPACITY WATCH</span><h2><b>12 / 15</b> Monday sessions booked</h2></div><button className="compact-link" onClick={() => notify('Schedule opened')}>Open schedule <ChevronRight size={15} /></button></div>
          <div className="capacity-track"><span style={{ width: '80%' }} /></div>
          <div className="capacity-days">
            {['Sun 9/15', 'Mon 12/15', 'Tue 7/15', 'Wed 5/15', 'Thu 10/15'].map((day, i) => <span key={day} className={i === 1 ? 'today' : ''}><i style={{ height: `${[60, 80, 47, 33, 67][i]}%` }} />{day}</span>)}
          </div>
          <p><AlertCircle size={14} /> Monday is nearing capacity. 3 seats remain available.</p>
        </section>

        <section className="compact-students">
          <div className="students-heading"><div><span className="compact-kicker">STUDENTS</span><h2><b>6</b> Recently added</h2></div><button className="compact-link" onClick={() => notify('Students directory opened')}>Open students <ChevronRight size={15} /></button></div>
          <div className="student-table-wrap">
            <div className="student-table student-table-head"><span>Name</span><span>Household</span><span>Subjects</span><span>Grade</span><span>Status</span></div>
            {students.map(([name, household, subjects, grade, status]) => <a href="#" className="student-table student-row" key={name} onClick={(e) => e.preventDefault()}><strong>{name}</strong><span>{household}</span><span>{subjects}</span><span>{grade}</span><span className={`status ${status.toLowerCase()}`}>{status}</span></a>)}
          </div>
        </section>
        {notice && <div className="compact-toast"><Check size={15} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}
      </main>
      <style>{`
        .compact-root{--co-ink:#18253b;--co-navy:#102b46;--co-muted:#718097;--co-line:#e3e8ee;--co-paper:#fff;display:flex;min-height:100vh;background:#f3f6f8;color:var(--co-ink);font-family:'DM Sans',ui-sans-serif,sans-serif}.compact-sidebar{width:212px;background:#102b46;color:#c8d3df;flex:none;display:flex;flex-direction:column;padding:18px 12px;transition:width .2s ease}.compact-sidebar.is-collapsed{width:66px}.compact-brand{border:0;background:none;color:#fff;display:flex;align-items:center;gap:10px;text-align:left;padding:0 6px 24px;cursor:pointer}.compact-mark{display:grid;place-items:center;width:36px;height:36px;background:#d5ad58;color:#102b46;border-radius:7px;font:700 21px Georgia,serif;flex:none}.compact-wordmark{font:700 11px/1.1 Georgia,serif;letter-spacing:.01em}.compact-wordmark i{font:400 9px Georgia,serif;color:#d5ad58}.compact-nav{display:grid;gap:3px}.compact-nav a,.compact-sidebar-bottom button{display:flex;align-items:center;gap:10px;min-height:38px;border:0;border-radius:7px;padding:0 10px;color:#b6c3d0;background:none;text-decoration:none;font-size:12px;font-weight:700;cursor:pointer}.compact-nav a:hover,.compact-sidebar-bottom button:hover{background:#1a3c5c;color:#fff}.compact-nav a.active{background:#1a456b;color:#fff;box-shadow:inset 3px 0 #d5ad58}.compact-nav a svg{color:#d5ad58}.compact-nav b,.compact-sidebar-bottom b{margin-left:auto;border-radius:10px;background:#a74942;color:#fff;padding:2px 6px;font-size:10px}.compact-sidebar-bottom{margin-top:auto;display:grid;gap:3px;border-top:1px solid #2c4962;padding-top:12px}.compact-user{display:flex;gap:9px;align-items:center;margin:14px 7px 10px}.compact-user>span{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;background:#315779;color:#fff;font-size:12px;font-weight:800}.compact-user strong,.compact-user small{display:block}.compact-user strong{font-size:11px;color:#fff}.compact-user small{font-size:10px;color:#8fa5ba;margin-top:3px}.compact-collapse{border-top:1px solid #2c4962!important;border-radius:0!important;padding-top:9px!important;margin-top:2px}.compact-main{width:calc(100% - 212px);max-width:1360px;padding:28px 34px 52px;margin:0 auto}.sidebar-collapsed .compact-main{width:calc(100% - 66px)}.compact-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px}.compact-kicker{display:block;color:#ad8140;font-size:10px;letter-spacing:.14em;font-weight:900;margin-bottom:7px}.compact-header h1,.compact-root h2,.compact-root h3{margin:0;color:var(--co-navy);font-family:Georgia,serif}.compact-header h1{font-size:27px;letter-spacing:-.035em}.compact-header-actions{display:flex;gap:8px}.compact-primary,.compact-secondary{display:inline-flex;align-items:center;gap:6px;border-radius:7px;padding:10px 13px;font-size:11px;font-weight:800;cursor:pointer}.compact-primary{background:#102b46;color:#fff;border:1px solid #102b46}.compact-secondary{background:#fff;color:#102b46;border:1px solid var(--co-line)}.compact-kpis{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid var(--co-line);border-radius:10px;margin-bottom:16px}.compact-kpis>div{position:relative;padding:15px 18px;border-right:1px solid var(--co-line);display:flex;align-items:baseline;gap:9px}.compact-kpis>div:last-child{border:0}.compact-kpis strong{font:700 27px Georgia,serif;color:#102b46}.compact-kpis span{font-size:11px;font-weight:700;color:#607087}.compact-kpis em{position:absolute;left:0;bottom:0;height:3px;width:44px}.kpi-blue{background:#587eaa}.kpi-teal{background:#559a87}.kpi-green{background:#74a66d}.kpi-red{background:#ba5f57}.compact-priority,.compact-capacity,.compact-students{background:#fff;border:1px solid var(--co-line);border-radius:10px;margin-bottom:16px}.compact-priority{padding:20px 22px 8px}.priority-head,.capacity-heading,.students-heading{display:flex;justify-content:space-between;align-items:flex-start}.compact-root h2{font-size:20px;letter-spacing:-.025em}.queue-total{font-size:11px;color:#7c8a9b;font-weight:800;padding-top:11px}.priority-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.priority-column{border-top:3px solid #d3a852}.priority-column.payments{border-color:#ba5f57}.priority-title{display:flex;align-items:center;gap:8px;padding:13px 0 3px}.priority-title h3{font:700 13px ui-sans-serif,sans-serif;flex:1;color:#26364c}.priority-title h3 b,.capacity-heading h2 b,.students-heading h2 b{font-family:Georgia,serif;font-size:19px;color:#102b46;margin-right:5px}.priority-title a,.compact-link{font-size:10px;color:#517ea4;font-weight:900;text-decoration:none;background:none;border:0;cursor:pointer;display:inline-flex;align-items:center;gap:3px}.priority-icon{width:27px;height:27px;display:grid;place-items:center;border-radius:7px;background:#fff5db;color:#a77926}.payments .priority-icon{background:#fcede9;color:#b2544b}.priority-row{display:grid;grid-template-columns:8px minmax(0,1fr) max-content;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #edf0f3}.urgency-dot{width:8px;height:8px;border-radius:50%;background:#d5a542}.urgency-dot.coral,.urgency-dot.red{background:#ba5f57}.priority-row strong,.priority-row small{display:block}.priority-row strong{font-size:12px}.priority-row small{font-size:10px;color:#7a8797;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact-action{display:inline-flex;align-items:center;gap:2px;background:#f3f6f8;border:1px solid #e2e8ee;color:#3d6380;border-radius:5px;padding:6px 7px;font-size:10px;font-weight:800;cursor:pointer}.compact-action:hover{background:#e8f0f5}.compact-capacity{padding:17px 22px 15px}.capacity-heading{align-items:center}.capacity-track{height:8px;background:#e7edf0;border-radius:4px;overflow:hidden;margin:15px 0 12px}.capacity-track span{display:block;height:100%;background:#5b86a9;border-radius:4px}.capacity-days{display:flex;justify-content:space-between;align-items:flex-end;height:42px}.capacity-days span{display:flex;flex-direction:column;align-items:center;gap:5px;color:#7b8998;font-size:10px;font-weight:700}.capacity-days i{display:block;width:36px;background:#cadce5;border-radius:3px 3px 0 0}.capacity-days .today{color:#102b46}.capacity-days .today i{background:#5b86a9}.compact-capacity p{display:flex;align-items:center;gap:6px;margin:14px 0 0;padding-top:11px;border-top:1px solid #edf0f3;color:#7d6670;font-size:10px}.compact-capacity p svg{color:#ba5f57}.compact-students{padding:17px 22px 0}.students-heading{align-items:center;margin-bottom:12px}.student-table-wrap{height:267px;overflow-y:auto;border-top:1px solid var(--co-line)}.student-table{display:grid;grid-template-columns:1.25fr 1fr 1.3fr 60px 100px;gap:14px;align-items:center}.student-table-head{position:sticky;top:0;background:#fff;z-index:1;padding:10px 0 8px;text-transform:uppercase;letter-spacing:.08em;font-size:9px;font-weight:900;color:#8a96a4;border-bottom:1px solid var(--co-line)}.student-row{padding:11px 0;border-bottom:1px solid #edf0f3;text-decoration:none;color:var(--co-ink);font-size:11px}.student-row:hover{background:#f5f8fa}.student-row strong{font-size:12px}.student-row span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#66768a}.status{justify-self:start;border-radius:5px;padding:4px 7px;font-size:9px!important;font-weight:900}.status.active{background:#e7f5ef;color:#377a66!important}.status.pending{background:#fff5db;color:#997026!important}.status.onboarding{background:#e8f0f7;color:#47759b!important}.compact-toast{position:fixed;right:24px;bottom:22px;display:flex;align-items:center;gap:8px;background:#102b46;color:#fff;padding:11px 13px;border-radius:7px;box-shadow:0 10px 25px #102b4640;font-size:11px;font-weight:700}.compact-toast svg{color:#86c7a9}.compact-toast button{border:0;background:none;color:#adc0d2;display:grid;place-items:center;cursor:pointer}@media(max-width:900px){.compact-sidebar{width:66px}.compact-sidebar:not(.is-collapsed) .compact-wordmark,.compact-sidebar:not(.is-collapsed) .compact-nav span,.compact-sidebar:not(.is-collapsed) .compact-nav b,.compact-sidebar:not(.is-collapsed) .compact-sidebar-bottom{display:none}.compact-main,.sidebar-collapsed .compact-main{width:calc(100% - 66px);padding:20px}.compact-kpis{grid-template-columns:repeat(2,1fr)}.compact-kpis>div:nth-child(2){border-right:0}.priority-grid{grid-template-columns:1fr}.student-table-wrap{overflow-x:auto}.student-table{min-width:650px}}@media(max-width:620px){.compact-header{display:block}.compact-header-actions{margin-top:14px}.compact-kpis>div{padding:12px}.compact-kpis span{font-size:10px}.compact-priority,.compact-capacity,.compact-students{padding-left:14px;padding-right:14px}.priority-row{grid-template-columns:8px minmax(0,1fr)}.priority-row .compact-action{grid-column:2;justify-self:start}.capacity-heading h2{font-size:16px}}
      `}</style>
    </div>
  );
}