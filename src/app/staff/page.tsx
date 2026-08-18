import Link from "next/link";
import { and, asc, desc, eq, inArray, isNotNull, ne, notExists, or, sql } from "drizzle-orm";
import { StaffHomeHeroActions } from "@/components/staff-home-create-menu";
import {
  StaffStudentsDirectoryTable,
  type StaffStudentDirectoryTableRow,
} from "@/components/staff-students-directory-table";
import { amountLabel, paymentStatusLabel } from "@/lib/billing";
import { safeCurrentUser } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  guardians,
  households,
  paymentRecords,
  students,
  studentSubjects,
  subjects,
} from "@/lib/db/schema";
import { buildStudentListLabel } from "@/lib/staff/students";
import { formatGradeLabelDisplay } from "@/lib/ui/grade";
import { formatDirectoryCreatedAt } from "@/lib/ui/directory-sort";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { formatSubjectsPreview } from "@/lib/ui/subjects-preview";
import {
  PRIORITY_QUEUE_RECENT_LIMIT,
  PREVIEW_REQUEST_TOTAL,
  previewQueueRows,
} from "@/lib/staff/preview-requests";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
/** Masdouk / Forward sheets do not operate Friday–Saturday. */
const WEEK_DAYS = [0, 1, 2, 3, 4] as const;
const OPEN_BOOKING_STATUSES = ["confirmed", "held", "pending_payment", "pending_staff_review"] as const;

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function startOfWeekNy(now = new Date()) {
  const nyParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const year = Number(nyParts.find((p) => p.type === "year")?.value);
  const month = Number(nyParts.find((p) => p.type === "month")?.value);
  const day = Number(nyParts.find((p) => p.type === "day")?.value);
  const weekday = nyParts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const sundayDay = day - Math.max(0, weekdayIndex);
  // UTC noon of that NY calendar Sunday — rolling current week, not a frozen date.
  return new Date(Date.UTC(year, month - 1, sundayDay, 12));
}

