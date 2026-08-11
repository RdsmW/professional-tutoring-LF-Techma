"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type TutorDetail = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  maxSeatsPerSlot: number;
  notes: string | null;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    priority: number;
  }>;
  workloadCount: number;
};

export function StaffTutorDetailClient({ tutorId }: { tutorId: string }) {
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [maxSeatsPerSlot, setMaxSeatsPerSlot] = useState("1");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingSeats, setSavingSeats] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load tutor.");
        return;
      }
      setTutor(data.tutor);
      setNotes(data.tutor.notes ?? "");
      setMaxSeatsPerSlot(String(data.tutor.maxSeatsPerSlot ?? 1));
    } catch {
      setError("Unable to load tutor.");
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function patchTutor(body: Record<string, unknown>, mode: "notes" | "seats" | "active") {
    setError(null);
    setMessage(null);
    if (mode === "notes") setSavingNotes(true);
    if (mode === "seats") setSavingSeats(true);
    if (mode === "active") setTogglingActive(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update tutor.");
        return;
      }
      setMessage("Saved.");
      await reload();
    } catch {
      setError("Unable to update tutor.");
    } finally {
      setSavingNotes(false);
      setSavingSeats(false);
      setTogglingActive(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading tutor…</p>;
  if (error && !tutor) return <p className="form-error">{error}</p>;
  if (!tutor) return null;

  return (
    <>
      <Link href="/staff/tutors" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Tutors
      </Link>
      <PageIntro
        eyebrow="Staff · Tutor Detail"
        title={tutor.displayName}
        description="Profile, capacity, subjects, and active workload."
        action={<span className="pill">{tutor.active ? "Active" : "Inactive"}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p style={{ fontSize: 11, marginBottom: 12 }}>{message}</p> : null}

      <div className="profile-layout">
        <Panel title="Profile" eyebrow="Tutor">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Email</small>
              <strong>{tutor.email || "—"}</strong>
            </span>
            <span>
              <small>Phone</small>
              <strong>{tutor.phone || "—"}</strong>
            </span>
            <span>
              <small>Status</small>
              <strong>{tutor.active ? "Active" : "Inactive"}</strong>
            </span>
            <span>
              <small>Workload</small>
              <strong>
                {tutor.workloadCount} open booking{tutor.workloadCount === 1 ? "" : "s"}
              </strong>
            </span>
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ marginTop: 14 }}
            disabled={togglingActive}
            onClick={() => void patchTutor({ active: !tutor.active }, "active")}
          >
            {togglingActive ? "Updating…" : tutor.active ? "Deactivate tutor" : "Activate tutor"}
          </button>
        </Panel>

        <Panel title="Capacity" eyebrow="Seats">
          <label>
            Max seats per slot
            <input
              type="number"
              min={1}
              value={maxSeatsPerSlot}
              onChange={(e) => setMaxSeatsPerSlot(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 12 }}
            disabled={savingSeats}
            onClick={() => {
              const seats = Number.parseInt(maxSeatsPerSlot, 10);
              void patchTutor({ maxSeatsPerSlot: seats }, "seats");
            }}
          >
            {savingSeats ? "Saving…" : "Save seats"}
          </button>
        </Panel>
      </div>

      <Panel title="Notes" eyebrow="Internal">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 12 }}
          disabled={savingNotes}
          onClick={() => void patchTutor({ notes }, "notes")}
        >
          {savingNotes ? "Saving…" : "Save notes"}
        </button>
      </Panel>

      <Panel title="Subjects" eyebrow="Coverage">
        {tutor.subjects.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 11 }}>
            No subjects linked yet. Subject assignment deferred.
          </p>
        ) : (
          tutor.subjects.map((subject) => (
            <div key={subject.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
              <strong>{subject.name}</strong>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--muted)" }}>
                {subject.code}
                {subject.priority ? ` · priority ${subject.priority}` : ""}
              </p>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}
