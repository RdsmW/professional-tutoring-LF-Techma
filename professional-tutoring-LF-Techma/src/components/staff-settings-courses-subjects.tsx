"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  IconArchive,
  IconClose,
  IconPencil,
  IconPlus,
  IconRestore,
  IconTrash,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { Panel } from "@/components/ui";

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

type EditorKind = "subject" | "course" | null;

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
  const toast = useAppToast();
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorKind>(null);
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        fetch("/api/staff/subjects?includeInactive=1"),
        fetch("/api/staff/courses"),
      ]);
      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();
      if (!subjectsRes.ok || !subjectsData.ok) {
        setLoadError(subjectsData.error || "Unable to load subjects.");
        setSubjects([]);
      } else {
        setSubjects(subjectsData.subjects ?? []);
      }
      if (!coursesRes.ok || !coursesData.ok) {
        setLoadError((prev) => prev ?? coursesData.error ?? "Unable to load courses.");
        setCourses([]);
      } else {
        setCourses(coursesData.courses ?? []);
      }
    } catch {
      setLoadError("Unable to load courses and subjects.");
      setSubjects([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const closeEditor = useCallback(() => {
    if (busyId) return;
    setEditor(null);
    setSubjectForm(emptySubjectForm);
    setCourseForm(emptyCourseForm);
    setEditingSubjectId(null);
    setEditingCourseId(null);
    setEditorError(null);
  }, [busyId]);

  useEffect(() => {
    if (!editor) {
      const element = lastFocusedElement.current;
      if (element) {
        window.requestAnimationFrame(() => element.focus());
        lastFocusedElement.current = null;
      }
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
      if (event.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;
      if (busyId) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busyId, closeEditor, editor]);

  useEffect(() => {
    if (!busyId) return;
    modalRef.current?.focus();
  }, [busyId]);

  function rememberFocus() {
    lastFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function openSubjectEditor(subject?: CatalogSubject) {
    rememberFocus();
    setEditorError(null);
    setEditingCourseId(null);
    setCourseForm(emptyCourseForm);
    setEditingSubjectId(subject?.id ?? null);
    setSubjectForm(
      subject
        ? { name: subject.name, code: subject.code, category: subject.category ?? "" }
        : emptySubjectForm,
    );
    setEditor("subject");
  }

  function openCourseEditor(course?: CatalogCourse) {
    rememberFocus();
    setEditorError(null);
    setEditingSubjectId(null);
    setSubjectForm(emptySubjectForm);
    setEditingCourseId(course?.id ?? null);
    setCourseForm(
      course
        ? {
            name: course.name,
            code: course.code,
            termLabel: course.termLabel ?? "",
            scheduleSummary: course.scheduleSummary ?? "",
            capacity: String(course.capacity),
            instructorName: course.instructorName ?? "",
          }
        : emptyCourseForm,
    );
    setEditor("course");
  }

  async function saveSubject() {
    const name = subjectForm.name.trim();
    const code = subjectForm.code.trim();
    if (!name || !code) {
      const message = "Enter a subject name and code.";
      setEditorError(message);
      toast.error(message);
      return;
    }
    const subjectId = editingSubjectId;
    setBusyId(subjectId ?? "subject-new");
    try {
      const response = await fetch(subjectId ? `/api/staff/subjects/${subjectId}` : "/api/staff/subjects", {
        method: subjectId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          category: subjectForm.category.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const message = data.error || "Unable to save subject.";
        setEditorError(message);
        toast.error(message);
        return;
      }
      toast.success(subjectId ? "Subject updated." : "Subject created.");
      setEditor(null);
      setSubjectForm(emptySubjectForm);
      setEditingSubjectId(null);
      setEditorError(null);
      await reload();
    } catch {
      const message = "Unable to save subject.";
      setEditorError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSubjectActive(subject: CatalogSubject) {
    setBusyId(subject.id);
    try {
      const response = await fetch(`/api/staff/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !subject.active }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to update subject.");
        return;
      }
      toast.success(subject.active ? "Subject deactivated." : "Subject activated.");
      await reload();
    } catch {
      toast.error("Unable to update subject.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSubject(subject: CatalogSubject) {
    if (!window.confirm(`Permanently delete subject “${subject.name}”? Only unused subjects can be deleted.`)) return;
    setBusyId(subject.id);
    try {
      const response = await fetch(`/api/staff/subjects/${subject.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to delete subject.");
        return;
      }
      toast.success("Subject deleted.");
      await reload();
    } catch {
      toast.error("Unable to delete subject.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveCourse() {
    const name = courseForm.name.trim();
    const code = courseForm.code.trim();
    const capacity = Number(courseForm.capacity);
    if (!name || !code) {
      const message = "Enter a course name and code.";
      setEditorError(message);
      toast.error(message);
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      const message = "Course capacity must be a positive number.";
      setEditorError(message);
      toast.error(message);
      return;
    }
    const courseId = editingCourseId;
    setBusyId(courseId ?? "course-new");
    try {
      const response = await fetch(courseId ? `/api/staff/courses/${courseId}` : "/api/staff/courses", {
        method: courseId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          termLabel: courseForm.termLabel.trim() || null,
          scheduleSummary: courseForm.scheduleSummary.trim() || null,
          instructorName: courseForm.instructorName.trim() || null,
          capacity,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const message = data.error || "Unable to save course.";
        setEditorError(message);
        toast.error(message);
        return;
      }
      toast.success(courseId ? "Course updated." : "Course created.");
      setEditor(null);
      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      setEditorError(null);
      await reload();
    } catch {
      const message = "Unable to save course.";
      setEditorError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleCourseActive(course: CatalogCourse) {
    setBusyId(course.id);
    try {
      const response = await fetch(`/api/staff/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !course.active }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to update course.");
        return;
      }
      toast.success(course.active ? "Course deactivated." : "Course activated.");
      await reload();
    } catch {
      toast.error("Unable to update course.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      {loadError ? <p className="form-error">{loadError}</p> : null}

      <Panel>
        <div className="catalog-table-heading">
          <div>
            <h2 className="staff-section-title">Subjects</h2>
            <p>Catalog used for tutor assignment and scheduling.</p>
          </div>
          <StaffIconButton
            label="Add subject"
            tone="edit"
            className="catalog-add-button"
            onClick={() => openSubjectEditor()}
          >
            <IconPlus />
            <span>Add subject</span>
          </StaffIconButton>
        </div>
        {loading ? (
          <p className="catalog-table-empty">Loading…</p>
        ) : subjects.length === 0 ? (
          <p className="catalog-table-empty">No subjects yet.</p>
        ) : (
          <div className="report-definition-list catalog-definition-list">
            <div
              className="report-definition-head catalog-subject-grid"
            >
              <span>Name</span>
              <span>Code</span>
              <span>Category</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {subjects.map((subject) => (
              <div className="catalog-subject-grid catalog-definition-row" key={subject.id}>
                <strong>{subject.name}</strong>
                <span>{subject.code}</span>
                <span>{subject.category || "—"}</span>
                <span className={`pill ${subject.active ? "green" : "amber"}`}>
                  {subject.active ? "Active" : "Inactive"}
                </span>
                <div className="catalog-row-actions">
                  <StaffIconButton
                    label="Edit subject"
                    tone="edit"
                    disabled={busyId === subject.id}
                    onClick={() => openSubjectEditor(subject)}
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

      <Panel>
        <div className="catalog-table-heading">
          <div>
            <h2 className="staff-section-title">Courses</h2>
            <p>Group course offerings available to families.</p>
          </div>
          <StaffIconButton
            label="Add course"
            tone="edit"
            className="catalog-add-button"
            onClick={() => openCourseEditor()}
          >
            <IconPlus />
            <span>Add course</span>
          </StaffIconButton>
        </div>
        {loading ? (
          <p className="catalog-table-empty">Loading…</p>
        ) : courses.length === 0 ? (
          <p className="catalog-table-empty">No courses yet.</p>
        ) : (
          <div className="report-definition-list catalog-definition-list">
            <div className="report-definition-head catalog-course-grid">
              <span>Name</span>
              <span>Code</span>
              <span>Term</span>
              <span>Seats</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {courses.map((course) => (
              <div className="catalog-course-grid catalog-definition-row" key={course.id}>
                <div>
                  <strong>{course.name}</strong>
                  {course.scheduleSummary ? <small>{course.scheduleSummary}</small> : null}
                </div>
                <span>{course.code}</span>
                <span>{course.termLabel || "—"}</span>
                <span>
                  {course.enrolledCount}/{course.capacity}
                </span>
                <span className={`pill ${course.active ? "green" : "amber"}`}>
                  {course.active ? "Active" : "Inactive"}
                </span>
                <div className="catalog-row-actions">
                  <StaffIconButton
                    label="Edit course"
                    tone="edit"
                    disabled={busyId === course.id}
                    onClick={() => openCourseEditor(course)}
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

      {editor === "subject" ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <div
            ref={modalRef}
            className="staff-modal catalog-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-editor-title"
            aria-busy={Boolean(busyId)}
            tabIndex={-1}
          >
            <div className="family-list-modal-header">
              <h3 id="subject-editor-title">{editingSubjectId ? "Edit subject" : "Add subject"}</h3>
              <StaffIconButton label="Close" tone="muted" disabled={!!busyId} onClick={closeEditor}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <form
              className="staff-modal-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void saveSubject();
              }}
            >
              {editorError ? (
                <p className="form-error" role="alert" aria-live="assertive">
                  {editorError}
                </p>
              ) : null}
              <div className="input-grid staff-modal-fields">
                <label>
                  Name
                  <input
                    autoFocus
                    value={subjectForm.name}
                    aria-invalid={Boolean(editorError && !subjectForm.name.trim())}
                    onChange={(event) => {
                      setEditorError(null);
                      setSubjectForm((prev) => ({ ...prev, name: event.target.value }));
                    }}
                    placeholder="Algebra"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Code
                  <input
                    value={subjectForm.code}
                    aria-invalid={Boolean(editorError && !subjectForm.code.trim())}
                    onChange={(event) => {
                      setEditorError(null);
                      setSubjectForm((prev) => ({ ...prev, code: event.target.value }));
                    }}
                    placeholder="ALG"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Category
                  <input
                    value={subjectForm.category}
                    onChange={(event) => {
                      setEditorError(null);
                      setSubjectForm((prev) => ({ ...prev, category: event.target.value }));
                    }}
                    placeholder="Math"
                    disabled={!!busyId}
                  />
                </label>
              </div>
              <div className="staff-modal-actions">
                <button type="button" className="secondary-button" disabled={!!busyId} onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={!!busyId}>
                  {busyId ? "Saving…" : editingSubjectId ? "Save changes" : "Add subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editor === "course" ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <div
            ref={modalRef}
            className="staff-modal catalog-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-editor-title"
            aria-busy={Boolean(busyId)}
            tabIndex={-1}
          >
            <div className="family-list-modal-header">
              <h3 id="course-editor-title">{editingCourseId ? "Edit course" : "Add course"}</h3>
              <StaffIconButton label="Close" tone="muted" disabled={!!busyId} onClick={closeEditor}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <form
              className="staff-modal-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void saveCourse();
              }}
            >
              {editorError ? (
                <p className="form-error" role="alert" aria-live="assertive">
                  {editorError}
                </p>
              ) : null}
              <div className="input-grid staff-modal-fields">
                <label>
                  Name
                  <input
                    autoFocus
                    value={courseForm.name}
                    aria-invalid={Boolean(editorError && !courseForm.name.trim())}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, name: event.target.value }));
                    }}
                    placeholder="SAT Math Intensive"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Code
                  <input
                    value={courseForm.code}
                    aria-invalid={Boolean(editorError && !courseForm.code.trim())}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, code: event.target.value }));
                    }}
                    placeholder="SAT-MATH"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Term
                  <input
                    value={courseForm.termLabel}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, termLabel: event.target.value }));
                    }}
                    placeholder="Fall 2026"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Schedule summary
                  <input
                    value={courseForm.scheduleSummary}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, scheduleSummary: event.target.value }));
                    }}
                    placeholder="Tue/Thu 4–5pm"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Instructor
                  <input
                    value={courseForm.instructorName}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, instructorName: event.target.value }));
                    }}
                    placeholder="Name or —"
                    disabled={!!busyId}
                  />
                </label>
                <label>
                  Capacity
                  <input
                    value={courseForm.capacity}
                    type="number"
                    min="1"
                    aria-invalid={Boolean(editorError && (!Number.isFinite(Number(courseForm.capacity)) || Number(courseForm.capacity) < 1))}
                    onChange={(event) => {
                      setEditorError(null);
                      setCourseForm((prev) => ({ ...prev, capacity: event.target.value }));
                    }}
                    inputMode="numeric"
                    disabled={!!busyId}
                  />
                </label>
              </div>
              <div className="staff-modal-actions">
                <button type="button" className="secondary-button" disabled={!!busyId} onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={!!busyId}>
                  {busyId ? "Saving…" : editingCourseId ? "Save changes" : "Add course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}