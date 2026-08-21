"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Slot = {
  id: string;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  openSeats: number;
};

type Detail = {
  request: {
    id: string;
    status: string;
    studentName: string;
    familyName: string;
    subjectName: string;
    scheduleNotes: string | null;
    schedulingPath: string | null;
    identityReview: string | null;
    occupyingBooking: { id: string } | null;
    preferredSlot: { openSeats: number; full: boolean } | null;
  };
  compatible: Array<{
    windowId: string;
    windowLabel: string;
    tutors: Array<{
      id: string;
      displayName: string;
      slots: Slot[];
    }>;
  }>;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function StaffTutoringRequestAssignClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ tutorId: string; slotId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/staff/tutoring-requests/${requestId}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load this registration.");
          return;
        }
        setDetail(data);
      } catch {
        setError("Unable to load this registration.");
      }
    })();
  }, [requestId]);

  async function assign() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutoring-requests/${requestId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to assign.");
        return;
      }
      router.push("/staff/tutoring-requests");
      router.refresh();
    } catch {
      setError("Unable to assign.");
    } finally {
      setSaving(false);
    }
  }

  if (!detail && !error) return <p className="dashboard-empty">Loading…</p>;
  if (!detail) return <p className="form-error">{error}</p>;

  const alreadyAssigned = Boolean(detail.request.occupyingBooking);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Academic Year Tutoring</span>
          <h3 className="staff-section-title">{detail.request.studentName}</h3>
          <p>
            {detail.request.familyName} · {detail.request.subjectName}
          </p>
        </div>
        <Link href="/staff/tutoring-requests" className="text-button">
          Back to list
        </Link>
      </div>
      {detail.request.schedulingPath === "family_selected" ? (
        <p className="dashboard-preview-note">
          The family saved a preferred time. That is not a confirmed seat
          {detail.request.preferredSlot?.full ? " — and that preferred time is now full." : "."}
        </p>
      ) : (
        <p className="dashboard-preview-note">Professional Tutoring needs to choose a tutor and time.</p>
      )}
      {detail.request.scheduleNotes ? <p>Notes: {detail.request.scheduleNotes}</p> : null}
      {detail.request.identityReview ? <p>Identity review: {detail.request.identityReview}</p> : null}

      {alreadyAssigned ? (
        <p>A time is already confirmed for this registration.</p>
      ) : (
        <div className="public-ay-stack">
          {detail.compatible.map((window) => (
            <div key={window.windowId}>
              <h4>{window.windowLabel}</h4>
              {window.tutors.length === 0 ? <p>No open seats in this window.</p> : null}
              {window.tutors.map((tutor) => (
                <div key={`${window.windowId}-${tutor.id}`} style={{ marginBottom: 12 }}>
                  <strong>{tutor.displayName}</strong>
                  <div className="public-ay-choices public-ay-choices-list">
                    {tutor.slots.map((slot) => {
                      const full = slot.openSeats < 1;
                      const isSelected = selected?.slotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={isSelected ? "is-selected" : undefined}
                          disabled={full}
                          onClick={() => setSelected({ tutorId: tutor.id, slotId: slot.id })}
                        >
                          {DAYS[slot.dayOfWeek]} {slot.startTimeLocal}–{slot.endTimeLocal}
                          <small>{full ? "Full" : `${slot.openSeats} seat${slot.openSeats === 1 ? "" : "s"} available`}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <button type="button" className="public-ay-primary" disabled={!selected || saving} onClick={() => void assign()}>
            {saving ? "Assigning…" : "Confirm tutor and time"}
          </button>
        </div>
      )}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
