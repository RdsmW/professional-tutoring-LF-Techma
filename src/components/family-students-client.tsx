"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AddStudentWizard } from "@/components/add-student-wizard";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

type StudentCard = {
  id: string;
  displayName: string;
  schoolName: string | null;
  gradeLabel: string | null;
  graduationYear: number | null;
  learningNeeds: string | null;
  lifecycle: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FamilyStudentsClient({
  initialStudents,
}: {
  initialStudents: StudentCard[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState(initialStudents);
  const [adding, setAdding] = useState(searchParams.get("add") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  useEffect(() => {
    if (searchParams.get("add") === "1") setAdding(true);
  }, [searchParams]);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/family/students");
      const data = await response.json();
      if (response.ok && data.ok) setStudents(data.students);
    } catch {
      // keep current list
    }
  }, []);

  const selected = students.find((student) => student.id === selectedId) ?? null;

  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Students"
        title="Students"
        description="Each student card opens a simple detail view. Restricted education fields stay minimized and permissioned."
        action={
          <button
            type="button"
            className="primary-button family-primary"
            style={{
              border: 0,
              padding: "10px 14px",
              background: "var(--coral)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 11,
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedId(null);
              setAdding(true);
            }}
          >
            Add student
          </button>
        }
      />

      {adding ? (
        <AddStudentWizard
          open={adding}
          onClose={() => {
            setAdding(false);
            router.replace("/family/students");
          }}
          onCreated={() => {
            void reload();
          }}
        />
      ) : null}

      {selected && !adding ? (
        <section className="panel" style={{ marginBottom: 18 }}>
          <button type="button" className="page-back" onClick={() => setSelectedId(null)}>
            ← All students
          </button>
          <span className="eyebrow">Student detail</span>
          <h2 style={{ marginTop: 6 }}>{selected.displayName}</h2>
          <div className="family-detail-grid" style={{ marginTop: 16 }}>
            <span>
              <small>School</small>
              <strong>{selected.schoolName ?? "—"}</strong>
            </span>
            <span>
              <small>Grade</small>
              <strong>{selected.gradeLabel ?? "—"}</strong>
            </span>
            <span>
              <small>Graduation</small>
              <strong>{selected.graduationYear ?? "—"}</strong>
            </span>
            <span>
              <small>Status</small>
              <strong>{selected.lifecycle}</strong>
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <small style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 8 }}>
              Learning needs
            </small>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>{selected.learningNeeds ?? "—"}</p>
          </div>
          <ComingStageNote feature="Full Student Detail schedule, history, and edit with staff review" />
        </section>
      ) : null}

      {!adding ? (
        <Panel title="Your students" eyebrow="Family account">
          <div className="family-student-grid">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                className="family-student-card-shell"
                style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--line)", background: "#fff", padding: 0 }}
                onClick={() => setSelectedId(student.id)}
              >
                <div className="family-student-main" style={{ padding: 18 }}>
                  <span className={`pill ${student.lifecycle === "prospect" ? "amber" : "mint"}`}>
                    {student.lifecycle}
                  </span>
                  <span className="mini-avatar" style={{ display: "inline-grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--mint-soft)", color: "#367765", fontSize: 10, fontWeight: 800 }}>
                    {initials(student.displayName)}
                  </span>
                  <h3 style={{ margin: "12px 0 4px" }}>{student.displayName}</h3>
                  <p style={{ margin: 0, fontSize: 9, color: "var(--muted)" }}>
                    {student.schoolName ?? "School pending"} · {student.gradeLabel ?? "Grade pending"}
                  </p>
                  <b style={{ display: "block", color: "var(--blue)", fontSize: 8, marginTop: 18 }}>
                    Open detail →
                  </b>
                </div>
              </button>
            ))}
            <button
              type="button"
              className="add-student-tile"
              onClick={() => {
                setSelectedId(null);
                setAdding(true);
              }}
            >
              <span>+</span>
              <h3>Add student</h3>
              <p>Create a child profile under this Family account</p>
            </button>
          </div>
          {students.length === 0 ? (
            <p style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
              No students yet.{" "}
              <Link href="/family/onboarding" style={{ color: "var(--blue)", fontWeight: 700 }}>
                Finish onboarding
              </Link>{" "}
              if your household is still pending, then add the first child.
            </p>
          ) : null}
        </Panel>
      ) : null}
    </>
  );
}
