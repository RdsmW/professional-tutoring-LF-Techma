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
import { formatSubjectsPreview } from "@/lib/ui/subjects-preview";
import {
  formatQueueDate,
} from "@/lib/staff/preview-requests";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
/** Masdouk / Forward sheets do not operate Friday–Saturday. */
const WEEK_DAYS = [0, 1, 2, 3, 4] as const;
const OPEN_BOOKING_STATUSES = ["confirmed", "held", "pending_payment", "pending_staff_review"] as const;

type DashboardPriorityItem = {
  id: string;
  kind: "assignment" | "payment";
  title: string;
  detail: string;
  action: string;
  href: string;
  createdAt: string;
};

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
    familyRequestsTotal: 0,
    assignmentQueue: [] as Awaited<ReturnType<typeof listTutoringAssignmentQueue>>,
    priorityItems: [] as DashboardPriorityItem[],
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
        .orderBy(desc(paymentRecords.createdAt)),
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
        .limit(3),
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

    const paymentPriorityItems: DashboardPriorityItem[] = paymentAttentionRows.map((row) => {
      const payerName = queuePersonName(row.payerFirstName, row.payerLastName);
      const name = (row.householdName || "").trim() || payerName || "Family";
      const studentName =
        queuePersonName(row.studentFirstName, row.studentLastName, row.studentDisplayName) ||
        studentNameByHousehold.get(row.householdId) ||
        "";
      return {
        id: row.id,
        kind: "payment",
        title: name,
        detail: studentName || formatQueueDate(row.createdAt),
        action: amountLabel(row.amountCents, row.currency),
        href: "/staff/billing",
        createdAt: row.createdAt.toISOString(),
      };
    });
    const priorityItems = [
      ...assignmentQueue.map<DashboardPriorityItem>((item) => ({
        id: item.id,
        kind: "assignment",
        title: item.studentName,
        detail: item.subjectName,
        action: item.schedulingPath === "family_selected" ? "Preferred time" : "Choose tutor",
        href: `/staff/tutoring-requests/${item.id}`,
        createdAt: item.createdAt,
      })),
      ...paymentPriorityItems,
    ]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 3);

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
      familyRequestsTotal: exceptionRows.length,
      assignmentQueue,
      priorityItems,
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

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const priorityRequestTotal = data.familyRequestsTotal;

  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h2>
            Welcome, {firstName}.
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
        </article>
        <article className="metric-card">
          <span className="metric-mark blue" />
          <p>Sessions this week</p>
          <strong>{data.weekSessions}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-mark mint" />
          <p>Open tutor seats</p>
          <strong>{data.tutorOpenings}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-mark gold" />
          <p>Payments needing attention</p>
          <strong>{data.billingExceptions}</strong>
        </article>
      </section>

      <div className="dashboard-main-row staff-equal-cards">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3 className="staff-section-title">This Week Capacity</h3>
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

        <section className="panel dashboard-priority-panel">
          <div className="panel-heading">
            <h3 className="staff-section-title dashboard-queue-title">
              Priority Queue {data.assignmentQueue.length + priorityRequestTotal}
            </h3>
            <Link href="/staff/priority-queue" className="text-button">
              Open queue
            </Link>
          </div>
          {data.priorityItems.length === 0 ? (
            <p className="dashboard-empty">No items in the priority queue.</p>
          ) : (
            <div className="attention-list dashboard-priority-list">
              {data.priorityItems.map((item) => (
                <Link key={`${item.kind}-${item.id}`} href={item.href} className="attention-row">
                  <span
                    className={`dashboard-priority-status dashboard-priority-status--${item.kind}`}
                  >
                    {item.kind === "assignment" ? "New assignment" : "Payment issue"}
                  </span>
                  <span className="attention-row-name">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <span className="attention-row-amount">{item.action}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel dashboard-recent-students">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Students</span>
            <h3 className="staff-section-title">Recently added</h3>
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
