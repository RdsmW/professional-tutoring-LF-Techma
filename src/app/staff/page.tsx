import Link from "next/link";
import { and, asc, desc, eq, inArray, isNotNull, ne, notExists, or, sql } from "drizzle-orm";
import { StaffHomeHeroActions } from "@/components/staff-home-create-menu";
import {
  StaffStudentsDirectoryTable,
  type StaffStudentDirectoryTableRow,
} from "@/components/staff-students-directory-table";
import { amountLabel } from "@/lib/billing";
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
import { listTutoringAssignmentQueue } from "@/lib/staff/tutoring-assignment-queue";
import { buildStudentListLabel } from "@/lib/staff/students";
import { formatGradeLabelDisplay } from "@/lib/ui/grade";
import { formatDirectoryCreatedAt } from "@/lib/ui/directory-sort";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { initialsOf } from "@/lib/ui/initials";
import {
  formatQueueDate,
  PRIORITY_QUEUE_RECENT_LIMIT,
  type PreviewQueueRow,
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

function queuePersonName(firstName?: string | null, lastName?: string | null, displayName?: string | null) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || (displayName ?? "").trim();
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
    familyRequests: [] as PreviewQueueRow[],
    familyRequestsTotal: 0,
    assignmentQueue: [] as Awaited<ReturnType<typeof listTutoringAssignmentQueue>>,
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
      assignmentQueue,
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
          amountCents: paymentRecords.amountCents,
          currency: paymentRecords.currency,
          createdAt: paymentRecords.createdAt,
          householdId: households.id,
          householdName: households.displayName,
          payerFirstName: guardians.firstName,
          payerLastName: guardians.lastName,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentDisplayName: students.displayName,
        })
        .from(paymentRecords)
        .innerJoin(households, eq(paymentRecords.householdId, households.id))
        .leftJoin(guardians, eq(households.billingOwnerGuardianId, guardians.id))
        .leftJoin(students, eq(students.id, paymentRecords.relatedEntityId))
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
      listTutoringAssignmentQueue(),
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

    const studentNameByHousehold = new Map<string, string>();
    const householdsNeedingStudent = [
      ...new Set(
        paymentAttentionRows
          .filter(
            (row) =>
              !queuePersonName(row.studentFirstName, row.studentLastName, row.studentDisplayName),
          )
          .map((row) => row.householdId),
      ),
    ];
    if (householdsNeedingStudent.length > 0) {
      const householdStudentRows = await db
        .select({
          householdId: students.householdId,
          firstName: students.firstName,
          lastName: students.lastName,
          displayName: students.displayName,
        })
        .from(students)
        .where(
          and(inArray(students.householdId, householdsNeedingStudent), ne(students.lifecycle, "archived")),
        )
        .orderBy(asc(students.createdAt));
      for (const row of householdStudentRows) {
        if (!row.householdId || studentNameByHousehold.has(row.householdId)) continue;
        studentNameByHousehold.set(
          row.householdId,
          queuePersonName(row.firstName, row.lastName, row.displayName),
        );
      }
    }

    const familyRequests = paymentAttentionRows.map((row) => {
      const payerName = queuePersonName(row.payerFirstName, row.payerLastName);
      const name = (row.householdName || "").trim() || payerName || "Family";
      const studentName =
        queuePersonName(row.studentFirstName, row.studentLastName, row.studentDisplayName) ||
        studentNameByHousehold.get(row.householdId) ||
        "";
      return {
        id: row.id,
        name,
        studentName,
        amountLabel: amountLabel(row.amountCents, row.currency),
        dateLabel: formatQueueDate(row.createdAt),
        href: "/staff/billing",
      };
    });

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
      subjects: (subjectsByStudent.get(row.id) ?? []).map((subject) => subject.name),
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
      assignmentQueue,
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

  /* Approved mockup "Family requests" card: one mixed priority queue —
   * tutor-assignment requests first, then payment issues. */
  const assignmentRequests = data.assignmentQueue.slice(0, PRIORITY_QUEUE_RECENT_LIMIT).map((item) => ({
    id: `assign-${item.id}`,
    href: `/staff/tutoring-requests/${item.id}`,
    initials: initialsOf(item.studentName),
    title: item.studentName,
    copy: `${item.familyName} · ${item.reason}`,
    pill: item.schedulingPath === "family_selected" ? "Preferred time" : "Choose tutor",
  }));
  const paymentRequests = data.familyRequests.map((item) => ({
    id: `payment-${item.id}`,
    href: item.href,
    initials: initialsOf(item.studentName || item.name),
    title: item.name,
    copy: `${item.studentName || "Family"} · ${item.dateLabel}`,
    pill: item.amountLabel,
  }));
  const requestRows = [...assignmentRequests, ...paymentRequests];
  const requestTotal = data.assignmentQueue.length + data.familyRequestsTotal;

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

      <section className="kpi-grid" aria-label="Dashboard metrics">
        <article className="kpi-card">
          <div className="kpi-card-head">
            <span>Families still setting up</span>
          </div>
          <div className="kpi-card-panel">
            <strong>{data.onboardingFamilies}</strong>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-head">
            <span>Sessions this week</span>
          </div>
          <div className="kpi-card-panel">
            <strong>{data.weekSessions}</strong>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-head">
            <span>Open tutor seats</span>
          </div>
          <div className="kpi-card-panel">
            <strong>{data.tutorOpenings}</strong>
          </div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card-head">
            <span>Payments needing attention</span>
          </div>
          <div className="kpi-card-panel">
            <strong>{data.billingExceptions}</strong>
          </div>
        </article>
      </section>

      <div className="dashboard-main-row staff-equal-cards">
        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3 className="staff-section-title">Family requests</h3>
            </div>
            <div className="dashboard-queue-side">
              <span className="pill navy">Requests&nbsp;{requestTotal}</span>
              <Link href="/staff/tutoring-requests" className="text-button">
                Open queue
              </Link>
            </div>
          </div>
          {requestRows.length === 0 ? (
            <p className="dashboard-empty">No family requests need staff action right now.</p>
          ) : (
            <div className="request-list">
              {requestRows.map((row) => (
                <Link key={row.id} href={row.href} className="request-row">
                  <span className="table-avatar" aria-hidden>
                    {row.initials}
                  </span>
                  <span className="request-row-copy">
                    <strong>{row.title}</strong>
                    <small>{row.copy}</small>
                  </span>
                  <span className="pill gold">{row.pill}</span>
                </Link>
              ))}
            </div>
          )}
          {requestTotal > requestRows.length ? (
            <div className="capacity-note">
              Showing {requestRows.length} recent of {requestTotal}.
            </div>
          ) : null}
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Capacity</span>
              <h3 className="staff-section-title">This week</h3>
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
              Bars fill when availability slots exist in the database.
            </div>
          ) : null}
        </section>
      </div>

      <div className="dashboard-section-head">
        <div>
          <span className="eyebrow">Students</span>
          <h2>Recently added</h2>
        </div>
        <Link href="/staff/students" className="text-button">
          Open students
        </Link>
      </div>
      {data.recentStudents.length === 0 ? (
        <p className="dashboard-empty">No students yet. Add a student to get started.</p>
      ) : (
        <div className="dashboard-table-wrap">
          <StaffStudentsDirectoryTable rows={data.recentStudents} />
        </div>
      )}
    </>
  );
}
