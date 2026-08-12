"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type StudentRow = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  lifecycle: string;
  householdDisplayName: string;
};

const LIFECYCLE_OPTIONS = ["", "prospect", "active", "paused", "completed", "archived"];

export function StaffStudentsClient() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [applied, setApplied] = useState({ q: "", lifecycle: "", grade: "", school: "" });

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

  return (
    <>
      <PageIntro title="Students" />
      {error ? <p className="form-error">{error}</p> : null}

      <Panel title="Student directory" eyebrow="Live database">
        <form className="student-filter-panel" onSubmit={applyFilters} style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr auto auto" }}>
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

        {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading students…</p> : null}
        {students.length === 0 && !loading ? (
          <p style={{ color: "var(--muted)" }}>No students match these filters.</p>
        ) : (
          <div className="student-grid">
            {students.map((row) => (
              <Link key={row.id} href={`/staff/students/${row.id}`} className="student-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="student-card-top">
                  <span className="pill">{row.lifecycle}</span>
                </div>
                <h3>{row.displayName}</h3>
                <p>{row.schoolName ?? "School pending"}</p>
                <div className="mini-fields">
                  <span>
                    <small>Grade</small>
                    <strong>{row.gradeLabel ?? "—"}</strong>
                  </span>
                  <span>
                    <small>Household</small>
                    <strong>{row.householdDisplayName}</strong>
                  </span>
                </div>
                <span className="card-action">
                  Open detail <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
        <p style={{ marginTop: 14, fontSize: 10, color: "var(--muted)" }}>
          Best Fit assist is deferred to a later stage.
        </p>
      </Panel>
    </>
  );
}
