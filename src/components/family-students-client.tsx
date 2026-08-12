"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AddStudentWizard } from "@/components/add-student-wizard";
import {
  FamilyStudentDetail,
  type StudentDetailModel,
} from "@/components/family-student-detail";
import { FamilyStudentEdit } from "@/components/family-student-edit";
import { useFamilyPortal } from "@/components/family-portal-context";
import { PageIntro } from "@/components/ui";
import { learningNeedChips } from "@/lib/family/learning-needs";

type StudentCard = {
  id: string;
  displayName: string;
  schoolName: string | null;
  gradeLabel: string | null;
  graduationYear: number | null;
  learningNeeds: string | null;
  lifecycle: string;
};

type StudentMode = "list" | "detail" | "edit";

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

function cardToDetail(student: StudentCard): StudentDetailModel {
  return {
    id: student.id,
    displayName: student.displayName,
    schoolName: student.schoolName,
    gradeLabel: student.gradeLabel,
    graduationYear: student.graduationYear,
    learningNeeds: student.learningNeeds,
    lifecycle: student.lifecycle,
    availabilityNotes: null,
    emergencyContact: null,
    changeRequestStatus: null,
    pendingIntakeNote: null,
  };
}

export function FamilyStudentsClient({
  initialStudents,
}: {
  initialStudents: StudentCard[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { householdName, displayName } = useFamilyPortal();
  const [students, setStudents] = useState(initialStudents);
  const [adding, setAdding] = useState(searchParams.get("add") === "1");
  const [mode, setMode] = useState<StudentMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetailModel | null>(null);
  const [scheduleLabel, setScheduleLabel] = useState("No active schedule");
  const [history, setHistory] = useState<string[]>(["Student profile created", "No services selected yet"]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const studentDeepLinkHandled = useRef(false);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/family/students");
      const data = await response.json();
      if (response.ok && data.ok) setStudents(data.students);
    } catch {
      // keep current list
    }
  }, []);

  const loadDetail = useCallback(async (studentId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/family/students/${studentId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setDetailError(data.error ?? "Unable to load student detail.");
        return false;
      }
      setDetail(data.student as StudentDetailModel);
      setScheduleLabel(data.scheduleLabel ?? "No active schedule");
      setHistory(Array.isArray(data.history) ? data.history : []);
      return true;
    } catch {
      setDetailError("Unable to load student detail.");
      return false;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  async function openDetail(studentId: string) {
    setSelectedId(studentId);
    setAdding(false);
    setMode("detail");
    const fallback = students.find((student) => student.id === studentId);
    if (fallback) setDetail(cardToDetail(fallback));
    await loadDetail(studentId);
  }

  async function openEdit(studentId: string) {
    setSelectedId(studentId);
    setAdding(false);
    const fallback = students.find((student) => student.id === studentId);
    if (fallback) setDetail(cardToDetail(fallback));
    const ok = await loadDetail(studentId);
    if (ok) setMode("edit");
    else setMode("detail");
  }

  function backToList() {
    setMode("list");
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAdding(true);
      setMode("list");
      setSelectedId(null);
      setListError(null);
      return;
    }
    if (studentDeepLinkHandled.current) return;
    const studentId = searchParams.get("studentId");
    if (!studentId) return;
    studentDeepLinkHandled.current = true;
    const match = students.find((student) => student.id === studentId);
    if (!match) {
      setListError("That student was not found in this household.");
      return;
    }
    setListError(null);
    void openDetail(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep-link after students load
  }, [searchParams, students]);

  if (adding) {
    return (
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
    );
  }

  if (mode === "edit" && detail) {
    return (
      <FamilyStudentEdit
        student={detail}
        guardianLabel={displayName || "Guardian"}
        onCancel={() => {
          setMode("detail");
          if (selectedId) void loadDetail(selectedId);
        }}
        onSaved={(student) => {
          setDetail(student);
          setStudents((current) =>
            current.map((row) =>
              row.id === student.id
                ? {
                    ...row,
                    displayName: student.displayName,
                    schoolName: student.schoolName,
                    gradeLabel: student.gradeLabel,
                    graduationYear: student.graduationYear,
                  }
                : row,
            ),
          );
        }}
      />
    );
  }

  if (mode === "detail" && selectedId) {
    return (
      <>
        {detailLoading && !detail ? (
          <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading student detail…</p>
        ) : null}
        {detailError ? <div className="validation-hint">{detailError}</div> : null}
        {detail ? (
          <FamilyStudentDetail
            student={detail}
            householdName={householdName}
            scheduleLabel={scheduleLabel}
            history={history}
            onBack={backToList}
            onEdit={() => setMode("edit")}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <PageIntro
        title="Students"
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

      {listError ? <p className="form-error" style={{ marginBottom: 12 }}>{listError}</p> : null}

      <section className="family-student-grid">
        {students.map((student) => {
          const chips = learningNeedChips(student.learningNeeds, 4);
          const active = student.lifecycle === "active";
          return (
            <article className="family-student-card-shell" key={student.id}>
              <button
                type="button"
                className="family-student-main"
                onClick={() => void openDetail(student.id)}
              >
                <div className="student-card-top">
                  <span className="student-detail-avatar small">{initials(student.displayName)}</span>
                  <span className={`pill ${active ? "mint" : "amber"}`}>{statusLabel(student.lifecycle)}</span>
                </div>
                <h3>{student.displayName}</h3>
                <p>
                  {student.schoolName ?? "School pending"} · {student.gradeLabel ?? "Grade pending"}
                </p>
                <div className="field-cloud">
                  {chips.length > 0 ? (
                    chips.map((chip) => <span key={chip}>{chip}</span>)
                  ) : (
                    <span>Needs not listed yet</span>
                  )}
                </div>
                <b>Open Student Detail →</b>
              </button>
              <button
                type="button"
                className="card-edit-action"
                aria-label={`Edit ${student.displayName} profile`}
                onClick={() => void openEdit(student.id)}
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

      {students.length === 0 ? (
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
