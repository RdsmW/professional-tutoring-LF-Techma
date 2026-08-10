"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AddStudentWizard } from "@/components/add-student-wizard";
import { ComingStageNote, PageIntro } from "@/components/ui";
import { learningNeedChips, learningNeedNotes } from "@/lib/family/learning-needs";

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

function statusLabel(lifecycle: string) {
  if (lifecycle === "active") return "Active";
  if (lifecycle === "prospect") return "Needs service";
  return lifecycle;
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
  const selectedChips = learningNeedChips(selected?.learningNeeds);
  const selectedNotes = learningNeedNotes(selected?.learningNeeds);

  return (
    <>
      <PageIntro
        eyebrow="Children in this Family account"
        title="Students"
        description="Every child has a clickable detail record with profile, learning needs, schedule, service history, and next actions."
        action={
          <button
            type="button"
            className="family-primary"
            style={{ border: 0, padding: "10px 14px", cursor: "pointer" }}
            onClick={() => {
              setSelectedId(null);
              setAdding(true);
            }}
          >
            + Add student
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
              <strong>{statusLabel(selected.lifecycle)}</strong>
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <small style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 8 }}>
              Learning needs
            </small>
            <div className="field-cloud" style={{ marginTop: 8 }}>
              {selectedChips.length > 0 ? (
                selectedChips.map((chip) => <span key={chip}>{chip}</span>)
              ) : (
                <span>None listed</span>
              )}
            </div>
            {selectedNotes ? <p style={{ margin: "10px 0 0", fontSize: 11 }}>{selectedNotes}</p> : null}
          </div>
          <ComingStageNote feature="Full Student Detail schedule, history, and edit with staff review" />
        </section>
      ) : null}

      {!adding ? (
        <section className="family-student-grid">
          {students.map((student) => {
            const chips = learningNeedChips(student.learningNeeds, 4);
            const active = student.lifecycle === "active";
            return (
              <article className="family-student-card-shell" key={student.id}>
                <button
                  type="button"
                  className="family-student-main"
                  onClick={() => setSelectedId(student.id)}
                >
                  <span className={`pill ${active ? "mint" : "amber"}`}>{statusLabel(student.lifecycle)}</span>
                  <span className="student-detail-avatar small">{initials(student.displayName)}</span>
                  <h3>{student.displayName}</h3>
                  <p>
                    {student.schoolName ?? "School pending"} · {student.gradeLabel ?? "Grade pending"}
                  </p>
                  {chips.length > 0 ? (
                    <div className="field-cloud">
                      {chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  ) : null}
                  <b>Open Student Detail →</b>
                </button>
                <button
                  type="button"
                  className="card-edit-action"
                  aria-label={`Edit ${student.displayName} profile`}
                  onClick={() => setSelectedId(student.id)}
                >
                  Edit profile
                </button>
              </article>
            );
          })}
          <button
            type="button"
            className="add-student-tile"
            onClick={() => {
              setSelectedId(null);
              setAdding(true);
            }}
          >
            <span>＋</span>
            <h3>Add another student</h3>
            <p>Create another child profile under this Family account.</p>
          </button>
        </section>
      ) : null}

      {!adding && students.length === 0 ? (
        <p style={{ marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
          No students yet.{" "}
          <Link href="/family/onboarding" style={{ color: "var(--blue)", fontWeight: 700 }}>
            Finish onboarding
          </Link>{" "}
          if your household is still pending, then add the first child.
        </p>
      ) : null}
    </>
  );
}
