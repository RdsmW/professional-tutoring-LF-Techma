/**
 * Staff Families Directory — page-level mockup.
 *
 * Shows the full staff shell (sidebar + main) with the Families directory:
 * filter toolbar, List table, Cards grid, skeleton loading, and empty state.
 * All content is static; state is wired for the view toggle, search, status,
 * sort, and a demo loading toggle so every state is reviewable.
 */

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Clock,
  CreditCard,
  BarChart2,
  Settings,
  Search,
  Bell,
  MoreVertical,
  List,
  LayoutGrid,
  X,
  Home,
  Receipt,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import {
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
} from '../../components/ui/sidebar-nav';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { cn } from '../../lib/utils';

/* ─────────────────────────── mock data ──────────────────────────── */

type FamilyStatus = 'Pending' | 'Active' | 'Inactive' | 'Archived';

interface Family {
  id: string;
  name: string;
  payer: string | null;
  students: number;
  cardOnFile: boolean;
  autoCharge: boolean;
  status: FamilyStatus;
  createdAt: string; // display string
  canDelete: boolean;
  archived: boolean;
}

const FAMILIES: Family[] = [
  {
    id: '1',
    name: 'Ross Family',
    payer: 'Jennifer Ross',
    students: 2,
    cardOnFile: true,
    autoCharge: true,
    status: 'Active',
    createdAt: 'Aug 10, 2026, 7:59 AM',
    canDelete: false,
    archived: false,
  },
  {
    id: '2',
    name: 'Kim — Park Household',
    payer: 'Chris Park',
    students: 1,
    cardOnFile: true,
    autoCharge: false,
    status: 'Pending',
    createdAt: 'Aug 12, 2026, 11:20 AM',
    canDelete: true,
    archived: false,
  },
  {
    id: '3',
    name: 'Vasquez Family',
    payer: 'Maria Vasquez',
    students: 3,
    cardOnFile: false,
    autoCharge: false,
    status: 'Active',
    createdAt: 'Jul 28, 2026, 3:44 PM',
    canDelete: false,
    archived: false,
  },
  {
    id: '4',
    name: 'Test - test@test.ca',
    payer: null,
    students: 0,
    cardOnFile: false,
    autoCharge: false,
    status: 'Pending',
    createdAt: 'Aug 14, 2026, 9:01 AM',
    canDelete: true,
    archived: false,
  },
  {
    id: '5',
    name: 'Okafor Household',
    payer: 'Danielle Okafor',
    students: 2,
    cardOnFile: true,
    autoCharge: true,
    status: 'Inactive',
    createdAt: 'Jun 15, 2026, 10:30 AM',
    canDelete: false,
    archived: false,
  },
  {
    id: '6',
    name: 'Archived — Laurent',
    payer: 'Marc Laurent',
    students: 1,
    cardOnFile: false,
    autoCharge: false,
    status: 'Archived',
    createdAt: 'May 3, 2026, 2:15 PM',
    canDelete: false,
    archived: true,
  },
];

/* ─────────────────────────── helpers ────────────────────────────── */

const STATUS_PILL: Record<FamilyStatus, { variant: string; label: string }> = {
  Active: { variant: 'mint', label: 'Active' },
  Pending: { variant: 'gold', label: 'Pending' },
  Inactive: { variant: 'harbor', label: 'Inactive' },
  Archived: { variant: 'navy', label: 'Archived' },
};

