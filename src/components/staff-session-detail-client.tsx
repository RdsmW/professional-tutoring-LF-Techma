"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type SessionDetail = {
  id: string;
  status: string;
  seatsClaimed: number;
  cancellationReason: string | null;
  attendanceStatus: string | null;
  attendanceNotes: string | null;
  attendanceRecordedAt: string | null;
  attendanceRecordedByStaffId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    gradeLabel: string | null;
    schoolName: string | null;
  };
  household: {
    id: string;
    displayName: string;
  };
  tutor: {
    id: string;
    displayName: string | null;
  } | null;
  subject: {
    id: string;
    name: string | null;
    code: string | null;
  } | null;
  slot: {
    id: string;
    dayOfWeek: number | null;
    startTimeLocal: string | null;
    endTimeLocal: string | null;
    label: string | null;
  } | null;
};

const ATTENDANCE_OPTIONS = ["", "present", "absent", "late", "excused"];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusTone(status: string) {
  if (status === "confirmed" || status === "present") return "mint";
  if (status === "cancelled" || status === "absent" || status === "failed") return "coral";
  if (status === "late" || status === "excused") return "amber";
  return "amber";
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSlot(slot: SessionDetail["slot"]) {
  if (!slot) return "Slot pending";
  const day =
    slot.dayOfWeek != null && slot.dayOfWeek >= 0 && slot.dayOfWeek <= 6
      ? DAY_LABELS[slot.dayOfWeek]
      : null;
  const range =
    slot.startTimeLocal && slot.endTimeLocal
      ? `${slot.startTimeLocal}–${slot.endTimeLocal}`
      : slot.startTimeLocal || null;
  const parts = [day, range, slot.label].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Slot linked";
}

export function StaffSessionDetailClient({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/sessions/${sessionId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load session.");
        return;
      }
      const next = data.session as SessionDetail;
      setSession(next);
      setAttendanceStatus(next.attendanceStatus ?? "");
      setAttendanceNotes(next.attendanceNotes ?? "");
    } catch {
      setError("Unable to load session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveAttendance() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/staff/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceStatus: attendanceStatus || null,
          attendanceNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save attendance.");
        return;
      }
      const next = data.session as SessionDetail;
      setSession(next);
      setAttendanceStatus(next.attendanceStatus ?? "");
      setAttendanceNotes(next.attendanceNotes ?? "");
      setSaveMessage("Attendance saved.");
    } catch {
      setError("Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading session…</p>;
  if (error && !session) return <p className="form-error">{error}</p>;
  if (!session) return null;

  return (
    <>
      <Link href="/staff/sessions" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Sessions
      </Link>
      <PageIntro
        title={session.student.displayName}
        description={`${session.subject?.name || "Subject pending"} · ${formatSlot(session.slot)}`}
        action={<span className={`pill ${statusTone(session.status)}`}>{statusLabel(session.status)}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {saveMessage ? <p style={{ fontSize: 14, marginBottom: 12, color: "var(--mint)" }}>{saveMessage}</p> : null}

      <div className="profile-layout">
        <Panel title="Profile summary" eyebrow="Booking as session">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Student</small>
              <strong>
                <Link href={`/staff/students/${session.student.id}`} style={{ color: "var(--blue)" }}>
                  {session.student.displayName}
                </Link>
              </strong>
            </span>
            <span>
              <small>Household</small>
              <strong>
                <Link href={`/staff/families/${session.household.id}`} style={{ color: "var(--blue)" }}>
                  {session.household.displayName}
                </Link>
              </strong>
            </span>
            <span>
              <small>Tutor</small>
              <strong>
                {session.tutor ? (
                  <Link href={`/staff/tutors/${session.tutor.id}`} style={{ color: "var(--blue)" }}>
                    {session.tutor.displayName || "Named tutor"}
                  </Link>
                ) : (
                  "Tutor pending"
                )}
              </strong>
            </span>
            <span>
              <small>Subject</small>
              <strong>
                {session.subject
                  ? `${session.subject.name}${session.subject.code ? ` (${session.subject.code})` : ""}`
                  : "—"}
              </strong>
            </span>
            <span>
              <small>Slot</small>
              <strong>{formatSlot(session.slot)}</strong>
            </span>
            <span>
              <small>Seats</small>
              <strong>{session.seatsClaimed}</strong>
            </span>
            <span>
              <small>Grade / school</small>
              <strong>
                {session.student.gradeLabel || "—"} · {session.student.schoolName || "—"}
              </strong>
            </span>
            <span>
              <small>Created</small>
              <strong>{formatWhen(session.createdAt)}</strong>
            </span>
            <span>
              <small>Confirmed</small>
              <strong>{formatWhen(session.confirmedAt)}</strong>
            </span>
            {session.cancellationReason ? (
              <span>
                <small>Cancellation reason</small>
                <strong style={{ whiteSpace: "pre-wrap" }}>{session.cancellationReason}</strong>
              </span>
            ) : null}
          </div>
        </Panel>

        <Panel title="Attendance">
          <label style={{ display: "block", marginBottom: 10 }}>
            <span
              style={{
                display: "block",
                fontSize: 14,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 6,
              }}
            >
              Status
            </span>
            <select
              value={attendanceStatus}
              onChange={(e) => setAttendanceStatus(e.target.value)}
              style={{ height: 36, minWidth: 180 }}
            >
              {ATTENDANCE_OPTIONS.map((value) => (
                <option key={value || "unset"} value={value}>
                  {value ? statusLabel(value) : "Not recorded"}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span
              style={{
                display: "block",
                fontSize: 14,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 6,
              }}
            >
              Notes
            </span>
            <textarea
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                border: "1px solid var(--line)",
                padding: 10,
                fontSize: 14,
                background: "#fbfcfa",
              }}
            />
          </label>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--muted)" }}>
            Last recorded: {formatWhen(session.attendanceRecordedAt)}
            {session.attendanceStatus ? (
              <>
                {" "}
                · <span className={`pill ${statusTone(session.attendanceStatus)}`}>{statusLabel(session.attendanceStatus)}</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 12 }}
            disabled={saving}
            onClick={() => void saveAttendance()}
          >
            {saving ? "Saving…" : "Save attendance"}
          </button>
        </Panel>
      </div>
    </>
  );
}
