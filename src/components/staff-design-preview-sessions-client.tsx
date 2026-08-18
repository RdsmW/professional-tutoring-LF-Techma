"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type SessionTab = "week" | "tutoring" | "classes" | "issues";

type SessionType = "tutoring" | "class" | "test";

type PreviewRow = {
  id: string;
  when: string;
  type: SessionType;
  typeLabel: string;
  what: string;
  who: string;
  status: string;
  tabs: SessionTab[];
  issue?: boolean;
};

const TYPE_PILL: Record<SessionType, string> = {
  tutoring: "blue",
  class: "violet",
  test: "gold",
};

const TABS: { id: SessionTab; label: string }[] = [
  { id: "week", label: "Week (all)" },
  { id: "tutoring", label: "Tutoring" },
  { id: "classes", label: "Classes" },
  { id: "issues", label: "Issues" },
];

const SAMPLE_ROWS: PreviewRow[] = [
  {
    id: "1",
    when: "Tue · Aug 19 · 3:15 PM",
    type: "tutoring",
    typeLabel: "Tutoring",
    what: "Algebra II",
    who: "Jordan Reed · Maya Chen",
    status: "confirmed",
    tabs: ["week", "tutoring"],
  },
  {
    id: "2",
    when: "Tue · Aug 19 · 4:30 PM",
    type: "tutoring",
    typeLabel: "Tutoring",
    what: "SAT Math",
    who: "Jordan Reed · Liam Park",
    status: "pending_payment",
    tabs: ["week", "tutoring", "issues"],
    issue: true,
  },
  {
    id: "3",
    when: "Wed · Aug 20 · 5:00 PM",
    type: "class",
    typeLabel: "Class",
    what: "AP Chemistry Lab",
    who: "Dr. Santos · 8 enrolled",
    status: "confirmed",
    tabs: ["week", "classes"],
  },
  {
    id: "4",
    when: "Thu · Aug 21 · 10:00 AM",
    type: "test",
    typeLabel: "Test/makeup",
    what: "Geometry Regents",
    who: "Jordan Reed · Ava Torres",
    status: "confirmed",
    tabs: ["week", "tutoring"],
  },
  {
    id: "5",
    when: "Sun · Aug 17 · 11:00 AM",
    type: "tutoring",
    typeLabel: "Tutoring",
    what: "English Literature",
    who: "Jordan Reed · 1 of 2 seats",
    status: "confirmed",
    tabs: ["week", "tutoring", "issues"],
    issue: true,
  },
  {
    id: "6",
    when: "Mon · Aug 18 · 6:00 PM",
    type: "class",
    typeLabel: "Class",
    what: "Creative Writing Workshop",
    who: "Ms. Rivera · 12 enrolled",
    status: "confirmed",
    tabs: ["week", "classes"],
  },
  {
    id: "7",
    when: "Tue · Aug 19 · 3:15 PM",
    type: "tutoring",
    typeLabel: "Tutoring",
    what: "Algebra II",
    who: "Jordan Reed · conflict — two bookings",
    status: "held",
    tabs: ["issues"],
    issue: true,
  },
  {
    id: "8",
    when: "Fri · Aug 22 · 2:00 PM",
    type: "test",
    typeLabel: "Test/makeup",
    what: "Physics midterm review",
    who: "Jordan Reed · Noah Brooks",
    status: "pending_staff_review",
    tabs: ["week", "tutoring"],
  },
];

function issueDetail(row: PreviewRow) {
  if (row.id === "2") return "Payment overdue — card declined";
  if (row.id === "5") return "Open seat — 1 of 2 filled";
  if (row.id === "7") return "Schedule conflict — tutor double-booked";
  return null;
}

export function StaffDesignPreviewSessionsClient() {
  const [tab, setTab] = useState<SessionTab>("week");

  const visibleRows = useMemo(
    () => SAMPLE_ROWS.filter((row) => row.tabs.includes(tab)),
    [tab],
  );

  return (
    <>
      <section className="view-intro page-header-band">
        <div className="page-header-copy">
          <span className="eyebrow">Design preview</span>
          <h1>Sessions</h1>
          <p>Sample data only · validate before build</p>
        </div>
        <div className="page-header-action design-preview-header-links">
          <Link href="/staff/design-preview/tutor-seats" className="secondary-button">
            Tutor seats →
          </Link>
        </div>
      </section>

      <p className="design-preview-note">
        Static mock — the live table is on{" "}
        <Link href="/staff/sessions">Sessions</Link>
        {" · "}
        <Link href="/staff/settings">Back to Settings</Link>
      </p>

      <section className="segmented" aria-label="Session views">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <Panel style={{ padding: 0 }}>
        <div className="table-panel staff-dir-table">
          <div className="table-head staff-dir-cols-sessions">
            <span>When</span>
            <span>Type</span>
            <span>What</span>
            <span>Who</span>
            <span className="staff-dir-col-status">Status</span>
          </div>
          {visibleRows.length === 0 ? (
            <p className="dashboard-empty" style={{ padding: "18px 17px" }}>
              No sample rows for this tab.
            </p>
          ) : (
            visibleRows.map((row) => {
              const detail = tab === "issues" ? issueDetail(row) : null;
              return (
                <a
                  key={row.id}
                  href="#"
                  className={`table-row staff-dir-cols-sessions${row.issue && tab === "issues" ? " staff-dir-row-issue" : ""}`}
                  onClick={(event) => event.preventDefault()}
                >
                  <span>
                    <strong>{row.when.split(" · ")[0]}</strong>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                      {row.when.split(" · ").slice(1).join(" · ")}
                    </small>
                  </span>
                  <span>
                    <span className={`pill ${TYPE_PILL[row.type]}`}>{row.typeLabel}</span>
                  </span>
                  <span>{row.what}</span>
                  <span>
                    {row.who}
                    {detail ? (
                      <small style={{ display: "block", color: "#8e661f", marginTop: 4, fontWeight: 700 }}>
                        {detail}
                      </small>
                    ) : null}
                  </span>
                  <span className="staff-dir-col-status">
                    <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
                  </span>
                </a>
              );
            })
          )}
        </div>
      </Panel>
    </>
  );
}
