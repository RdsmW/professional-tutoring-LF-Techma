"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { DirectoryViewToggle } from "@/components/directory-view-toggle";
import { StaffDirectoryCard } from "@/components/staff-directory-card";
import { StaffDirectoryFilters, StaffRowActions, lifecycleActions } from "@/components/staff-row-actions";
import { useDirectoryView } from "@/lib/ui/directory-view";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type StudentRow = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  lifecycle: string;
  householdDisplayName: string;
  canDelete: boolean;
};

type HouseholdOption = {
  id: string;
  displayName: string;
};

const LIFECYCLE_OPTIONS = [
  { value: "", label: "All (non-archived)" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All statuses" },
] as const;

export function StaffStudentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { view, setView } = useDirectoryView("pt.dirView.staff.students", "table");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [households, setHouseholds] = useState<HouseholdOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({ householdId: "", displayName: "", gradeLabel: "" });
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [applied, setApplied] = useState({ q: "", lifecycle: "", grade: "", school: "" });

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreating(true);
    const householdId = searchParams.get("householdId") || searchParams.get("household") || "";
    if (householdId) {
      setForm((prev) => ({ ...prev, householdId }));
    }
  }, [searchParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.lifecycle) params.set("lifecycle", applied.lifecycle);
      if (applied.grade) params.set("grade", applied.grade);
      if (applied.school) params.set("school", applied.school);
      const query = params.toString();
      const response = await fetch(`/api/staff/students${query ? `?${query}` : ""}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load students.");
        return;
      }
      setStudents(data.students ?? []);
    } catch {
      setError("Unable to load students.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const showStaffRetry =
    Boolean(error) &&
    (error!.toLowerCase().includes("staff profile") || error!.toLowerCase().includes("database not configured"));

  useEffect(() => {
    if (!creating) return;
    void (async () => {
      try {
        const response = await fetch("/api/staff/families");
        const data = await response.json();
        if (response.ok && data.ok) {
          setHouseholds(
            (data.families ?? []).map((row: { id: string; displayName: string }) => ({
              id: row.id,
              displayName: row.displayName,
            })),
          );
        }
      } catch {
        // leave empty; form will show error on save if needed
      }
    })();
  }, [creating]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setApplied({
      q: q.trim(),
      lifecycle,
      grade: grade.trim(),
      school: school.trim(),
    });
  }

  function clearFilters() {
    setQ("");
    setLifecycle("");
    setGrade("");
    setSchool("");
    setApplied({ q: "", lifecycle: "", grade: "", school: "" });
  }

  async function setStudentLifecycle(id: string, nextLifecycle: string) {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextLifecycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update student.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to update student.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteStudent(id: string) {
    if (busyId) return;
    if (!window.confirm("Permanently delete this student? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete student.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to delete student.");
    } finally {
      setBusyId(null);
    }
  }

  async function createStudent(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create student.");
        return;
      }
      router.push(`/staff/students/${data.studentId}`);
    } catch {
      setError("Unable to create student.");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <section className="wizard-shell panel">
        <button
          type="button"
          className="page-back"
          onClick={() => {
            setCreating(false);
            router.replace("/staff/students");
          }}
        >
          ← Students
        </button>
        <h2>New student</h2>
        <form className="wizard-stage" onSubmit={createStudent}>
          <div className="input-grid">
            <label>
              Household
              <select
                value={form.householdId}
                onChange={(e) => setForm({ ...form, householdId: e.target.value })}
                required
              >
                <option value="">Select family</option>
                {households.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Student name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Grade (optional)
              <input
                value={form.gradeLabel}
                onChange={(e) => setForm({ ...form, gradeLabel: e.target.value })}
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setCreating(false);
                router.replace("/staff/students");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Creating…" : "Create student"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <PageIntro
        title="Students"
        action={
          <button type="button" className="primary-button" onClick={() => setCreating(true)}>
            + New Student
          </button>
        }
      />
      {error ? (
        <p className="form-error">
          {error}
          {showStaffRetry ? (
            <>
              {" "}
              <button type="button" className="text-button" onClick={() => void reload()} disabled={loading}>
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="directory-toolbar">
        <StaffDirectoryFilters>
          <form
            className="student-filter-panel"
            onSubmit={applyFilters}
            style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr auto auto" }}
          >
            <label className="student-search">
              Search name
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student name" />
            </label>
            <label>
              Lifecycle
              <select value={lifecycle} onChange={(e) => setLifecycle(e.target.value)}>
                {LIFECYCLE_OPTIONS.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Grade
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade" />
            </label>
            <label>
              School
              <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School" />
            </label>
            <button type="submit" className="filter-btn">
              Filter
            </button>
            <button type="button" className="clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </form>
        </StaffDirectoryFilters>
        <DirectoryViewToggle view={view} onChange={setView} label="Students layout" />
      </div>

      <Panel>
        {loading ? <p className="dashboard-empty">Loading students…</p> : null}
        {students.length === 0 && !loading ? (
          <p className="dashboard-empty">No students match these filters.</p>
        ) : view === "cards" ? (
          <div className="staff-dir-card-grid">
            {students.map((row) => {
              const actions = lifecycleActions({
                isArchived: row.lifecycle === "archived",
                canDelete: Boolean(row.canDelete),
                busy: busyId === row.id,
                onEdit: () => router.push(`/staff/students/${row.id}?edit=1`),
                onArchive: () => void setStudentLifecycle(row.id, "archived"),
                onRestore: () => void setStudentLifecycle(row.id, "active"),
                onDelete: () => void deleteStudent(row.id),
              });
              return (
                <StaffDirectoryCard
                  key={row.id}
                  title={row.displayName}
                  subtitle={row.householdDisplayName}
                  status={
                    <span className={`pill ${statusTone(row.lifecycle)}`}>
                      {formatStatusLabel(row.lifecycle)}
                    </span>
                  }
                  fields={[
                    { label: "Grade", value: row.gradeLabel ?? "—" },
                    { label: "School", value: row.schoolName ?? "—" },
                  ]}
                  actions={actions}
                  onOpen={() => router.push(`/staff/students/${row.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-students">
              <span>Name</span>
              <span>Household</span>
              <span>Grade</span>
              <span>School</span>
              <span className="staff-dir-col-status">Status</span>
              <span className="staff-dir-col-actions" aria-label="Actions" />
            </div>
            {students.map((row) => (
              <div
                key={row.id}
                className="table-row staff-dir-cols-students"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/staff/students/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/staff/students/${row.id}`);
                  }
                }}
              >
                <strong>{row.displayName}</strong>
                <span>{row.householdDisplayName}</span>
                <span>{row.gradeLabel ?? "—"}</span>
                <span>{row.schoolName ?? "—"}</span>
                <span className="staff-dir-col-status">
                  <span className={`pill ${statusTone(row.lifecycle)}`}>{formatStatusLabel(row.lifecycle)}</span>
                </span>
                <span className="staff-dir-col-actions">
                  <StaffRowActions
                    label="Row actions"
                    actions={lifecycleActions({
                      isArchived: row.lifecycle === "archived",
                      canDelete: Boolean(row.canDelete),
                      busy: busyId === row.id,
                      onEdit: () => router.push(`/staff/students/${row.id}?edit=1`),
                      onArchive: () => void setStudentLifecycle(row.id, "archived"),
                      onRestore: () => void setStudentLifecycle(row.id, "active"),
                      onDelete: () => void deleteStudent(row.id),
                    })}
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
