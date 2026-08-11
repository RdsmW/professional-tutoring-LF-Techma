"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";

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
  createdAt: string;
  studentId: string;
  householdId: string;
};

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
      setRoster(data.roster ?? []);
    } catch {
      setError("Unable to load course roster.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <>
      <Link href="/staff/scheduling" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Back to Scheduling
      </Link>
      <PageIntro
        eyebrow="Staff Operations · Scheduling · Courses"
        title={course?.name ?? "Course roster"}
        description={
          course
            ? `${course.code} · ${course.termLabel ?? "Term pending"} · ${course.scheduleSummary ?? "Schedule pending"}`
            : "Enrollment roster for this course offering."
        }
      />
      {error ? <p className="form-error">{error}</p> : null}

      <Panel
        title="Roster"
        eyebrow={
          course
            ? `${course.enrolledCount}/${course.capacity} · ${course.active ? "Active" : "Inactive"}`
            : "Course"
        }
      >
        {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading roster…</p> : null}
        {!loading && roster.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No enrollments for this course.</p>
        ) : (
          <div className="family-list">
            {roster.map((row) => (
              <div key={row.id} className="family-row">
                <div style={{ flex: 1 }}>
                  <strong>{row.studentName}</strong>
                  <small style={{ display: "block", color: "var(--muted)", marginTop: 4 }}>
                    {row.householdName} · enrolled {formatWhen(row.createdAt)}
                  </small>
                </div>
                <span className="pill" style={{ marginRight: 10 }}>
                  {row.status}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Link href={`/staff/students/${row.studentId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 9 }}>
                    Student →
                  </Link>
                  <Link href={`/staff/families/${row.householdId}`} style={{ color: "var(--blue)", fontWeight: 800, fontSize: 9 }}>
                    Household →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: 12, fontSize: 10, color: "var(--muted)" }}>
          Enrollment manage / archive actions come in a later slice.
        </p>
      </Panel>
    </>
  );
}
