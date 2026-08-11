"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type BookingRow = {
  id: string;
  status: string;
  studentName: string;
  tutorName: string | null;
  householdName: string;
  subjectName: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  dayOfWeek: number | null;
  slotLabel: string | null;
  createdAt: string;
  householdId: string;
  studentId: string;
  tutorId: string | null;
};

type CourseRow = {
  id: string;
  code: string;
  name: string;
  termLabel: string | null;
  scheduleSummary: string | null;
  capacity: number;
  enrolledCount: number;
  active: boolean;
  description: string | null;
};

type RosterRow = {
  id: string;
  studentName: string;
  householdName: string;
  status: string;
  createdAt: string;
  studentId: string;
  householdId: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const TIME_BUCKETS = ["9:00", "11:00", "1:00", "3:15", "5:15", "7:15"] as const;

function statusTone(status: string) {
  if (status === "confirmed") return "tone-0";
  if (status === "held" || status === "pending_payment" || status === "pending_staff_review") return "tone-3";
  if (status === "cancelled" || status === "failed") return "tone-1";
  return "tone-2";
}

function timeLabel(booking: BookingRow) {
  if (booking.slotLabel) return booking.slotLabel;
  const day = booking.dayOfWeek != null ? DAYS[booking.dayOfWeek] ?? "" : "";
  const range =
    booking.slotStart && booking.slotEnd ? `${booking.slotStart}–${booking.slotEnd}` : null;
  return [day, range].filter(Boolean).join(" · ") || "Schedule pending";
}

function matchesBucket(start: string | null, bucket: string) {
  if (!start) return false;
  const normalized = start.replace(/^0/, "").slice(0, 5);
  const hour = Number.parseInt(normalized.split(":")[0] ?? "", 10);
  if (Number.isNaN(hour)) return false;
  const bucketHour = Number.parseInt(bucket.split(":")[0] ?? "", 10);
  if (bucket === "9:00") return hour >= 8 && hour < 10;
  if (bucket === "11:00") return hour >= 10 && hour < 12;
  if (bucket === "1:00") return hour === 12 || hour === 13;
  if (bucket === "3:15") return hour >= 14 && hour < 16;
  if (bucket === "5:15") return hour >= 16 && hour < 18;
  if (bucket === "7:15") return hour >= 18;
  return bucketHour === hour;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function StaffSchedulingClient() {
  const [mode, setMode] = useState<"Week" | "Courses">("Week");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rosterCourseId, setRosterCourseId] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterCourse, setRosterCourse] = useState<CourseRow | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulingRes, coursesRes] = await Promise.all([
        fetch("/api/staff/scheduling"),
        fetch("/api/staff/courses"),
      ]);
      const schedulingData = await schedulingRes.json();
      const coursesData = await coursesRes.json();
      if (!schedulingRes.ok || !schedulingData.ok) {
        setError(schedulingData.error || "Unable to load scheduling.");
        return;
      }
      if (!coursesRes.ok || !coursesData.ok) {
        setError(coursesData.error || "Unable to load courses.");
        return;
      }
      setBookings(schedulingData.bookings ?? []);
      setCourses(coursesData.courses ?? []);
    } catch {
      setError("Unable to load scheduling.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const boardBookings = useMemo(() => {
    return bookings.filter((b) => b.dayOfWeek != null && b.status !== "cancelled" && b.status !== "failed");
  }, [bookings]);

  async function openRoster(courseId: string) {
    setRosterCourseId(courseId);
    setRosterLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/courses/${courseId}/roster`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load roster.");
        setRoster([]);
        setRosterCourse(null);
        return;
      }
      setRoster(data.roster ?? []);
      setRosterCourse(data.course ?? null);
    } catch {
      setError("Unable to load roster.");
      setRoster([]);
      setRosterCourse(null);
    } finally {
      setRosterLoading(false);
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Scheduling"
        title="Scheduling"
        description="Sunday–Saturday week board for tutoring, with Courses nested here (not a top-level Staff menu)."
      />
      {error ? <p className="form-error">{error}</p> : null}

      <section className="segmented">
        {(["Week", "Courses"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={mode === item ? "active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </section>

      {mode === "Week" ? (
        <>
          <Panel title="Weekly calendar" eyebrow="Live bookings">
            {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading bookings…</p> : null}
            <div className="schedule-board">
              <div className="schedule-corner">
                <strong>Time</strong>
                <small>ET</small>
              </div>
              {DAYS.map((day) => (
                <div key={day} className="day-head">
                  <strong>{day}</strong>
                  <small>
                    {boardBookings.filter((b) => b.dayOfWeek === DAYS.indexOf(day)).length} booked
                  </small>
                </div>
              ))}
              {TIME_BUCKETS.map((time) => (
                <div className="schedule-row" key={time}>
                  <div className="time-cell">{time}</div>
                  {DAYS.map((_, dayIndex) => {
                    const cellBookings = boardBookings.filter(
                      (b) => b.dayOfWeek === dayIndex && matchesBucket(b.slotStart, time),
                    );
                    if (cellBookings.length === 0) {
                      return (
                        <div key={`${time}-${dayIndex}`} className="slot-card open">
                          <strong>Open</strong>
                          <small>Staff create booking later</small>
                        </div>
                      );
                    }
                    const first = cellBookings[0];
                    return (
                      <Link
                        key={`${time}-${dayIndex}`}
                        href={
                          first.studentId
                            ? `/staff/students/${first.studentId}`
                            : `/staff/families/${first.householdId}`
                        }
                        className={`slot-card ${statusTone(first.status)}`}
                        style={{ textDecoration: "none", color: "inherit", display: "block" }}
                      >
                        <strong>{first.studentName}</strong>
                        <small>
                          {first.subjectName ?? "Tutoring"}
                          {cellBookings.length > 1 ? ` · +${cellBookings.length - 1}` : ""}
                        </small>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 10, color: "var(--muted)" }}>
              Staff create booking is not built yet. Open slots stay read-only for now.
            </p>
          </Panel>

          <Panel title="Recent bookings" eyebrow={`${bookings.length} total`}>
            {bookings.length === 0 && !loading ? (
              <p style={{ color: "var(--muted)" }}>No bookings yet.</p>
            ) : (
              <div className="family-list">
                {bookings.map((row) => (
                  <div key={row.id} className="family-row" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <strong>{row.studentName}</strong>
                      <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>
                        {[row.subjectName, row.tutorName, row.householdName].filter(Boolean).join(" · ")}
                      </small>
                      <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                        {timeLabel(row)} · {formatWhen(row.createdAt)}
                      </small>
                    </div>
                    <span className="pill" style={{ marginRight: 10 }}>
                      {row.status}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {row.studentId ? (
                        <Link href={`/staff/students/${row.studentId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 9 }}>
                          Student →
                        </Link>
                      ) : null}
                      {row.householdId ? (
                        <Link href={`/staff/families/${row.householdId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 9 }}>
                          Household →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : (
        <>
          <Panel title="SAT/ACT courses" eyebrow="Nested under Scheduling">
            {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading courses…</p> : null}
            {courses.length === 0 && !loading ? (
              <p style={{ color: "var(--muted)" }}>No course offerings yet.</p>
            ) : (
              <section className="course-grid">
                {courses.map((course) => {
                  const seatsLeft = Math.max(0, course.capacity - course.enrolledCount);
                  const capacityLabel = course.active
                    ? seatsLeft > 0
                      ? `${course.enrolledCount}/${course.capacity} enrolled`
                      : "Full"
                    : "Inactive";
                  return (
                    <article key={course.id} className="course-card">
                      <span className="pill">{capacityLabel}</span>
                      <span className="course-kicker">{course.code}</span>
                      <h3>{course.name}</h3>
                      <div>
                        <small>Term</small>
                        <strong>{course.termLabel ?? "—"}</strong>
                      </div>
                      <div>
                        <small>Scheduling pattern</small>
                        <strong>{course.scheduleSummary ?? "Schedule pending"}</strong>
                      </div>
                      <button type="button" onClick={() => void openRoster(course.id)}>
                        Open Course Roster →
                      </button>
                      <Link
                        href={`/staff/scheduling/courses/${course.id}`}
                        style={{ display: "block", marginTop: 8, color: "var(--muted)", fontSize: 8, fontWeight: 700 }}
                      >
                        Open full roster page
                      </Link>
                    </article>
                  );
                })}
              </section>
            )}
          </Panel>

          {rosterCourseId ? (
            <Panel
              title={rosterCourse?.name ?? "Course roster"}
              eyebrow={rosterLoading ? "Loading…" : `${roster.length} enrollments`}
            >
              {rosterLoading ? (
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading roster…</p>
              ) : roster.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>No enrollments for this course.</p>
              ) : (
                <div className="family-list">
                  {roster.map((row) => (
                    <div key={row.id} className="family-row">
                      <div style={{ flex: 1 }}>
                        <strong>{row.studentName}</strong>
                        <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>
                          {row.householdName} · {formatWhen(row.createdAt)}
                        </small>
                      </div>
                      <span className="pill" style={{ marginRight: 10 }}>
                        {row.status}
                      </span>
                      <Link href={`/staff/students/${row.studentId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 9 }}>
                        Student →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 12, fontSize: 10, color: "var(--muted)" }}>
                Enrollment manage / archive actions come in a later slice.
              </p>
            </Panel>
          ) : null}
        </>
      )}
    </>
  );
}
