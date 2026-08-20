import './_group.css';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  BarChart2,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  Plus,
  UserPlus,
} from 'lucide-react';

// ─── Static data stubs (replaces DB + auth) ──────────────────────────────────

const STAFF_NAME = 'Jordan';

const DATE_LABEL = 'Monday, June 9';
const GREETING = 'Good morning';

const METRICS = {
  onboardingFamilies: 4,
  weekSessions: 23,
  tutorOpenings: 7,
  billingExceptions: 3,
};

type AssignmentQueueItem = {
  id: string;
  studentName: string;
  reason: string;
  subjectName: string;
  schedulingPath: string;
};

const ASSIGNMENT_QUEUE: AssignmentQueueItem[] = [
  {
    id: '1',
    studentName: 'Marcus Johnson',
    reason: 'New registration',
    subjectName: 'Algebra II',
    schedulingPath: 'staff_assigns',
  },
  {
    id: '2',
    studentName: 'Priya Patel',
    reason: 'Tutor unavailable',
    subjectName: 'SAT Prep',
    schedulingPath: 'family_selected',
  },
  {
    id: '3',
    studentName: 'Ethan Brooks',
    reason: 'New registration',
    subjectName: 'AP Chemistry',
    schedulingPath: 'staff_assigns',
  },
];

type WeekBar = {
  day: string;
  width: number;
  booked: number;
  capacity: number;
  count: string;
};

const WEEK_BARS: WeekBar[] = [
  { day: 'Sunday · Jun 8',    width: 60, booked: 9,  capacity: 15, count: '9 / 15' },
  { day: 'Monday · Jun 9',    width: 80, booked: 12, capacity: 15, count: '12 / 15' },
  { day: 'Tuesday · Jun 10',  width: 47, booked: 7,  capacity: 15, count: '7 / 15' },
  { day: 'Wednesday · Jun 11',width: 33, booked: 5,  capacity: 15, count: '5 / 15' },
  { day: 'Thursday · Jun 12', width: 67, booked: 10, capacity: 15, count: '10 / 15' },
];

type PaymentQueueItem = {
  id: string;
  name: string;
  studentName: string;
  amountLabel: string;
  dateLabel: string;
};

const PAYMENT_QUEUE: PaymentQueueItem[] = [
  {
    id: 'p1',
    name: 'Williams Family',
    studentName: 'Ava Williams',
    amountLabel: '$420.00',
    dateLabel: 'Jun 6',
  },
  {
    id: 'p2',
    name: 'Chen Household',
    studentName: 'Leo Chen',
    amountLabel: '$210.00',
    dateLabel: 'Jun 5',
  },
  {
    id: 'p3',
    name: 'Martinez Family',
    studentName: 'Sofia Martinez',
    amountLabel: '$315.00',
    dateLabel: 'Jun 3',
  },
];

type StudentRow = {
  id: string;
  name: string;
  household: string;
  subjects: string;
  grade: string;
  school: string;
  statusLabel: string;
  statusTone: string;
  created: string;
};

const RECENT_STUDENTS: StudentRow[] = [
  {
    id: 's1',
    name: 'Marcus Johnson',
    household: 'Johnson Family',
    subjects: 'Algebra II, Physics',
    grade: '10th',
    school: 'Westfield High',
    statusLabel: 'Active',
    statusTone: 'mint',
    created: 'Jun 8',
  },
  {
    id: 's2',
    name: 'Priya Patel',
    household: 'Patel Household',
    subjects: 'SAT Prep',
    grade: '11th',
    school: 'Lincoln Academy',
    statusLabel: 'Active',
    statusTone: 'mint',
    created: 'Jun 7',
  },
  {
    id: 's3',
    name: 'Ethan Brooks',
    household: 'Brooks Family',
    subjects: 'AP Chemistry',
    grade: '12th',
    school: 'Riverside High',
    statusLabel: 'Pending',
    statusTone: 'gold',
    created: 'Jun 7',
  },
  {
    id: 's4',
    name: 'Ava Williams',
    household: 'Williams Family',
    subjects: 'Pre-Calculus',
    grade: '9th',
    school: 'Summit Middle',
    statusLabel: 'Active',
    statusTone: 'mint',
    created: 'Jun 5',
  },
  {
    id: 's5',
    name: 'Noah Kim',
    household: 'Kim Household',
    subjects: 'English, History',
    grade: '8th',
    school: 'Oak Park Middle',
    statusLabel: 'Onboarding',
    statusTone: 'blue',
    created: 'Jun 4',
  },
  {
    id: 's6',
    name: 'Sofia Martinez',
    household: 'Martinez Family',
    subjects: 'Biology, Spanish',
    grade: '10th',
    school: 'Westfield High',
    statusLabel: 'Active',
    statusTone: 'mint',
    created: 'Jun 3',
  },
];

