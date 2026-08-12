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

type OptionHousehold = { id: string; displayName: string };
type OptionStudent = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
};
type OptionTutor = { id: string; displayName: string };
type OptionSubject = { id: string; code: string; name: string };
type OptionSlot = {
  id: string;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  label: string | null;
  capacitySeats: number;
  heldSeats: number;
  bookedSeats: number;
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

function slotOpenSeats(slot: OptionSlot) {
  return Math.max(0, slot.capacitySeats - slot.bookedSeats - slot.heldSeats);
}

function slotChoiceLabel(slot: OptionSlot) {
  const day = DAYS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`;
  const range = `${slot.startTimeLocal}–${slot.endTimeLocal}`;
  const open = slotOpenSeats(slot);
  const label = slot.label ? ` · ${slot.label}` : "";
  return `${day} · ${range}${label} · ${open} open`;
}

const emptyForm = {
  householdId: "",
  studentId: "",
  subjectId: "",
  tutorId: "",
  slotId: "",
  notes: "",
};

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
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [households, setHouseholds] = useState<OptionHousehold[]>([]);
  const [students, setStudents] = useState<OptionStudent[]>([]);
  const [tutors, setTutors] = useState<OptionTutor[]>([]);
  const [subjects, setSubjects] = useState<OptionSubject[]>([]);
  const [slots, setSlots] = useState<OptionSlot[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedulingRes, coursesRes] = await Promise.all([
        fetch("/api/staff/scheduling"),
        fetch("/api/staff/courses?includeInactive=1"),
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

  async function openCreateBooking() {
    setCreating(true);
    setForm(emptyForm);
    setStudents([]);
    setSlots([]);
    setFormError(null);
    setError(null);
    setOptionsLoading(true);
    try {
      const response = await fetch("/api/staff/scheduling/options");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setFormError(data.error || "Unable to load booking options.");
        return;
      }
      setHouseholds(data.households ?? []);
      setTutors(data.tutors ?? []);
      setSubjects(data.subjects ?? []);
    } catch {
      setFormError("Unable to load booking options.");
    } finally {
      setOptionsLoading(false);
    }
  }

  async function onHouseholdChange(householdId: string) {
    setForm((prev) => ({ ...prev, householdId, studentId: "" }));
    setStudents([]);
    if (!householdId) return;
    setStudentsLoading(true);
    setFormError(null);
    try {
      const response = await fetch(
        `/api/staff/scheduling/options?householdId=${encodeURIComponent(householdId)}`,
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setFormError(data.error || "Unable to load students.");
        return;
      }
      setStudents(data.students ?? []);
    } catch {
      setFormError("Unable to load students.");
    } finally {
      setStudentsLoading(false);
    }
  }

  async function onTutorChange(tutorId: string) {
    setForm((prev) => ({ ...prev, tutorId, slotId: "" }));
    setSlots([]);
    if (!tutorId) return;
    setSlotsLoading(true);
    setFormError(null);
    try {
      const response = await fetch(
        `/api/staff/scheduling/options?tutorId=${encodeURIComponent(tutorId)}`,
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setFormError(data.error || "Unable to load availability.");
        return;
      }
      setSlots(data.slots ?? []);
      setHouseholds(data.households ?? []);
      setTutors(data.tutors ?? []);
      setSubjects(data.subjects ?? []);
    } catch {
      setFormError("Unable to load availability.");
    } finally {
      setSlotsLoading(false);
    }
  }

  const openSlots = useMemo(() => slots.filter((slot) => slotOpenSeats(slot) > 0), [slots]);

  const canSubmit =
    Boolean(form.householdId && form.studentId && form.subjectId && form.tutorId && form.slotId) &&
    !saving;

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/staff/scheduling/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: form.householdId,
          studentId: form.studentId,
          tutorId: form.tutorId,
          slotId: form.slotId,
          subjectId: form.subjectId,
          notes: form.notes || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setFormError(data.error || "Unable to create booking.");
        return;
      }
      setCreating(false);
      setForm(emptyForm);
      await reload();
    } catch {
      setFormError("Unable to create booking.");
    } finally {
      setSaving(false);
    }
  }

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

  async function toggleCourseActive(course: CourseRow) {
    if (archivingId) return;
    const nextActive = !course.active;
    setArchivingId(course.id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update course status.");
        return;
      }
      const active = Boolean(data.course?.active ?? nextActive);
      setCourses((prev) => prev.map((row) => (row.id === course.id ? { ...row, active } : row)));
      setRosterCourse((prev) => (prev?.id === course.id ? { ...prev, active } : prev));
    } catch {
      setError("Unable to update course status.");
    } finally {
      setArchivingId(null);
    }
  }

  if (creating) {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="wizard-close" onClick={() => setCreating(false)} aria-label="Close">
          ×
        </button>
        <span className="eyebrow">Staff booking on behalf of a family</span>
        <h2>Create booking</h2>
        <p className="wizard-lead">
          Choose household, student, subject, tutor, and an open availability slot. Confirmed bookings appear on
          the week board and recent list.
        </p>
        <form className="wizard-stage" onSubmit={submitBooking}>
          {optionsLoading ? (
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading options…</p>
          ) : (
            <div className="input-grid">
              <label>
                Household
                <select
                  value={form.householdId}
                  onChange={(e) => void onHouseholdChange(e.target.value)}
                  required
                >
                  <option value="">Select household</option>
                  {households.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Student
                <select
                  value={form.studentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  required
                  disabled={!form.householdId || studentsLoading}
                >
                  <option value="">
                    {studentsLoading
                      ? "Loading students…"
                      : form.householdId
                        ? "Select student"
                        : "Select a household first"}
                  </option>
                  {students.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.displayName}
                      {row.gradeLabel ? ` · ${row.gradeLabel}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tutor
                <select
                  value={form.tutorId}
                  onChange={(e) => void onTutorChange(e.target.value)}
                  required
                >
                  <option value="">Select tutor</option>
                  {tutors.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Availability slot
                <select
                  value={form.slotId}
                  onChange={(e) => setForm((prev) => ({ ...prev, slotId: e.target.value }))}
                  required
                  disabled={!form.tutorId || slotsLoading}
                >
                  <option value="">
                    {slotsLoading
                      ? "Loading slots…"
                      : form.tutorId
                        ? openSlots.length
                          ? "Select open slot"
                          : "No open slots for this tutor"
                        : "Select a tutor first"}
                  </option>
                  {openSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slotChoiceLabel(slot)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Notes (optional)
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Staff notes for this booking"
                />
              </label>
            </div>
          )}
          {formError ? <div className="validation-hint">{formError}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={!canSubmit || optionsLoading}>
              {saving ? "Creating…" : "Confirm booking"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <PageIntro
        title="Scheduling"
        action={
          mode === "Week" ? (
            <button type="button" className="primary-button" onClick={() => void openCreateBooking()}>
              + Create booking
            </button>
          ) : undefined
        }
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
                        <button
                          key={`${time}-${dayIndex}`}
                          type="button"
                          className="slot-card open"
                          onClick={() => void openCreateBooking()}
                          style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                        >
                          <strong>Open</strong>
                          <small>+ Create booking</small>
                        </button>
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        <span className="pill">{capacityLabel}</span>
                        <span className="pill">{course.active ? "Active" : "Inactive"}</span>
                      </div>
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
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ marginTop: 8, width: "100%" }}
                        disabled={archivingId === course.id}
                        onClick={() => void toggleCourseActive(course)}
                      >
                        {archivingId === course.id
                          ? "Saving…"
                          : course.active
                            ? "Archive"
                            : "Reactivate"}
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
              eyebrow={
                rosterLoading
                  ? "Loading…"
                  : rosterCourse
                    ? `${rosterCourse.enrolledCount}/${rosterCourse.capacity} enrolled · ${roster.length} rows`
                    : `${roster.length} enrollments`
              }
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
                Add enrollments and change status on the{" "}
                <Link href={`/staff/scheduling/courses/${rosterCourseId}`} style={{ color: "var(--blue)", fontWeight: 800 }}>
                  full roster page
                </Link>
                .
              </p>
            </Panel>
          ) : null}
        </>
      )}
    </>
  );
}
