"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type StudentDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  gradeLabel: string | null;
  lifecycle: string;
  cellPhone: string | null;
  email: string | null;
  birthdate: string | null;
  learningNeeds: string | null;
  supportNotesRestricted: string | null;
  availabilityNotes: string | null;
  emergencyContact: string | null;
  changeRequestStatus: string | null;
  pendingIntakeNote: string | null;
  household: {
    id: string;
    displayName: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    tutorName: string | null;
    createdAt: string;
  }>;
};

const LIFECYCLE_OPTIONS = ["prospect", "active", "paused", "completed", "archived"];

export function StaffStudentDetailClient({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [lifecycle, setLifecycle] = useState("prospect");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load student.");
        return;
      }
      const next = data.student as StudentDetail;
      setStudent(next);
      setNotes(next.supportNotesRestricted ?? "");
      setLifecycle(next.lifecycle);
    } catch {
      setError("Unable to load student.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveStaffFields() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportNotesRestricted: notes,
          lifecycle,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save student.");
        return;
      }
      const next = data.student as StudentDetail;
      setStudent(next);
      setNotes(next.supportNotesRestricted ?? "");
      setLifecycle(next.lifecycle);
      setSaveMessage("Saved.");
    } catch {
      setError("Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading student…</p>;
  if (error && !student) return <p className="form-error">{error}</p>;
  if (!student) return null;

  return (
    <>
      <Link href="/staff/students" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Students
      </Link>
      <PageIntro
        title={student.displayName}
        description={`${student.gradeLabel || "Grade pending"} · ${student.schoolName || "School pending"}`}
        action={<span className="pill">{student.lifecycle}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {saveMessage ? <p style={{ fontSize: 14, marginBottom: 12, color: "var(--mint)" }}>{saveMessage}</p> : null}

      <div className="profile-layout">
        <Panel title="Profile" eyebrow="Student">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Legal name</small>
              <strong>
                {student.firstName} {student.lastName}
              </strong>
            </span>
            <span>
              <small>Preferred name</small>
              <strong>{student.displayName}</strong>
            </span>
            <span>
              <small>Gender</small>
              <strong>{student.gender || "—"}</strong>
            </span>
            <span>
              <small>Birthdate</small>
              <strong>{student.birthdate || "—"}</strong>
            </span>
            <span>
              <small>Grade</small>
              <strong>{student.gradeLabel || "—"}</strong>
            </span>
            <span>
              <small>Grad year</small>
              <strong>{student.graduationYear ?? "—"}</strong>
            </span>
            <span>
              <small>School</small>
              <strong>{student.schoolName || "—"}</strong>
            </span>
            <span>
              <small>Email</small>
              <strong>{student.email || "—"}</strong>
            </span>
            <span>
              <small>Cell phone</small>
              <strong>{student.cellPhone || "—"}</strong>
            </span>
            <span>
              <small>Change request</small>
              <strong>{student.changeRequestStatus || "—"}</strong>
            </span>
          </div>
        </Panel>

        <Panel title="Household">
          <p style={{ margin: "0 0 10px", fontSize: 14 }}>
            <Link href={`/staff/families/${student.household.id}`} style={{ color: "var(--blue)", fontWeight: 700 }}>
              {student.household.displayName}
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>Open the family record for guardians and invites.</p>
        </Panel>
      </div>

      <div className="profile-layout">
        <Panel title="Learning needs">
          <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{student.learningNeeds || "—"}</p>
          {student.pendingIntakeNote ? (
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--muted)" }}>
              Pending intake: {student.pendingIntakeNote}
            </p>
          ) : null}
        </Panel>

        <Panel title="Availability & emergency" eyebrow="Scheduling">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Availability</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.availabilityNotes || "—"}</strong>
            </span>
            <span>
              <small>Emergency contact</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.emergencyContact || "—"}</strong>
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="Restricted staff notes">
        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ display: "block", fontSize: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
            Lifecycle
          </span>
          <select value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} style={{ height: 36, minWidth: 180 }}>
            {LIFECYCLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
            Restricted notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            style={{ width: "100%", border: "1px solid var(--line)", padding: 10, fontSize: 14, background: "#fbfcfa" }}
          />
        </label>
        <div className="restricted-line" style={{ marginTop: 10 }}>
          Visible to staff only — not shown on the family portal.
        </div>
        <button type="button" className="primary-button" style={{ marginTop: 12 }} disabled={saving} onClick={() => void saveStaffFields()}>
          {saving ? "Saving…" : "Save notes & lifecycle"}
        </button>
      </Panel>

      <Panel title="Recent bookings">
        {student.bookings.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No bookings yet.</p>
        ) : (
          <div className="table-panel">
            {student.bookings.map((booking) => (
              <div key={booking.id} className="family-row" style={{ cursor: "default" }}>
                <span
                  className="avatar"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--blue-soft)",
                    color: "var(--blue)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  {booking.status.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{booking.status}</strong>
                  <small>
                    {booking.tutorName ? `Tutor: ${booking.tutorName}` : "Tutor unassigned"} ·{" "}
                    {new Date(booking.createdAt).toLocaleString()}
                  </small>
                </span>
                <span className="pill">{booking.status}</span>
                <b>{booking.id.slice(0, 8)}</b>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