// ─── Nav items (from STAFF_NAV constant) ─────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STAFF_NAV: NavItem[] = [
  { href: '/staff',          label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/staff/families', label: 'Families',  Icon: Users },
  { href: '/staff/guardians',label: 'Guardians', Icon: UserCircle },
  { href: '/staff/students', label: 'Students',  Icon: GraduationCap },
  { href: '/staff/tutors',   label: 'Tutors',    Icon: BookOpen },
  { href: '/staff/sessions', label: 'Sessions',  Icon: Calendar },
  { href: '/staff/billing',  label: 'Billing',   Icon: CreditCard },
  { href: '/staff/reports',  label: 'Reports',   Icon: BarChart2 },
  { href: '/staff/settings', label: 'Settings',  Icon: Settings },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-lockup">
          {/* Logo placeholder — "P" letter mark in navy */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              background: '#d8a840',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize: 22,
              color: '#010345',
            }}
          >
            P
          </div>
          <span className="brand-copy" style={{ paddingLeft: 6 }}>
            <strong className="brand-wordmark">
              rofessional
              <br />
              Tutoring, LLC
            </strong>
          </span>
        </div>
        <button type="button" className="nav-collapse-toggle" aria-label="Collapse navigation">
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav links */}
      <nav aria-label="Staff navigation">
        {STAFF_NAV.map((item) => {
          const active = item.href === '/staff';
          return (
            <a
              key={item.href}
              href={item.href}
              className={active ? 'active' : undefined}
              title={item.label}
              aria-label={item.label}
              onClick={(e) => e.preventDefault()}
            >
              <span className="nav-icon">
                <item.Icon size={18} />
              </span>
              <span className="nav-text">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer chrome */}
      <div className="sidebar-footer">
        <div className="sidebar-chrome-actions">
          <button type="button" aria-label="Search" title="Search">
            <span className="chrome-icon"><Search size={15} /></span>
            <span style={{ color: 'var(--chrome-label)', fontSize: 13 }}>Search</span>
          </button>
          <button type="button" aria-label="Notifications" title="Notifications">
            <span className="chrome-icon"><Bell size={15} /></span>
            <span style={{ color: 'var(--chrome-label)', fontSize: 13 }}>Alerts</span>
          </button>
        </div>
        <div className="demo-person">
          <div className="user-avatar-stub">J</div>
          <span className="person-copy">
            <strong title={STAFF_NAME}>{STAFF_NAME} Rivera</strong>
            <small>Staff</small>
          </span>
        </div>
      </div>
    </aside>
  );
}

function HeroPanel() {
  return (
    <section className="hero-panel">
      <div>
        <span className="eyebrow">{DATE_LABEL}</span>
        <h2>
          {GREETING}, {STAFF_NAME}.
        </h2>
      </div>
      {/* Hero actions — stubbed create menu */}
      <div className="hero-panel-actions">
        <button type="button" className="secondary-button" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={14} />
          Add student
        </button>
        <button type="button" className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />
          Create
        </button>
      </div>
    </section>
  );
}

function MetricStrip() {
  const cards = [
    { mark: 'navy', label: 'Families still setting up',   value: METRICS.onboardingFamilies },
    { mark: 'blue', label: 'Sessions this week',          value: METRICS.weekSessions },
    { mark: 'mint', label: 'Open tutor seats',            value: METRICS.tutorOpenings },
    { mark: 'gold', label: 'Payments needing attention',  value: METRICS.billingExceptions },
  ];
  return (
    <section className="metric-grid" aria-label="Dashboard metrics">
      {cards.map((c) => (
        <article key={c.label} className="metric-card">
          <span className={`metric-mark ${c.mark}`} />
          <p>{c.label}</p>
          <strong>{c.value}</strong>
        </article>
      ))}
    </section>
  );
}

function AssignmentQueuePanel() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Needs attention</span>
          <h3 className="staff-section-title dashboard-queue-title">
            <span className="dashboard-count-badge">{ASSIGNMENT_QUEUE.length}</span>
            Tutor assignment
          </h3>
        </div>
        <a href="/staff/tutoring-requests" className="text-button" onClick={(e) => e.preventDefault()}>
          Open queue
        </a>
      </div>
      {ASSIGNMENT_QUEUE.length === 0 ? (
        <p className="dashboard-empty">No tutoring registrations need a tutor assignment.</p>
      ) : (
        <div className="attention-list">
          {ASSIGNMENT_QUEUE.map((item) => (
            <a
              key={item.id}
              href={`/staff/tutoring-requests/${item.id}`}
              className="attention-row"
              onClick={(e) => e.preventDefault()}
            >
              <span className="attention-row-name">
                <strong>{item.studentName}</strong>
                <small>{item.reason}</small>
              </span>
              <span className="attention-row-student">{item.subjectName}</span>
              <span className="attention-row-amount">
                {item.schedulingPath === 'family_selected'
                  ? 'Preferred time — not booked'
                  : 'Choose tutor'}
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function CapacityPanel() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Capacity</span>
          <h3 className="staff-section-title">This week</h3>
        </div>
        <a href="/staff/sessions" className="text-button" onClick={(e) => e.preventDefault()}>
          Open schedule
        </a>
      </div>
      <div className="capacity-bars">
        {WEEK_BARS.map((row) => (
          <a
            key={row.day}
            href="/staff/sessions"
            className="capacity-row"
            onClick={(e) => e.preventDefault()}
          >
            <span>{row.day}</span>
            <div className="bar-track">
              <span style={{ width: `${row.width}%` }} />
            </div>
            <small>{row.count}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function PaymentQueuePanel() {
  const total = METRICS.billingExceptions;
  const shown = PAYMENT_QUEUE.length;
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Priority queue</span>
          <h3 className="staff-section-title dashboard-queue-title">
            <span className="dashboard-count-badge">{total}</span>
            Payment issues
          </h3>
        </div>
        <a href="/staff/sessions?tab=issues" className="text-button" onClick={(e) => e.preventDefault()}>
          Open sessions
        </a>
      </div>
      {total > shown ? (
        <p className="dashboard-preview-note">
          Showing {shown} recent of {total}.
        </p>
      ) : null}
      <div className="attention-list">
        {PAYMENT_QUEUE.map((item) => (
          <a
            key={item.id}
            href="/staff/billing"
            className="attention-row"
            onClick={(e) => e.preventDefault()}
          >
            <span className="attention-row-name">
              <strong>{item.name}</strong>
              <small>{item.dateLabel}</small>
            </span>
            <span className="attention-row-student">{item.studentName || '—'}</span>
            <span className="attention-row-amount">{item.amountLabel}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const withActions = false;
  const colClass = `table-row staff-dir-cols-students${withActions ? '' : ' staff-dir-cols-no-actions'}`;
  const headClass = `table-head staff-dir-cols-students${withActions ? '' : ' staff-dir-cols-no-actions'}`;
  return (
    <div className="table-panel staff-dir-table">
      <div className={headClass}>
        <span>Name</span>
        <span>Household</span>
        <span>Subjects</span>
        <span>Grade</span>
        <span>School</span>
        <span className="staff-dir-col-status">Status</span>
        <span>Created At</span>
      </div>
      {rows.map((row) => (
        <a
          key={row.id}
          href={`/staff/students/${row.id}`}
          className={colClass}
          onClick={(e) => e.preventDefault()}
        >
          <strong>{row.name}</strong>
          <span>{row.household}</span>
          <span>{row.subjects}</span>
          <span>{row.grade}</span>
          <span>{row.school}</span>
          <span className="staff-dir-col-status">
            <span className={`pill ${row.statusTone}`}>{row.statusLabel}</span>
          </span>
          <span>{row.created}</span>
        </a>
      ))}
    </div>
  );
}

function RecentStudentsPanel() {
  return (
    <section className="panel dashboard-recent-students" style={{ marginBottom: 0 }}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Students</span>
          <h3 className="staff-section-title">Recently added</h3>
        </div>
        <a href="/staff/students" className="text-button" onClick={(e) => e.preventDefault()}>
          Open students
        </a>
      </div>
      {RECENT_STUDENTS.length === 0 ? (
        <p className="dashboard-empty">No students yet. Add a student to get started.</p>
      ) : (
        <StudentsTable rows={RECENT_STUDENTS} />
      )}
    </section>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function Current() {
  return (
    <div className="pt-dashboard-root" style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <div className="app-shell">
        <Sidebar />
        <div className="workspace">
          <main className="content">
            <HeroPanel />
            <MetricStrip />
            <AssignmentQueuePanel />
            <div className="staff-equal-cards">
              <CapacityPanel />
              <PaymentQueuePanel />
            </div>
            <RecentStudentsPanel />
          </main>
        </div>
      </div>
    </div>
  );
}