function formatCapacityDay(weekStart: Date, dayOfWeek: number) {
  const date = new Date(weekStart.getTime() + dayOfWeek * 24 * 60 * 60 * 1000);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${DAY_LABELS[dayOfWeek]} · ${monthDay}`;
}

async function loadDashboardData() {
  const weekStart = startOfWeekNy();
  const empty = {
    loadError: null as string | null,
    onboardingFamilies: 0,
    weekSessions: 0,
    weekSessionsLive: false,
    tutorOpenings: 0,
    tutorOpeningsLive: false,
    billingExceptions: 0,
    billingExceptionsLive: false,
    familyRequests: [] as {
      id: string;
      initials: string;
      title: string;
      copy: string;
      meta: string;
      tone: string;
      href: string;
    }[],
    familyRequestsTotal: 0,
    recentStudents: [] as StaffStudentDirectoryTableRow[],
    weekBars: WEEK_DAYS.map((day) => ({
      day: formatCapacityDay(weekStart, day),
      width: 0,
      booked: 0,
      open: 0,
      capacity: 0,
      count: "0 / 0",
    })),
    weekBarsLive: false,
  };

  if (!db) {
    return {
      ...empty,
      loadError: "Database not configured. Set DATABASE_URL and restart the server.",
    };
  }

  try {
    const linkedGuardianExists = db
      .select({ id: guardians.id })
      .from(guardians)
      .where(
        and(
          eq(guardians.householdId, households.id),
          isNotNull(guardians.clerkUserId),
          sql`trim(${guardians.clerkUserId}) <> ''`,
        ),
      );

    const [
      onboardingHouseholds,
      weekBookingRows,
      slotRows,
      exceptionRows,
      paymentAttentionRows,
      recentStudentRows,
    ] = await Promise.all([
      db
        .select({ id: households.id })
        .from(households)
        .where(
          and(
            ne(households.status, "archived"),
            or(eq(households.status, "pending"), notExists(linkedGuardianExists)),
          ),
        ),
      // Sessions this week by weekly slot day (session schedule), not booking createdAt.
      db
        .select({ id: bookings.id })
        .from(bookings)
        .innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
        .where(inArray(bookings.status, [...OPEN_BOOKING_STATUSES])),
      db.select().from(availabilitySlots).where(eq(availabilitySlots.active, true)),
      db
        .select({ id: paymentRecords.id })
        .from(paymentRecords)
        .where(inArray(paymentRecords.status, ["unpaid", "pending", "failed", "partial"])),
      db
        .select({
          id: paymentRecords.id,
          status: paymentRecords.status,
          amountCents: paymentRecords.amountCents,
          currency: paymentRecords.currency,
          householdName: households.displayName,
        })
        .from(paymentRecords)
        .innerJoin(households, eq(paymentRecords.householdId, households.id))
        .where(inArray(paymentRecords.status, ["unpaid", "pending", "failed", "partial"]))
        .orderBy(desc(paymentRecords.createdAt))
        .limit(PRIORITY_QUEUE_RECENT_LIMIT),
      db
        .select({
          id: students.id,
          displayName: students.displayName,
          firstName: students.firstName,
          lastName: students.lastName,
          lifecycle: students.lifecycle,
          schoolName: students.schoolName,
          gradeLabel: students.gradeLabel,
          householdName: households.displayName,
          createdAt: students.createdAt,
        })
        .from(students)
        .innerJoin(households, eq(students.householdId, households.id))
        .where(ne(students.lifecycle, "archived"))
        .orderBy(desc(students.createdAt))
        .limit(8),
    ]);

    const openSeats = slotRows.reduce((sum, slot) => {
      const open = Math.max(0, slot.capacitySeats - slot.heldSeats - slot.bookedSeats);
      return sum + open;
    }, 0);

    const byDay = new Map<number, { open: number; capacity: number }>();
    for (const day of WEEK_DAYS) byDay.set(day, { open: 0, capacity: 0 });
    for (const slot of slotRows) {
      if (!byDay.has(slot.dayOfWeek)) continue;
      const bucket = byDay.get(slot.dayOfWeek)!;
      bucket.capacity += slot.capacitySeats;
      bucket.open += Math.max(0, slot.capacitySeats - slot.heldSeats - slot.bookedSeats);
    }

    const weekBars = WEEK_DAYS.map((day) => {
      const bucket = byDay.get(day) ?? { open: 0, capacity: 0 };
      const booked = Math.max(0, bucket.capacity - bucket.open);
      const width = bucket.capacity > 0 ? Math.round((booked / bucket.capacity) * 100) : 0;
      return {
        day: formatCapacityDay(weekStart, day),
        width,
        booked,
        open: bucket.open,
        capacity: bucket.capacity,
        count: `${booked} / ${bucket.capacity}`,
      };
    });

    const familyRequests = paymentAttentionRows.map((row) => ({
      id: row.id,
      initials: initialsFromName(row.householdName),
      title: `${paymentStatusLabel(row.status)} · ${row.householdName}`,
      copy: amountLabel(row.amountCents, row.currency),
      meta: "Needs attention",
      tone: row.status === "failed" ? "rose" : row.status === "pending" ? "blue" : "gold",
      href: "/staff/billing",
    }));

    const studentIds = recentStudentRows.map((row) => row.id);
    const subjectsByStudent = new Map<string, Array<{ id: string; name: string }>>();
    if (studentIds.length > 0) {
      const subjectRows = await db
        .select({
          studentId: studentSubjects.studentId,
          id: subjects.id,
          name: subjects.name,
        })
        .from(studentSubjects)
        .innerJoin(subjects, eq(studentSubjects.subjectId, subjects.id))
        .where(inArray(studentSubjects.studentId, studentIds))
        .orderBy(asc(subjects.name));
      for (const row of subjectRows) {
        const list = subjectsByStudent.get(row.studentId) ?? [];
        list.push({ id: row.id, name: row.name });
        subjectsByStudent.set(row.studentId, list);
      }
    }

    const recentStudents = recentStudentRows.map((row) => ({
      id: row.id,
      name: buildStudentListLabel({
        firstName: row.firstName,
        lastName: row.lastName,
        displayName: row.displayName,
      }),
      household: row.householdName || "—",
      subjects: formatSubjectsPreview(subjectsByStudent.get(row.id)),
      grade: formatGradeLabelDisplay(row.gradeLabel),
      school: row.schoolName || "—",
      statusLabel: formatStatusLabel(row.lifecycle),
      statusTone: statusTone(row.lifecycle),
      created: formatDirectoryCreatedAt(row.createdAt.toISOString()),
      href: `/staff/students/${row.id}`,
    }));

    return {
      loadError: null,
      onboardingFamilies: onboardingHouseholds.length,
      weekSessions: weekBookingRows.length,
      weekSessionsLive: true,
      tutorOpenings: openSeats,
      tutorOpeningsLive: slotRows.length > 0,
      billingExceptions: exceptionRows.length,
      billingExceptionsLive: true,
      familyRequests,
      familyRequestsTotal: exceptionRows.length,
      recentStudents,
      weekBars,
      weekBarsLive: slotRows.length > 0,
    };
  } catch (error) {
    console.warn("[staff-dashboard] soft-fail", error);
    return {
      ...empty,
      loadError: "Unable to load dashboard data. Check DATABASE_URL and server logs.",
    };
  }
}

export default async function StaffDashboardPage() {
  const user = await safeCurrentUser();
  const firstName = user?.firstName || "there";
  const data = await loadDashboardData();

  const nowNy = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const greeting = greetingForHour(nowNy.getHours());
  const usingPreviewRequests = data.familyRequests.length === 0 && !data.loadError;
  const priorityRequests = usingPreviewRequests ? previewQueueRows() : data.familyRequests;
  const priorityRequestTotal = usingPreviewRequests ? PREVIEW_REQUEST_TOTAL : data.familyRequestsTotal;

  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h2>
            {greeting}, {firstName}.
          </h2>
        </div>
        <StaffHomeHeroActions />
      </section>

      {data.loadError ? <p className="form-error">{data.loadError}</p> : null}

      <section className="metric-grid metric-strip" aria-label="Dashboard metrics">
        <article className="metric-card">
          <span className="metric-mark navy" />
          <p>Families still setting up</p>
          <strong>{data.onboardingFamilies}</strong>
          <small>Pending or no parent login</small>
        </article>
        <article className="metric-card">
          <span className="metric-mark blue" />
          <p>Sessions this week</p>
          <strong>{data.weekSessions}</strong>
          <small>
            {data.weekSessionsLive
              ? "Scheduled or happening this week"
              : "Live when sessions exist"}
          </small>
        </article>
        <article className="metric-card">
          <span className="metric-mark mint" />
          <p>Open tutor seats</p>
          <strong>{data.tutorOpenings}</strong>
          <small>
            {data.tutorOpeningsLive ? "Seats still free on active times" : "Live when availability exists"}
          </small>
        </article>
        <article className="metric-card">
          <span className="metric-mark gold" />
          <p>Payments needing attention</p>
          <strong>{data.billingExceptions}</strong>
          <small>
            {data.billingExceptionsLive
              ? "Unpaid, pending, failed, or partial"
              : "Live when payment rows exist"}
          </small>
        </article>
      </section>

      <div className="dashboard-main-row staff-equal-cards">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3>Payment issues</h3>
            </div>
            <div className="dashboard-heading-side">
              <div className="dashboard-kpi-strip" aria-label="Priority summary">
                <span className="dashboard-kpi-chip">
                  Requests
                  <strong>{priorityRequestTotal}</strong>
                </span>
              </div>
              <Link href="/staff/sessions?tab=issues" className="text-button">
                Open sessions
              </Link>
            </div>
          </div>
          {usingPreviewRequests ? (
            <p className="dashboard-preview-note">
              Sample preview — {priorityRequests.length} recent of {priorityRequestTotal} (not live).
            </p>
          ) : priorityRequestTotal > priorityRequests.length ? (
            <p className="dashboard-preview-note">
              Showing {priorityRequests.length} recent of {priorityRequestTotal}.
            </p>
          ) : null}
          <div className="attention-list">
            {priorityRequests.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="attention-row"
              >
                <span className={`avatar ${item.tone}`}>{item.initials}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.copy}</small>
                </span>
                <span className={`pill ${item.tone}`}>{item.meta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Capacity</span>
              <h3>This week</h3>
            </div>
            <Link href="/staff/sessions" className="text-button">
              Open schedule
            </Link>
          </div>
          <div className="capacity-bars">
            {data.weekBars.map((row) => (
              <Link
                key={row.day}
                href="/staff/sessions"
                className="capacity-row"
              >
                <span>{row.day}</span>
                <div className="bar-track">
                  <span style={{ width: `${row.width}%` }} />
                </div>
                <small>{row.count}</small>
              </Link>
            ))}
          </div>
          {!data.weekBarsLive ? (
            <div className="capacity-note">
              <span className="signal-dot" />
              Totals fill when availability slots exist in the database.
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel dashboard-recent-students">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Students</span>
            <h3>Recently added</h3>
          </div>
          <Link href="/staff/students" className="text-button">
            Open students
          </Link>
        </div>
        {data.recentStudents.length === 0 ? (
          <p className="dashboard-empty">No students yet. Add a student to get started.</p>
        ) : (
          <StaffStudentsDirectoryTable rows={data.recentStudents} />
        )}
      </section>
    </>
  );
}
