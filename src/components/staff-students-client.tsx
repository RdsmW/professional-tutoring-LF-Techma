"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type StudentRow = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  lifecycle: string;
  householdDisplayName: string;
};

type HouseholdOption = {
  id: string;
  displayName: string;
};

const LIFECYCLE_OPTIONS = ["", "prospect", "active", "paused", "completed", "archived"];

export function StaffStudentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [households, setHouseholds] = useState<HouseholdOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ householdId: "", displayName: "", gradeLabel: "" });
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [applied, setApplied] = useState({ q: "", lifecycle: "", grade: "", school: "" });

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreating(true);
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
              className="wizard-back"
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

      <Panel>
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
              {LIFECYCLE_OPTIONS.map((value) => (
                <option key={value || "all"} value={value}>
                  {value || "All"}
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
          <button type="submit" className="primary-button" style={{ height: 36, alignSelf: "end" }}>
            Filter
          </button>
          <button type="button" className="secondary-button" style={{ height: 36, alignSelf: "end" }} onClick={clearFilters}>
            Clear
          </button>
        </form>

        {loading ? <p className="dashboard-empty">Loading students…</p> : null}
        {students.length === 0 && !loading ? (
          <p className="dashboard-empty">No students match these filters.</p>
        ) : (
          <div className="table-panel students-table compact-table">
            <div
              className="table-head"
              style={{ gridTemplateColumns: "1.4fr 1.2fr 1.2fr 0.7fr 0.8fr 0.6fr" }}
            >
              <span>Name</span>
              <span>Household</span>
              <span>School</span>
              <span>Grade</span>
              <span>Lifecycle</span>
              <span />
            </div>
            {students.map((row) => (
              <Link
                key={row.id}
                href={`/staff/students/${row.id}`}
                className="table-row"
                style={{
                  gridTemplateColumns: "1.4fr 1.2fr 1.2fr 0.7fr 0.8fr 0.6fr",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong>{row.displayName}</strong>
                <span>{row.householdDisplayName}</span>
                <span>{row.schoolName ?? "—"}</span>
                <span>{row.gradeLabel ?? "—"}</span>
                <span className={`pill ${statusTone(row.lifecycle)}`}>{formatStatusLabel(row.lifecycle)}</span>
                <span className="table-open">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
