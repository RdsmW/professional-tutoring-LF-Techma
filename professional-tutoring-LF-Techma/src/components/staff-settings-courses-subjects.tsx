"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/ui";
import {
  IconArchive,
  IconPencil,
  IconRestore,
  IconTrash,
  StaffIconButton,
} from "@/components/staff-action-icons";

type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  active: boolean;
};

type CatalogCourse = {
  id: string;
  code: string;
  name: string;
  termLabel: string | null;
  scheduleSummary: string | null;
  capacity: number;
  enrolledCount: number;
  active: boolean;
  description: string | null;
  instructorName: string | null;
};

const emptySubjectForm = { name: "", code: "", category: "" };
const emptyCourseForm = {
  name: "",
  code: "",
  termLabel: "",
  scheduleSummary: "",
  capacity: "20",
  instructorName: "",
};

export function StaffSettingsCoursesSubjectsPanel() {
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        fetch("/api/staff/subjects?includeInactive=1"),
        fetch("/api/staff/courses"),
      ]);
      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();
      if (!subjectsRes.ok || !subjectsData.ok) {
        setError(subjectsData.error || "Unable to load subjects.");
        setSubjects([]);
      } else {
        setSubjects(subjectsData.subjects ?? []);
      }
      if (!coursesRes.ok || !coursesData.ok) {
        setError((prev) => prev ?? coursesData.error ?? "Unable to load courses.");
        setCourses([]);
      } else {
        setCourses(coursesData.courses ?? []);
      }
    } catch {
      setError("Unable to load courses and subjects.");
      setSubjects([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function flash(next: string) {
    setMessage(next);
    setError(null);
  }

  async function saveSubject() {
    const name = subjectForm.name.trim();
    const code = subjectForm.code.trim();
    if (!name || !code) {
      setError("Subject name and code are required.");
      return;
    }
    setBusyId(editingSubjectId ?? "subject-new");
    setError(null);
    try {
      const response = await fetch(
        editingSubjectId ? `/api/staff/subjects/${editingSubjectId}` : "/api/staff/subjects",
        {
          method: editingSubjectId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            category: subjectForm.category.trim() || null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save subject.");
        return;
      }
      setSubjectForm(emptySubjectForm);
      setEditingSubjectId(null);
      flash(editingSubjectId ? "Subject updated." : "Subject created.");
      await reload();
    } catch {
      setError("Unable to save subject.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSubjectActive(subject: CatalogSubject) {
    setBusyId(subject.id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !subject.active }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update subject.");
        return;
      }
      flash(subject.active ? "Subject deactivated." : "Subject activated.");
      await reload();
    } catch {
      setError("Unable to update subject.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSubject(subject: CatalogSubject) {
    if (!window.confirm(`Permanently delete subject “${subject.name}”? Only unused subjects can be deleted.`)) {
      return;
    }
    setBusyId(subject.id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/subjects/${subject.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete subject.");
        return;
      }
      if (editingSubjectId === subject.id) {
        setEditingSubjectId(null);
        setSubjectForm(emptySubjectForm);
      }
      flash("Subject deleted.");
      await reload();
    } catch {
      setError("Unable to delete subject.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveCourse() {
    const name = courseForm.name.trim();
    const code = courseForm.code.trim();
    const capacity = Number(courseForm.capacity);
    if (!name || !code) {
      setError("Course name and code are required.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setError("Course capacity must be a positive number.");
      return;
    }
    setBusyId(editingCourseId ?? "course-new");
    setError(null);
    try {
      const payload = {
        name,
        code,
        termLabel: courseForm.termLabel.trim() || null,
        scheduleSummary: courseForm.scheduleSummary.trim() || null,
        instructorName: courseForm.instructorName.trim() || null,
        capacity,
      };
      const response = await fetch(
        editingCourseId ? `/api/staff/courses/${editingCourseId}` : "/api/staff/courses",
        {
          method: editingCourseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save course.");
        return;
      }
      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      flash(editingCourseId ? "Course updated." : "Course created.");
      await reload();
    } catch {
      setError("Unable to save course.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleCourseActive(course: CatalogCourse) {
    setBusyId(course.id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !course.active }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update course.");
        return;
      }
      flash(course.active ? "Course deactivated." : "Course activated.");
      await reload();
    } catch {
      setError("Unable to update course.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? (
        <div className="validation-line">
          <span>✓</span>
          {message}
        </div>
      ) : null}

      <Panel title="Subjects">
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Catalog used for tutor assignment and scheduling. Inactive subjects stay hidden from tutor pickers.
        </p>
        <div className="input-grid">
          <label>
            Name
            <input
              value={subjectForm.name}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Algebra"
            />
          </label>
          <label>
            Code
            <input
              value={subjectForm.code}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="ALG"
            />
          </label>
          <label>
            Category
            <input
              value={subjectForm.category}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Math"
            />
          </label>
        </div>
        <div className="settings-save-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="family-primary"
            disabled={!!busyId}
            onClick={() => void saveSubject()}
          >
            {editingSubjectId ? "Save subject" : "Add subject"}
          </button>
          {editingSubjectId ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditingSubjectId(null);
                setSubjectForm(emptySubjectForm);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p>
        ) : subjects.length === 0 ? (
          <p style={{ color: "var(--muted)", marginTop: 16 }}>No subjects yet.</p>
        ) : (
          <div className="report-definition-list" style={{ marginTop: 16 }}>
            <div
              className="report-definition-head"
              style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr 1fr .6fr auto", gap: 12 }}
            >
              <span>Name</span>
              <span>Code</span>
              <span>Category</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr .7fr 1fr .6fr auto",
                  gap: 12,
                  alignItems: "center",
                  borderTop: "1px solid var(--line)",
                  padding: "12px 15px",
                }}
              >
                <strong>{subject.name}</strong>
                <span>{subject.code}</span>
                <span>{subject.category || "—"}</span>
                <span className={`pill ${subject.active ? "green" : "amber"}`}>
                  {subject.active ? "Active" : "Inactive"}
                </span>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <StaffIconButton
                    label="Edit subject"
                    tone="edit"
                    disabled={busyId === subject.id}
                    onClick={() => {
                      setEditingSubjectId(subject.id);
                      setSubjectForm({
                        name: subject.name,
                        code: subject.code,
                        category: subject.category ?? "",
                      });
                    }}
                  >
                    <IconPencil />
                  </StaffIconButton>
                  <StaffIconButton
                    label={subject.active ? "Deactivate subject" : "Activate subject"}
                    tone={subject.active ? "archive" : "restore"}
                    disabled={busyId === subject.id}
                    onClick={() => void toggleSubjectActive(subject)}
                  >
                    {subject.active ? <IconArchive /> : <IconRestore />}
                  </StaffIconButton>
                  <StaffIconButton
                    label="Delete subject"
                    tone="danger"
                    disabled={busyId === subject.id}
                    onClick={() => void deleteSubject(subject)}
                  >
                    <IconTrash />
                  </StaffIconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Course offerings">
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          Light catalog for group courses. Deactivate to hide from family enrollment options.
        </p>
        <div className="input-grid">
          <label>
            Name
            <input
              value={courseForm.name}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="SAT Math Intensive"
            />
          </label>
          <label>
            Code
            <input
              value={courseForm.code}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="SAT-MATH"
            />
          </label>
          <label>
            Term
            <input
              value={courseForm.termLabel}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, termLabel: event.target.value }))}
              placeholder="Fall 2026"
            />
          </label>
          <label>
            Schedule summary
            <input
              value={courseForm.scheduleSummary}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, scheduleSummary: event.target.value }))
              }
              placeholder="Tue/Thu 4–5pm"
            />
          </label>
          <label>
            Instructor
            <input
              value={courseForm.instructorName}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, instructorName: event.target.value }))
              }
              placeholder="Name or —"
            />
          </label>
          <label>
            Capacity
            <input
              value={courseForm.capacity}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, capacity: event.target.value }))}
              inputMode="numeric"
            />
          </label>
        </div>
        <div className="settings-save-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="family-primary"
            disabled={!!busyId}
            onClick={() => void saveCourse()}
          >
            {editingCourseId ? "Save course" : "Add course"}
          </button>
          {editingCourseId ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditingCourseId(null);
                setCourseForm(emptyCourseForm);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading…</p>
        ) : courses.length === 0 ? (
          <p style={{ color: "var(--muted)", marginTop: 16 }}>No course offerings yet.</p>
        ) : (
          <div className="report-definition-list" style={{ marginTop: 16 }}>
            <div
              className="report-definition-head"
              style={{ display: "grid", gridTemplateColumns: "1.5fr .7fr 1fr .5fr .6fr auto", gap: 12 }}
            >
              <span>Name</span>
              <span>Code</span>
              <span>Term</span>
              <span>Seats</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr .7fr 1fr .5fr .6fr auto",
                  gap: 12,
                  alignItems: "center",
                  borderTop: "1px solid var(--line)",
                  padding: "12px 15px",
                }}
              >
                <div>
                  <strong>{course.name}</strong>
                  {course.scheduleSummary ? (
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>{course.scheduleSummary}</div>
                  ) : null}
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {course.instructorName?.trim() || "—"}
                  </div>
                </div>
                <span>{course.code}</span>
                <span>{course.termLabel || "—"}</span>
                <span>
                  {course.enrolledCount}/{course.capacity}
                </span>
                <span className={`pill ${course.active ? "green" : "amber"}`}>
                  {course.active ? "Active" : "Inactive"}
                </span>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <StaffIconButton
                    label="Edit course"
                    tone="edit"
                    disabled={busyId === course.id}
                    onClick={() => {
                      setEditingCourseId(course.id);
                      setCourseForm({
                        name: course.name,
                        code: course.code,
                        termLabel: course.termLabel ?? "",
                        scheduleSummary: course.scheduleSummary ?? "",
                        capacity: String(course.capacity),
                        instructorName: course.instructorName ?? "",
                      });
                    }}
                  >
                    <IconPencil />
                  </StaffIconButton>
                  <StaffIconButton
                    label={course.active ? "Deactivate course" : "Activate course"}
                    tone={course.active ? "archive" : "restore"}
                    disabled={busyId === course.id}
                    onClick={() => void toggleCourseActive(course)}
                  >
                    {course.active ? <IconArchive /> : <IconRestore />}
                  </StaffIconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
