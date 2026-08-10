"use client";

import Link from "next/link";
import { learningNeedChips } from "@/lib/family/learning-needs";

export type StudentDetailModel = {
  id: string;
  displayName: string;
  schoolName: string | null;
  gradeLabel: string | null;
  graduationYear: number | null;
  learningNeeds: string | null;
  lifecycle: string;
  availabilityNotes: string | null;
  emergencyContact: string | null;
  changeRequestStatus: string | null;
  pendingIntakeNote: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FamilyStudentDetail({
  student,
  householdName,
  scheduleLabel,
  history,
  onBack,
  onEdit,
}: {
  student: StudentDetailModel;
  householdName: string | null;
  scheduleLabel: string;
  history: string[];
  onBack: () => void;
  onEdit: () => void;
}) {
  const chips = learningNeedChips(student.learningNeeds);
  const visibleHistory = history.filter(
    (item) => item !== "No services selected yet" || history.length <= 2,
  );

  return (
    <>
      <button type="button" className="page-back" onClick={onBack}>
        ← All students
      </button>
      <section className="student-detail-hero">
        <span className="student-detail-avatar">{initials(student.displayName)}</span>
        <div>
          <span className="eyebrow">Student detail</span>
          <h2>{student.displayName}</h2>
          <p>
            {student.schoolName ?? "School pending"} · {student.gradeLabel ?? "Grade pending"}
            {student.graduationYear ? ` · Graduation ${student.graduationYear}` : ""}
          </p>
        </div>
        <span className="pill mint">
          Family account{householdName ? `: ${householdName}` : ""}
        </span>
      </section>

      <section className="student-detail-grid">
        <article className="panel">
          <span className="eyebrow">Profile</span>
          <h3>Learning needs</h3>
          <div className="field-cloud">
            {chips.length > 0 ? chips.map((chip) => <span key={chip}>{chip}</span>) : <span>None listed</span>}
          </div>
          <div className="privacy-callout compact">
            <span>i</span>
            <div>
              <strong>Restricted notes protected</strong>
              <p>Only approved staff roles may view sensitive education details.</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <span className="eyebrow">Schedule</span>
          <h3>{scheduleLabel}</h3>
          <Link href="/family/calendar" className="text-button" style={{ display: "inline-block", marginTop: 12 }}>
            Open family calendar →
          </Link>
        </article>

        <article className="panel history-panel">
          <span className="eyebrow">Service history</span>
          <h3>Student timeline</h3>
          {visibleHistory.map((item) => (
            <div key={item}>
              <span />
              {item}
            </div>
          ))}
          {student.changeRequestStatus === "Pending staff review" ? (
            <div>
              <span />
              Change request pending staff review
            </div>
          ) : null}
        </article>
      </section>

      <section className="student-actions">
        <Link href={`/family/book-tutoring?studentId=${student.id}`}>
          <span>01</span>
          <strong>Book individual tutoring</strong>
          <small>One-time or recurring schedule</small>
        </Link>
        <Link href={`/family/enroll-courses?studentId=${student.id}`}>
          <span>02</span>
          <strong>Enroll in a course</strong>
          <small>Fixed curriculum and dates</small>
        </Link>
        <button type="button" onClick={onEdit}>
          <span>03</span>
          <strong>Edit student profile</strong>
          <small>Guardian-authorized fields and review requests</small>
        </button>
      </section>
    </>
  );
}
