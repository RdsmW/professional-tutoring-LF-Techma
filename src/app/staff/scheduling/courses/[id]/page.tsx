"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type CourseMeta = {
  id: string;
  code: string;
  name: string;
  termLabel: string | null;
  scheduleSummary: string | null;
  capacity: number;
  enrolledCount: number;
  active: boolean;
};

type RosterRow = {
  id: string;
  studentName: string;
  householdName: string;
  status: string;
  notes: string | null;
  createdAt: string;
  studentId: string;
  householdId: string;
};

type FamilyOption = { id: string; displayName: string };
type StudentOption = { id: string; displayName: string };

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function StaffCourseRosterPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [course, setCourse] = useState<CourseMeta | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [householdId, setHouseholdId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [enrollStatus, setEnrollStatus] = useState("submitted");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/courses/${id}/roster`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load course roster.");
        return;
      }
      setCourse(data.course ?? null);
      const rows: RosterRow[] = data.roster ?? [];
      setRoster(rows);
      setDraftStatus(Object.fromEntries(rows.map((row) => [row.id, row.status])));
    } catch {
      setError("Unable to load course roster.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/staff/families");
        const data = await response.json();
        if (!cancelled && response.ok && data.ok) {
          setFamilies(
            (data.families ?? []).map((row: { id: string; displayName: string }) => ({
              id: row.id,
              displayName: row.displayName,
            })),
          );
        }
      } catch {
        /* soft-fail options */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStudentId("");
    setStudents([]);
    if (!householdId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/staff/students?householdId=${encodeURIComponent(householdId)}`);
        const data = await response.json();
        if (!cancelled && response.ok && data.ok) {
          setStudents(
            (data.students ?? []).map((row: { id: string; displayName: string }) => ({
              id: row.id,
              displayName: row.displayName,
            })),
          );
        }
      } catch {
        /* soft-fail options */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  async function submitEnrollment(event: React.FormEvent) {
    event.preventDefault();
    if (!id || enrolling) return;
    setEnrolling(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/courses/${id}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          studentId,
          status: enrollStatus,
          notes: enrollNotes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to enroll student.");
        return;
      }
      setMessage("Enrollment added.");
      setEnrollNotes("");
      setStudentId("");
      await reload();
    } catch {
      setError("Unable to enroll student.");
    } finally {
      setEnrolling(false);
    }
  }

  async function toggleCourseActive() {
    if (!id || !course || togglingActive) return;
    const nextActive = !course.active;
    setTogglingActive(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update course status.");
        return;
      }
      setCourse((prev) => (prev ? { ...prev, active: Boolean(data.course?.active) } : prev));
      setMessage(nextActive ? "Course reactivated." : "Course archived.");
    } catch {
      setError("Unable to update course status.");
    } finally {
      setTogglingActive(false);
    }
  }

  async function saveEnrollmentStatus(enrollmentId: string) {
    if (!id || savingId) return;
    const status = draftStatus[enrollmentId];
    if (!status) return;
    setSavingId(enrollmentId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/courses/${id}/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update enrollment.");
        return;
      }
      setMessage("Enrollment status saved.");
      if (data.course && course) {
        setCourse({ ...course, enrolledCount: data.course.enrolledCount, capacity: data.course.capacity });
      }
      await reload();
    } catch {
      setError("Unable to update enrollment.");
    } finally {
      setSavingId(null);
    }
  }

  const seatsLeft = course ? Math.max(0, course.capacity - course.enrolledCount) : 0;
  const atCapacity = course ? course.enrolledCount >= course.capacity : false;

  return (
    <>
      <Link href="/staff/scheduling" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Back to Scheduling
      </Link>
      <PageIntro
        title={course?.name ?? "Course roster"}
        description={
          course
            ? `${course.code} · ${course.termLabel ?? "Term pending"} · ${course.scheduleSummary ?? "Schedule pending"}`
            : "Enrollment roster for this course offering."
        }
      />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p style={{ color: "var(--blue)", fontSize: 14, fontWeight: 700 }}>{message}</p> : null}

      <Panel
        title="Capacity"
        eyebrow={course ? (course.active ? "Active offering" : "Inactive") : "Course"}
      >
        {course ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <p style={{ margin: 0, flex: 1, minWidth: 180 }}>
              <strong>
                {course.enrolledCount}/{course.capacity}
              </strong>{" "}
              enrolled
              <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                {atCapacity ? "Full — active enrollments blocked" : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
              </span>
              {!course.active ? (
                <span className={`pill ${statusTone("inactive")}`} style={{ marginLeft: 8 }}>
                  {formatStatusLabel("inactive")}
                </span>
              ) : null}
            </p>
            <button
              type="button"
              className="secondary-button"
              disabled={togglingActive}
              onClick={() => void toggleCourseActive()}
            >
              {togglingActive ? "Saving…" : course.active ? "Archive" : "Reactivate"}
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading…</p>
        )}
      </Panel>

      <Panel title="Add enrollment" eyebrow="Staff create">
        <form className="input-grid" onSubmit={(event) => void submitEnrollment(event)}>
          <label>
            Household
            <select value={householdId} onChange={(event) => setHouseholdId(event.target.value)} required>
              <option value="">Select household…</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Student
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
              disabled={!householdId}
            >
              <option value="">{householdId ? "Select student…" : "Pick a household first"}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={enrollStatus} onChange={(event) => setEnrollStatus(event.target.value)}>
              {ENROLLMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <input
              value={enrollNotes}
              onChange={(event) => setEnrollNotes(event.target.value)}
              placeholder="Optional staff note"
            />
          </label>
          <button type="submit" className="primary-button" disabled={enrolling || !householdId || !studentId}>
            {enrolling ? "Enrolling…" : "Add enrollment"}
          </button>
        </form>
      </Panel>

      <Panel
        title="Roster"
        eyebrow={
          course
            ? `${course.enrolledCount}/${course.capacity} active seats · ${roster.length} rows`
            : "Course"
        }
      >
        {loading ? <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading roster…</p> : null}
        {!loading && roster.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No enrollments for this course.</p>
        ) : (
          <div className="family-list">
            {roster.map((row) => {
              const dirty = (draftStatus[row.id] ?? row.status) !== row.status;
              return (
                <div key={row.id} className="family-row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <strong>{row.studentName}</strong>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>
                      {row.householdName} · enrolled {formatWhen(row.createdAt)}
                    </small>
                    {row.notes ? (
                      <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>{row.notes}</small>
                    ) : null}
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 700 }}>
                    Status
                    <select
                      value={draftStatus[row.id] ?? row.status}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        setDraftStatus((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                    >
                      {ENROLLMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ height: 36, alignSelf: "flex-end" }}
                    disabled={!dirty || savingId === row.id}
                    onClick={() => void saveEnrollmentStatus(row.id)}
                  >
                    {savingId === row.id ? "Saving…" : "Save"}
                  </button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Link href={`/staff/students/${row.studentId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 14 }}>
                      Student →
                    </Link>
                    <Link href={`/staff/families/${row.householdId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 14 }}>
                      Household →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
