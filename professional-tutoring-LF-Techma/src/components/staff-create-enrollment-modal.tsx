"use client";

import { useEffect, useState } from "react";
import { IconClose, StaffIconButton } from "@/components/staff-action-icons";

export type StaffCreateEnrollmentStudent = {
  id: string;
  displayName: string;
};

type CourseOption = {
  id: string;
  code: string;
  name: string;
  termLabel: string | null;
  capacity: number;
  enrolledCount: number;
};

export function StaffCreateEnrollmentModal({
  householdId,
  students,
  lockedStudentId,
  onClose,
  onCreated,
}: {
  householdId: string;
  students: StaffCreateEnrollmentStudent[];
  lockedStudentId?: string;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const studentLocked = Boolean(lockedStudentId);
  const [studentId, setStudentId] = useState(
    lockedStudentId || (students.length === 1 ? students[0].id : ""),
  );
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const response = await fetch("/api/staff/courses?includeInactive=0");
        const data = await response.json();
        if (!response.ok || !data.ok) {
          if (!cancelled) setError(data.error || "Unable to load courses.");
          return;
        }
        if (!cancelled) {
          setCourses(
            (data.courses ?? []).map(
              (row: {
                id: string;
                code: string;
                name: string;
                termLabel: string | null;
                capacity: number;
                enrolledCount: number;
              }) => ({
                id: row.id,
                code: row.code,
                name: row.name,
                termLabel: row.termLabel,
                capacity: row.capacity,
                enrolledCount: row.enrolledCount,
              }),
            ),
          );
        }
      } catch {
        if (!cancelled) setError("Unable to load courses.");
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCourse = courses.find((course) => course.id === courseId) ?? null;
  const courseFull = selectedCourse
    ? selectedCourse.enrolledCount >= selectedCourse.capacity
    : false;
  const canSave = Boolean(householdId && studentId && courseId && !saving && !courseFull);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/courses/${courseId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          studentId,
          status: "submitted",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create enrollment.");
        return;
      }
      await onCreated();
    } catch {
      setError("Unable to create enrollment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="staff-modal family-list-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-create-enrollment-title"
      >
        <div className="family-list-modal-header">
          <h3 id="staff-create-enrollment-title">Add enrollment</h3>
          <StaffIconButton label="Close" title="Cancel" tone="muted" disabled={saving} onClick={onClose}>
            <IconClose size={18} />
          </StaffIconButton>
        </div>
        <form className="staff-modal-form" onSubmit={(event) => void submit(event)}>
          <div className="input-grid staff-modal-fields">
            {studentLocked ? null : (
              <label>
                Student
                <select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  required
                  disabled={saving || students.length === 0}
                >
                  <option value="">{students.length === 0 ? "No students in this family" : "Select student…"}</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Course offering
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                required
                disabled={saving || loadingCourses || courses.length === 0}
              >
                <option value="">
                  {loadingCourses
                    ? "Loading courses…"
                    : courses.length === 0
                      ? "No open course offerings"
                      : "Select course…"}
                </option>
                {courses.map((course) => {
                  const seatsLeft = Math.max(0, course.capacity - course.enrolledCount);
                  const full = seatsLeft === 0;
                  return (
                    <option key={course.id} value={course.id} disabled={full}>
                      {course.name} ({course.code}
                      {course.termLabel ? ` · ${course.termLabel}` : ""})
                      {full ? " · full" : ` · ${seatsLeft} seat${seatsLeft === 1 ? "" : "s"}`}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="staff-modal-actions">
            <button type="button" className="secondary-button" disabled={saving} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={!canSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
