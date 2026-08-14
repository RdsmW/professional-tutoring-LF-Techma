"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { GENDER, GRADE_LABELS, GRADUATION_YEARS } from "@/lib/forms/options";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

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
  canDelete: boolean;
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

type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  birthdate: string;
  gradeLabel: string;
  graduationYear: string;
  schoolName: string;
  email: string;
  cellPhone: string;
  learningNeeds: string;
  availabilityNotes: string;
  emergencyContact: string;
};

const LIFECYCLE_OPTIONS = ["prospect", "active", "paused", "completed", "archived"];

function toProfileForm(student: StudentDetail): ProfileForm {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    displayName: student.displayName,
    gender: student.gender ?? "",
    birthdate: student.birthdate ?? "",
    gradeLabel: student.gradeLabel ?? "",
    graduationYear: student.graduationYear != null ? String(student.graduationYear) : "",
    schoolName: student.schoolName ?? "",
    email: student.email ?? "",
    cellPhone: student.cellPhone ?? "",
    learningNeeds: student.learningNeeds ?? "",
    availabilityNotes: student.availabilityNotes ?? "",
    emergencyContact: student.emergencyContact ?? "",
  };
}

export function StaffStudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [lifecycle, setLifecycle] = useState("prospect");
  const [saving, setSaving] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

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

  async function setLifecycleStatus(nextLifecycle: "active" | "archived") {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextLifecycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update status.");
        return;
      }
      const next = data.student as StudentDetail;
      setStudent(next);
      setLifecycle(next.lifecycle);
      setSaveMessage(nextLifecycle === "archived" ? "Student archived." : "Student restored.");
    } catch {
      setError("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function deleteStudent() {
    if (!student?.canDelete || lifecycleBusy) return;
    if (!window.confirm("Permanently delete this student? This cannot be undone.")) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete student.");
        return;
      }
      router.push("/staff/students");
    } catch {
      setError("Unable to delete student.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  function openEdit() {
    if (!student) return;
    setProfileForm(toProfileForm(student));
    setEditing(true);
    setError(null);
    setSaveMessage(null);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || savingProfile) return;
    setSavingProfile(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          displayName: profileForm.displayName,
          gender: profileForm.gender || null,
          birthdate: profileForm.birthdate || null,
          gradeLabel: profileForm.gradeLabel || null,
          graduationYear: profileForm.graduationYear ? Number(profileForm.graduationYear) : null,
          schoolName: profileForm.schoolName || null,
          email: profileForm.email || null,
          cellPhone: profileForm.cellPhone || null,
          learningNeeds: profileForm.learningNeeds || null,
          availabilityNotes: profileForm.availabilityNotes || null,
          emergencyContact: profileForm.emergencyContact || null,
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
      setProfileForm(toProfileForm(next));
      setEditing(false);
      setSaveMessage("Profile saved.");
    } catch {
      setError("Unable to save student.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading student…</p>;
  if (error && !student) return <p className="form-error">{error}</p>;
  if (!student) return null;

  const isArchived = student.lifecycle === "archived";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <Link href="/staff/students" className="page-back">
          ← Students
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="secondary-button" onClick={openEdit}>
            Edit
          </button>
          {isArchived ? (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void setLifecycleStatus("active")}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void setLifecycleStatus("archived")}
            >
              Archive
            </button>
          )}
          {student.canDelete ? (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void deleteStudent()}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <PageIntro
        title={student.displayName}
        description={`${student.gradeLabel || "Grade pending"} · ${student.schoolName || "School pending"}`}
        action={<span className={`pill ${statusTone(student.lifecycle)}`}>{formatStatusLabel(student.lifecycle)}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {saveMessage ? <p style={{ fontSize: 14, marginBottom: 12, color: "var(--mint)" }}>{saveMessage}</p> : null}

      {editing && profileForm ? (
        <Panel title="Edit student">
          <form onSubmit={(e) => void saveProfile(e)} className="input-grid" style={{ gap: 12 }}>
            <label>
              First name
              <input
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                required
              />
            </label>
            <label>
              Preferred name
              <input
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Gender
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              >
                <option value="">—</option>
                {GENDER.options.map((option) => (
                  <option key={option.id} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Birthdate
              <input
                value={profileForm.birthdate}
                onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
                placeholder="YYYY-MM-DD"
              />
            </label>
            <label>
              Grade
              <select
                value={profileForm.gradeLabel}
                onChange={(e) => setProfileForm({ ...profileForm, gradeLabel: e.target.value })}
              >
                <option value="">—</option>
                {GRADE_LABELS.options.map((option) => (
                  <option key={option.id} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Grad year
              <select
                value={profileForm.graduationYear}
                onChange={(e) => setProfileForm({ ...profileForm, graduationYear: e.target.value })}
              >
                <option value="">—</option>
                {GRADUATION_YEARS.options.map((option) => (
                  <option key={option.id} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              School
              <input
                value={profileForm.schoolName}
                onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </label>
            <label>
              Cell phone
              <input
                type="tel"
                value={profileForm.cellPhone}
                onChange={(e) => setProfileForm({ ...profileForm, cellPhone: e.target.value })}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Learning needs
              <textarea
                value={profileForm.learningNeeds}
                onChange={(e) => setProfileForm({ ...profileForm, learningNeeds: e.target.value })}
                rows={3}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Availability
              <textarea
                value={profileForm.availabilityNotes}
                onChange={(e) => setProfileForm({ ...profileForm, availabilityNotes: e.target.value })}
                rows={3}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Emergency contact
              <textarea
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                rows={2}
              />
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="primary-button" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={savingProfile}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

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
                <span className={`pill ${statusTone(booking.status)}`}>{formatStatusLabel(booking.status)}</span>
                <b>{booking.id.slice(0, 8)}</b>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
