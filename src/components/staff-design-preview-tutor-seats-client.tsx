"use client";

import Link from "next/link";
import { Panel } from "@/components/ui";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

const WEEKDAY_OPTIONS = [
  { value: "2", label: "Tuesday" },
  { value: "0", label: "Sunday" },
] as const;

const OPEN_HOURS = [
  { day: "Tuesday", range: "3:15 PM – 4:15 PM", seats: "1 of 2 booked" },
  { day: "Sunday", range: "11:00 AM – 12:00 PM", seats: "1 of 2 booked" },
];

const SEAT_ROWS = [
  { window: "Tue · 3:15 PM", seat: "1", student: "Maya Chen", state: "confirmed" },
  { window: "Tue · 3:15 PM", seat: "2", student: "OPEN", state: "open" },
  { window: "Sun · 11:00 AM", seat: "1", student: "Liam Park", state: "confirmed" },
  { window: "Sun · 11:00 AM", seat: "2", student: "OPEN", state: "open" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name.slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function StaffDesignPreviewTutorSeatsClient() {
  return (
    <>
      <section className="view-intro page-header-band">
        <div className="page-header-copy">
          <span className="eyebrow">Design preview</span>
          <h1>Tutor seats</h1>
          <p>Sample data only · validate before build</p>
        </div>
        <div className="page-header-action design-preview-header-links">
          <Link href="/staff/design-preview/sessions" className="secondary-button">
            ← Sessions
          </Link>
        </div>
      </section>

      <p className="design-preview-note">
        Masdouk-style seat grid on tutor detail.{" "}
        <Link href="/staff/settings">Back to Settings</Link>
      </p>

      <div className="family-detail-topbar">
        <Link href="/staff/tutors" className="page-back">
          ← Tutors
        </Link>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials("Jordan Reed")}</span>
        <div className="family-record-hero-copy">
          <h2>Jordan Reed</h2>
        </div>
        <span className="pill family-record-hero-status-pill mint">Active</span>
      </section>

      <Panel className="family-equal-panel">
        <div className="family-panel-heading">
          <h2>Profile</h2>
        </div>
        <div className="family-household-summary">
          <div className="family-household-dense tutor-profile-dense">
            <div className="family-household-upper" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div>
                <small style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Name</small>
                <span>Jordan Reed</span>
              </div>
              <div>
                <small style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Email</small>
                <span>j.reed@example.com</span>
              </div>
              <div>
                <small style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Phone</small>
                <span>(555) 014-2290</span>
              </div>
              <div>
                <small style={{ display: "block", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Max seats per slot</small>
                <span>2</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="family-equal-panel tutor-open-hours-panel">
        <div className="family-panel-heading">
          <h2>Open hours</h2>
        </div>
        <div className="tutor-open-hours-body">
          <p className="tutor-open-hours-helper">
            Weekly times this tutor can be booked. Capacity sets seats per slot for new hours.
          </p>

          <div className="tutor-open-hours-add" role="group" aria-label="Add open hour">
            <label className="tutor-open-hours-field">
              <span>Day</span>
              <select defaultValue="2" aria-label="Day of week" disabled>
                {WEEKDAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="tutor-open-hours-field">
              <span>Start</span>
              <input type="time" defaultValue="15:15" aria-label="Start time" disabled />
            </label>
            <label className="tutor-open-hours-field">
              <span>End</span>
              <input type="time" defaultValue="16:15" aria-label="End time" disabled />
            </label>
            <button type="button" className="primary-button tutor-open-hours-add-btn" disabled>
              Add
            </button>
          </div>

          <ul className="tutor-open-hours-list">
            {OPEN_HOURS.map((slot) => (
              <li key={`${slot.day}-${slot.range}`} className="tutor-open-hours-row">
                <div className="tutor-open-hours-row-main">
                  <strong className="tutor-open-hours-day">{slot.day}</strong>
                  <span className="tutor-open-hours-range">{slot.range}</span>
                </div>
                <div className="tutor-open-hours-row-meta">
                  <span className="tutor-open-hours-seats">{slot.seats}</span>
                  <button type="button" className="tutor-open-hours-remove" disabled>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel className="family-equal-panel" style={{ padding: 0 }}>
        <div style={{ padding: "18px 18px 0" }}>
          <div className="family-panel-heading">
            <h2>Seat grid</h2>
          </div>
          <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
            Per-window seat assignments for this tutor&apos;s open hours.
          </p>
        </div>
        <div className="table-panel staff-dir-table">
          <div className="table-head staff-dir-cols-seats">
            <span>Window</span>
            <span>Seat</span>
            <span>Student</span>
            <span className="staff-dir-col-status">State</span>
          </div>
          {SEAT_ROWS.map((row, index) => (
            <a
              key={`${row.window}-${row.seat}-${index}`}
              href="#"
              className="table-row staff-dir-cols-seats"
              onClick={(event) => event.preventDefault()}
            >
              <span>{row.window}</span>
              <span>{row.seat}</span>
              <span style={{ fontWeight: row.student === "OPEN" ? 800 : undefined, color: row.student === "OPEN" ? "var(--muted)" : undefined }}>
                {row.student}
              </span>
              <span className="staff-dir-col-status">
                <span className={`pill ${row.state === "open" ? "amber" : statusTone(row.state)}`}>
                  {row.state === "open" ? "Open" : formatStatusLabel(row.state)}
                </span>
              </span>
            </a>
          ))}
        </div>
      </Panel>
    </>
  );
}
