import Link from "next/link";
import { and, desc, eq, gte, inArray, isNotNull, lte, ne, notExists, or, sql } from "drizzle-orm";
import { StaffHomeCreateMenu } from "@/components/staff-home-create-menu";
import { safeCurrentUser } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  changeRequests,
  guardians,
  households,
  paymentRecords,
  students,
} from "@/lib/db/schema";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const WEEK_DAYS = [0, 1, 2, 3, 4] as const;

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
  const localMidnight = new Date(year, month - 1, day);
  localMidnight.setDate(localMidnight.getDate() - Math.max(0, weekdayIndex));
  return localMidnight;
}

function formatCapacityDay(weekStart: Date, dayOfWeek: number) {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayOfWeek);
  const monthDay = new Intl.DateTimeFormat("en-US", {
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
    recentStudents: [] as {
      id: string;
      initials: string;
      title: string;
      copy: string;
      meta: string;
      tone: string;
      href: string;
    }[],
    weekBars: WEEK_DAYS.map((day) => ({
      day: formatCapacityDay(weekStart, day),
      width: 0,
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
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

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
      openRequests,
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
      db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            gte(bookings.createdAt, startOfWeek),
            lte(bookings.createdAt, endOfWeek),
            inArray(bookings.status, ["confirmed", "held", "pending_payment", "pending_staff_review"]),
          ),
        ),
      db.select().from(availabilitySlots).where(eq(availabilitySlots.active, true)),
      db
        .select({ id: paymentRecords.id })
        .from(paymentRecords)
        .where(inArray(paymentRecords.status, ["unpaid", "pending", "failed", "partial"])),
      db
        .select({
          id: changeRequests.id,
          changeType: changeRequests.changeType,
          requestedOutcome: changeRequests.requestedOutcome,
          status: changeRequests.status,
          studentName: students.displayName,
          householdName: households.displayName,
        })
        .from(changeRequests)
        .innerJoin(students, eq(changeRequests.studentId, students.id))
        .innerJoin(households, eq(changeRequests.householdId, households.id))
        .where(inArray(changeRequests.status, ["submitted", "under_review"]))
        .orderBy(desc(changeRequests.createdAt))
        .limit(8),
      db
        .select({
          id: students.id,
          displayName: students.displayName,
          lifecycle: students.lifecycle,
          schoolName: students.schoolName,
          gradeLabel: students.gradeLabel,
          householdName: households.displayName,
        })
        .from(students)
        .innerJoin(households, eq(students.householdId, households.id))
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
      const used = Math.max(0, bucket.capacity - bucket.open);
      const width = bucket.capacity > 0 ? Math.round((used / bucket.capacity) * 100) : 0;
      return {
        day: formatCapacityDay(weekStart, day),
        width,
        count: `${used} / ${bucket.capacity}`,
      };
    });

    const familyRequests = openRequests.map((row) => ({
      id: row.id,
      initials: initialsFromName(row.studentName || row.householdName),
      title: `${formatStatusLabel(row.changeType)} · ${row.studentName}`,
      copy: `${row.householdName} · ${formatStatusLabel(row.requestedOutcome)}`,
      meta: formatStatusLabel(row.status),
      tone: statusTone(row.status) || (row.status === "under_review" ? "blue" : "rose"),
      href: `/staff/sessions?exceptionId=${row.id}`,
    }));

    const recentStudents = recentStudentRows.map((row) => ({
      id: row.id,
      initials: initialsFromName(row.displayName),
      title: row.displayName,
      copy: [row.householdName, row.gradeLabel, row.schoolName].filter(Boolean).join(" · ") || "Student",
      meta: formatStatusLabel(row.lifecycle),
      tone: statusTone(row.lifecycle),
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

  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h2>
            {greeting}, {firstName}.
          </h2>
        </div>
        <StaffHomeCreateMenu />
      </section>

      {data.loadError ? <p className="form-error">{data.loadError}</p> : null}

      <section className="metric-grid" aria-label="Dashboard metrics">
        <article className="metric-card">
          <span className="metric-mark navy" />
          <p>Onboarding families</p>
          <strong>{data.onboardingFamilies}</strong>
          <small>Pending / incomplete households</small>
        </article>
        <article className="metric-card">
          <span className="metric-mark blue" />
          <p>This week&apos;s sessions</p>
          <strong>{data.weekSessions}</strong>
          <small>
            {data.weekSessionsLive && data.weekSessions > 0
              ? "Bookings created this week"
              : "Live when sessions exist"}
          </small>
        </article>
        <article className="metric-card">
          <span className="metric-mark mint" />
          <p>Tutor openings</p>
          <strong>{data.tutorOpenings}</strong>
          <small>
            {data.tutorOpeningsLive ? "Open seats across active slots" : "Live when availability exists"}
          </small>
        </article>
        <article className="metric-card">
          <span className="metric-mark gold" />
          <p>Billing exceptions</p>
          <strong>{data.billingExceptions}</strong>
          <small>
            {data.billingExceptionsLive
              ? "Reviewable payment records"
              : "Live when payment rows exist"}
          </small>
        </article>
      </section>

      <div className="dashboard-triptych">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3>Family requests</h3>
            </div>
            <Link href="/staff/sessions" className="text-button">
              Open sessions
            </Link>
          </div>
          <div className="attention-list">
            {data.familyRequests.length === 0 ? (
              <p className="dashboard-empty">No open cancellation or change requests right now.</p>
            ) : (
              data.familyRequests.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="attention-row"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className={`avatar ${item.tone}`}>{item.initials}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.copy}</small>
                  </span>
                  <span className={`pill ${item.tone}`}>{item.meta}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Students</span>
              <h3>Recently added</h3>
            </div>
            <Link href="/staff/students" className="text-button">
              Open students
            </Link>
          </div>
          <div className="attention-list">
            {data.recentStudents.length === 0 ? (
              <p className="dashboard-empty">No students yet. Use + to add one.</p>
            ) : (
              data.recentStudents.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="attention-row"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className="avatar blue">{item.initials}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.copy}</small>
                  </span>
                  <span className={`pill ${item.tone}`}>{item.meta}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Capacity</span>
              <h3>This week</h3>
            </div>
            <Link href="/staff/scheduling" className="text-button">
              Open schedule
            </Link>
          </div>
          <div className="capacity-bars">
            {data.weekBars.map((row) => (
              <Link
                key={row.day}
                href="/staff/scheduling"
                className="capacity-row"
                style={{ textDecoration: "none", color: "inherit", display: "grid" }}
              >
                <span>{row.day}</span>
                <div className="bar-track">
                  <span style={{ width: `${row.width}%` }} />
                </div>
                <small>{row.count}</small>
              </Link>
            ))}
          </div>
          <div className="capacity-note">
            <span className="signal-dot" />
            {data.weekBarsLive
              ? "Bars reflect open vs booked seats on active availability slots."
              : "Bars fill when availability slots exist in the database."}
          </div>
        </section>
      </div>
    </>
  );
}
