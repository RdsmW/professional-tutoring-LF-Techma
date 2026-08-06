"use client";

import { useState } from "react";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function StaffSessionsPage() {
  const [mode, setMode] = useState<"Sessions" | "Exceptions">("Sessions");

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Sessions"
        title="Sessions"
        description="Occurrence records, attendance, and Exceptions live here — Scheduling has no separate exception module."
      />

      <section className="segmented">
        {(["Sessions", "Exceptions"] as const).map((item) => (
          <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </section>

      {mode === "Sessions" ? (
        <Panel title="Session list" eyebrow="Stage 1 shell">
          <div className="session-filter-bar">
            <label>
              Session status
              <select defaultValue="All">
                <option>All</option>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
                <option>No-show</option>
                <option>Rescheduled</option>
              </select>
            </label>
            <label>
              Billing status
              <select defaultValue="All">
                <option>All</option>
                <option>Covered by package</option>
                <option>Unbilled</option>
                <option>Invoice sent</option>
                <option>Paid</option>
              </select>
            </label>
            <span>
              <strong>0</strong> sessions
            </span>
            <button type="button" className="secondary-button">
              Reset
            </button>
          </div>
          <div className="empty-action compact-empty">
            <div className="empty-symbol">◎</div>
            <p>No session occurrences yet. Stage 2 connects bookings to attendance on the exact Session.</p>
          </div>
          <ComingStageNote feature="Session Detail and inline attendance capture" />
        </Panel>
      ) : (
        <Panel title="Exceptions queue" eyebrow="Sessions-owned">
          <div className="saved-filter-bar">
            <strong>Saved view</strong>
            <span>Needs review</span>
            <span>Policy-traceable</span>
            <button type="button">Clear</button>
          </div>
          <div className="empty-action compact-empty">
            <div className="empty-symbol">!</div>
            <p>No exception items. Dashboard “Needs review” will deep-link here in Stage 2.</p>
          </div>
          <ComingStageNote feature="Why-this-is-here traces, before/after resolution, and audited overrides" />
        </Panel>
      )}
    </>
  );
}
