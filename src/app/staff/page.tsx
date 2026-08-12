import Link from "next/link";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { safeCurrentUser } from "@/lib/auth/clerk";
import { db } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  households,
  paymentRecords,
  students,
} from "@/lib/db/schema";

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

async function loadDashboardData() {
  const empty = {
    onboardingFamilies: 0,
    weekSessions: 0,
    weekSessionsLive: false,
    tutorOpenings: 0,
    tutorOpeningsLive: false,
    billingExceptions: 0,
    billingExceptionsLive: false,
    attention: [] as {
      initials: string;
      title: string;
      copy: string;
      meta: string;
      tone: string;
      href: string;
    }[],
    weekBars: WEEK_DAYS.map((day) => ({
      day: DAY_LABELS[day],
      width: 0,
      count: "0 / 0",
    })),
    weekBarsLive: false,
  };

  if (!db) return empty;

  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [
      pendingHouseholds,
      weekBookingRows,
      slotRows,
      exceptionRows,
      prospectStudents,
    ] = await Promise.all([
      db.select().from(households).where(eq(households.status, "pending")),
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
      db.select().from(students).where(eq(students.lifecycle, "prospect")).limit(8),
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
        day: DAY_LABELS[day],
        width,
        count: `${used} / ${bucket.capacity}`,
      };
    });

    const attention: typeof empty.attention = [];
    for (const household of pendingHouseholds.slice(0, 6)) {
      attention.push({
        initials: initialsFromName(household.displayName),
        title: `Verify ${household.displayName} onboarding`,
        copy: "Household pending placement",
        meta: "Needs placement",
        tone: "coral",
        href: "/staff/families",
      });
    }
    for (const student of prospectStudents.slice(0, Math.max(0, 6 - attention.length))) {
      attention.push({
        initials: initialsFromName(student.displayName),
        title: `Place ${student.firstName}`,
        copy: student.schoolName ? `${student.schoolName} · prospect` : "Prospect student",
        meta: "Needs placement",
        tone: "blue",
        href: "/staff/students",
      });
    }

    return {
      onboardingFamilies: pendingHouseholds.length,
      weekSessions: weekBookingRows.length,
      weekSessionsLive: true,
      tutorOpenings: openSeats,
      tutorOpeningsLive: slotRows.length > 0,
      billingExceptions: exceptionRows.length,
      billingExceptionsLive: true,
      attention,
      weekBars,
      weekBarsLive: slotRows.length > 0,
    };
  } catch (error) {
    console.warn("[staff-dashboard] soft-fail", error);
    return empty;
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
          <p>
            Here is the operational picture for today—what needs placement, what is moving, and what
            needs a human decision.
          </p>
        </div>
        <Link href="/staff/families" className="primary-button" style={{ textDecoration: "none" }}>
          + New Family
        </Link>
      </section>

      <section className="recommendation-banner">
        <span>i</span>
        <div>
          <strong>Direct service onboarding</strong>
          <p>
            General inquiries stay in Zoho CRM. A submission from any of the five Professional Tutoring
            service forms starts work here by creating the Family and Student records together—there is
            no duplicate lead stage.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Dashboard metrics">
        <article className="metric-card">
          <span className="metric-mark coral" />
          <p>Onboarding families</p>
          <strong>{data.onboardingFamilies}</strong>
          <small>Pending household records</small>
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

      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3>Needs attention</h3>
            </div>
            <Link href="/staff/families" className="text-button">
              Open families
            </Link>
          </div>
          <div className="attention-list">
            {data.attention.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                Nothing pending right now. New family and prospect student items will appear here.
              </p>
            ) : (
              data.attention.map((item) => (
                <Link
                  key={`${item.title}-${item.initials}`}
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
              <span className="eyebrow">Capacity</span>
              <h3>Week at a glance</h3>
            </div>
            <Link href="/staff/scheduling" className="text-button">
              Open schedule
            </Link>
          </div>
          <div className="capacity-bars">
            {data.weekBars.map((row) => (
              <div className="capacity-row" key={row.day}>
                <span>{row.day}</span>
                <div className="bar-track">
                  <span style={{ width: `${row.width}%` }} />
                </div>
                <small>{row.count}</small>
              </div>
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