function initials(name: string) {
  return name
    .split(/[\s\-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/* ─────────────────────────── skeleton rows ──────────────────────── */

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* header wash */}
      <div className="border-b bg-[#f5f6f3] px-5 py-3.5">
        <Skeleton className="h-3.5 w-48" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-5 last:border-0"
          style={{ height: 60 }}
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="ml-auto h-3.5 w-20" />
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-8" />
          <Skeleton className="h-3.5 w-8" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-start justify-between">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <Skeleton className="mb-1 h-5 w-40" />
          <Skeleton className="mb-5 h-3.5 w-28" />
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── kebab menu ─────────────────────────── */

function KebabMenu({
  family,
  label = 'Row actions',
}: {
  family: Family;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  function handleDelete() {
    setOpen(false);
    confirm('Permanently delete this empty household? This cannot be undone.');
  }

  return (
    <div className="relative">
      <button
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border bg-card text-sm shadow-sm"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="w-full px-4 py-2.5 text-left font-semibold hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            Edit
          </button>
          {!family.archived && family.canDelete && (
            <button
              className="w-full px-4 py-2.5 text-left font-semibold text-destructive hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              Delete
            </button>
          )}
          {!family.archived && !family.canDelete && (
            <button
              className="w-full px-4 py-2.5 text-left font-semibold hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              Archive
            </button>
          )}
          {family.archived && (
            <button
              className="w-full px-4 py-2.5 text-left font-semibold hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── list view ──────────────────────────── */

function ListView({ families }: { families: Family[] }) {
  if (families.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Home size={22} className="text-secondary-foreground" aria-hidden />
        </div>
        <p className="font-serif text-[17px] font-bold">No households match these filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Payer</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Card on file</TableHead>
            <TableHead>Auto-charge</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-10" aria-label="Actions" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.map((f) => {
            const pill = STATUS_PILL[f.status];
            return (
              <TableRow
                key={f.id}
                className="cursor-pointer"
                onClick={() => void 0}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-[33px] w-[33px]">
                      <AvatarFallback>{initials(f.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">{f.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.payer ?? '—'}
                </TableCell>
                <TableCell>{f.students}</TableCell>
                <TableCell>{f.cardOnFile ? 'Yes' : 'No'}</TableCell>
                <TableCell>{f.autoCharge ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Badge variant={pill.variant as Parameters<typeof Badge>[0]['variant']}>
                    {pill.label}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {f.createdAt}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <KebabMenu family={f} label="Row actions" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─────────────────────────── cards view ─────────────────────────── */

function FamilyCard({ family }: { family: Family }) {
  const pill = STATUS_PILL[family.status];

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40"
      onClick={() => void 0}
    >
      {/* top row: pill + kebab */}
      <div className="mb-3 flex items-start justify-between">
        <Badge variant={pill.variant as Parameters<typeof Badge>[0]['variant']}>
          {pill.label}
        </Badge>
        <div onClick={(e) => e.stopPropagation()}>
          <KebabMenu family={family} label="Card actions" />
        </div>
      </div>

      {/* title */}
      <p className="font-serif text-[17px] font-bold leading-snug">{family.name}</p>

      {/* fields */}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Payer</dt>
          <dd className="font-semibold">{family.payer ?? '—'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Students</dt>
          <dd className="font-semibold">{family.students}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Auto-charge</dt>
          <dd className="font-semibold">{family.autoCharge ? 'Yes' : 'No'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Card on file</dt>
          <dd className="font-semibold">{family.cardOnFile ? 'Yes' : 'No'}</dd>
        </div>
      </dl>

      {/* footer */}
      <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        {family.createdAt}
      </div>
    </div>
  );
}

function CardsView({ families }: { families: Family[] }) {
  if (families.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Home size={22} className="text-secondary-foreground" aria-hidden />
        </div>
        <p className="font-serif text-[17px] font-bold">No households match these filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {families.map((f) => (
        <FamilyCard key={f.id} family={f} />
      ))}
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */

const STATUS_OPTIONS = [
  { value: 'all-non-archived', label: 'All (non-archived)' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Archived', label: 'Archived' },
  { value: 'all', label: 'All statuses' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
];

type View = 'list' | 'cards';

function FamiliesMain({ loading }: { loading: boolean }) {
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all-non-archived');
  const [sort, setSort] = useState('newest');

  const isFiltered = search !== '' || status !== 'all-non-archived' || sort !== 'newest';

  const families = useMemo(() => {
    let out = [...FAMILIES];

    // Status filter
    if (status === 'all-non-archived') {
      out = out.filter((f) => f.status !== 'Archived');
    } else if (status !== 'all') {
      out = out.filter((f) => f.status === status);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.payer ?? '').toLowerCase().includes(q),
      );
    }

    // Sort
    if (sort === 'name') {
      out = out.slice().sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'oldest') {
      out = out.slice().reverse();
    }

    return out;
  }, [search, status, sort]);

  return (
    <main className="flex min-h-full flex-1 flex-col gap-4 overflow-y-auto bg-background p-6">
      {/* page header */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-[18px] py-3.5">
        <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight">
          Families
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline">Merge queue</Button>
          <Button>+ New Family</Button>
        </div>
      </header>

      {/* filter & view toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* search */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Search name or phone"
            placeholder="Household name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* status */}
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-input bg-muted px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* sort */}
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-input bg-muted px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* clear — only when non-default */}
        {isFiltered && (
          <button
            onClick={() => {
              setSearch('');
              setStatus('all-non-archived');
              setSort('newest');
            }}
            className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={14} aria-hidden />
            Clear
          </button>
        )}

        {/* view toggle */}
        <div
          role="group"
          aria-label="Families layout"
          className="ml-auto flex overflow-hidden rounded-lg border border-input"
        >
          <button
            title="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            className={cn(
              'flex h-10 w-10 items-center justify-center transition-colors',
              view === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            <List size={16} aria-hidden />
          </button>
          <button
            title="Card view"
            aria-pressed={view === 'cards'}
            onClick={() => setView('cards')}
            className={cn(
              'flex h-10 w-10 items-center justify-center border-l border-input transition-colors',
              view === 'cards'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            <LayoutGrid size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* results */}
      {loading ? (
        <div aria-live="polite" aria-busy>
          <span className="sr-only">Loading families…</span>
          {view === 'list' ? <ListSkeleton /> : <CardsSkeleton />}
        </div>
      ) : view === 'list' ? (
        <ListView families={families} />
      ) : (
        <CardsView families={families} />
      )}
    </main>
  );
}

/* ─────────────────────────── shell + sidebar ─────────────────────── */

export function FamiliesPageDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      {/* demo controls */}
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="font-semibold">Demo controls:</span>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={loading}
            onChange={(e) => setLoading(e.target.checked)}
            className="accent-primary"
          />
          Show loading skeleton
        </label>
        <span className="text-xs">(Filter, sort, and view toggle are live — try them)</span>
      </div>

      {/* page shell */}
      <div
        className="flex overflow-hidden rounded-xl border"
        style={{ height: 680 }}
      >
        {/* sidebar */}
        <SidebarNav
          brand="Professional Tutoring, LLC"
          footer={
            <div className="space-y-1">
              <a
                href="#"
                aria-label="Search"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Search size={18} className="text-[#c4922e]" aria-hidden />
                <span>Search</span>
              </a>
              <a
                href="#"
                aria-label="Alerts"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Bell size={18} className="text-[#c4922e]" aria-hidden />
                <span>Alerts</span>
              </a>
              <div className="flex items-center gap-3 px-2 py-1 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>DO</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <div className="truncate font-semibold text-sidebar-primary-foreground">
                    Danielle Okafor
                  </div>
                  <div className="truncate text-xs text-sidebar-foreground/70">Staff</div>
                </div>
              </div>
            </div>
          }
        >
          <SidebarNavSection label="Directory">
            <SidebarNavItem href="#" icon={LayoutDashboard}>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Home} active>
              Families
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Users}>
              Guardians
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={GraduationCap}>
              Students
            </SidebarNavItem>
          </SidebarNavSection>
          <SidebarNavSection label="Operations">
            <SidebarNavItem href="#" icon={GraduationCap}>
              Tutors
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={CalendarDays}>
              Scheduling
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Clock}>
              Sessions
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Receipt}>
              Billing
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={BarChart2}>
              Reports
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Settings}>
              Settings
            </SidebarNavItem>
          </SidebarNavSection>
        </SidebarNav>

        {/* main content */}
        <FamiliesMain loading={loading} />
      </div>
    </div>
  );
}
