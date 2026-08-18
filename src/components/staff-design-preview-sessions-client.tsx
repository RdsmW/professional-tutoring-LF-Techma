"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui";
import {
  SESSION_CHIP_LABEL,
  SESSION_LAYOUTS,
  SESSION_TYPE_FILTERS,
  type StaffSessionKind,
  type StaffSessionLayout,
  type StaffSessionTab,
  type StaffSessionTypeFilter,
} from "@/lib/staff/sessions-list";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type PreviewRow = {
  id: string;
  whenDay: string;
  whenDetail: string;
  dayIndex: number | null;
  timeLabel: string | null;
  kind: StaffSessionKind;
  sessionLabel: string;
  what: string;
  people: string;
  status: string;
  tabs: StaffSessionTab[];
  issue?: boolean;
};

const WEEK_DAYS = [
  { dayIndex: 0, weekday: "Sun", dateLabel: "Aug 17" },
  { dayIndex: 1, weekday: "Mon", dateLabel: "Aug 18" },
  { dayIndex: 2, weekday: "Tue", dateLabel: "Aug 19" },
  { dayIndex: 3, weekday: "Wed", dateLabel: "Aug 20" },
  { dayIndex: 4, weekday: "Thu", dateLabel: "Aug 21" },
  { dayIndex: 5, weekday: "Fri", dateLabel: "Aug 22" },
  { dayIndex: 6, weekday: "Sat", dateLabel: "Aug 23" },
] as const;

const SAMPLE_ROWS: PreviewRow[] = [
  {
    id: "1",
    whenDay: "Tue",
    whenDetail: "Aug 19 · 3:15 PM",
    dayIndex: 2,
    timeLabel: "3:15 PM",
    kind: "tutoring",
    sessionLabel: "Tutoring · Algebra II",
    what: "Algebra II",
    people: "Jordan Reed · Maya Chen",
    status: "confirmed",
    tabs: ["week", "tutoring"],
  },
  {
    id: "2",
    whenDay: "Tue",
    whenDetail: "Aug 19 · 4:30 PM",
    dayIndex: 2,
    timeLabel: "4:30 PM",
    kind: "tutoring",
    sessionLabel: "Tutoring · SAT Math",
    what: "SAT Math",
    people: "Jordan Reed · Liam Park",
    status: "pending_payment",
    tabs: ["week", "tutoring", "issues"],
    issue: true,
  },
  {
    id: "3",
    whenDay: "Wed",
    whenDetail: "Aug 20 · 5:00 PM",
    dayIndex: 3,
    timeLabel: "5:00 PM",
    kind: "class",
    sessionLabel: "Class · AP Chemistry Lab",
    what: "AP Chemistry Lab",
    people: "Dr. Santos · 8 enrolled",
    status: "confirmed",
    tabs: ["week", "classes"],
  },
  {
    id: "4",
    whenDay: "Thu",
    whenDetail: "Aug 21 · 10:00 AM",
    dayIndex: 4,
    timeLabel: "10:00 AM",
    kind: "test",
    sessionLabel: "Test · Geometry Regents",
    what: "Geometry Regents",
    people: "Jordan Reed · Ava Torres",
    status: "confirmed",
    tabs: ["week", "tutoring"],
  },
  {
    id: "5",
    whenDay: "Sun",
    whenDetail: "Aug 17 · 11:00 AM",
    dayIndex: 0,
    timeLabel: "11:00 AM",
    kind: "tutoring",
    sessionLabel: "Tutoring · English Literature",
    what: "English Literature",
    people: "Jordan Reed · 1 of 2 seats",
    status: "confirmed",
    tabs: ["week", "tutoring", "issues"],
    issue: true,
  },
  {
    id: "6",
    whenDay: "Mon",
    whenDetail: "Aug 18 · 6:00 PM",
    dayIndex: 1,
    timeLabel: "6:00 PM",
    kind: "class",
    sessionLabel: "Class · Creative Writing Workshop",
    what: "Creative Writing Workshop",
    people: "Ms. Rivera · 12 enrolled",
    status: "confirmed",
    tabs: ["week", "classes"],
  },
  {
    id: "7",
    whenDay: "Tue",
    whenDetail: "Aug 19 · 3:15 PM",
    dayIndex: 2,
    timeLabel: "3:15 PM",
    kind: "tutoring",
    sessionLabel: "Tutoring · Algebra II",
    what: "Algebra II",
    people: "Jordan Reed · Maya Chen",
    status: "held",
    tabs: ["issues"],
    issue: true,
  },
  {
    id: "8",
    whenDay: "Fri",
    whenDetail: "Aug 22 · 2:00 PM",
    dayIndex: 5,
    timeLabel: "2:00 PM",
    kind: "test",
    sessionLabel: "Test · Physics midterm review",
    what: "Physics midterm review",
    people: "Jordan Reed · Noah Brooks",
    status: "pending_staff_review",
    tabs: ["week", "tutoring"],
  },
  {
    id: "9",
    whenDay: "Sat",
    whenDetail: "Aug 23 · 9:00 AM",
    dayIndex: 6,
    timeLabel: "9:00 AM",
    kind: "tutoring",
    sessionLabel: "Tutoring · Geometry",
    what: "Geometry",
    people: "Jordan Reed · Available",
    status: "available",
    tabs: ["issues"],
    issue: true,
  },
];

function issueDetail(row: PreviewRow) {
  if (row.id === "2") return "Payment overdue — card declined";
  if (row.id === "5") return "Available — 1 of 2 filled";
  if (row.id === "7") return "Schedule conflict — tutor double-booked";
  if (row.id === "9") return "Available — none filled";
  return null;
}

function PreviewTable({ rows, showIssueDetail }: { rows: PreviewRow[]; showIssueDetail: boolean }) {
  return (
    <Panel style={{ padding: 0 }}>
      <div className="table-panel staff-dir-table">
        <div className="table-head staff-dir-cols-sessions">
          <span>Date &amp; time</span>
          <span>Session</span>
          <span>People</span>
          <span className="staff-dir-col-status">Status</span>
        </div>
        {rows.map((row) => {
          const detail = showIssueDetail ? issueDetail(row) : null;
          return (
            <a
              key={row.id}
              href="#"
              className={`table-row staff-dir-cols-sessions${row.issue && showIssueDetail ? " staff-dir-row-issue" : ""}`}
              onClick={(event) => event.preventDefault()}
            >
              <span>
                <strong>{row.whenDay}</strong>
                <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                  {row.whenDetail}
                </small>
              </span>
              <span>{row.sessionLabel}</span>
              <span>
                {row.people}
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
        })}
      </div>
    </Panel>
  );
}

export function StaffDesignPreviewSessionsClient() {
  const [layout, setLayout] = useState<StaffSessionLayout>("week");
  const [typeFilter, setTypeFilter] = useState<StaffSessionTypeFilter>("all");
  const [issues, setIssues] = useState(false);

  const visibleRows = useMemo(() => {
    const tab: StaffSessionTab = issues
      ? "issues"
      : typeFilter === "all"
        ? "week"
        : typeFilter;
    return SAMPLE_ROWS.filter((row) => row.tabs.includes(tab));
  }, [issues, typeFilter]);

  return (
    <>
      <section className="view-intro page-header-band">
        <div className="page-header-copy">
          <span className="eyebrow">Design preview</span>
          <h1>Sessions</h1>
          <p>Sample data only · this week · Aug 17 – Aug 23</p>
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

      <div className="sessions-toolbar">
        <section className="segmented" aria-label="Session layout">
          {SESSION_LAYOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={!issues && layout === item.id ? "active" : ""}
              onClick={() => {
                setLayout(item.id);
                setIssues(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </section>
        {!issues ? (
          <section className="filter-row" aria-label="Session type">
            {SESSION_TYPE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`filter-chip${typeFilter === item.id ? " active" : ""}`}
                onClick={() => {
                  setTypeFilter(item.id);
                  setIssues(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </section>
        ) : null}
        <button
          type="button"
          className={`filter-chip sessions-issues-chip${issues ? " active" : ""}`}
          onClick={() => setIssues((value) => !value)}
        >
          Issues
        </button>
      </div>

      {visibleRows.length === 0 ? (
        <p className="dashboard-empty" style={{ padding: "18px 17px" }}>
          No sample rows for this view.
        </p>
      ) : issues || layout === "list" ? (
        <PreviewTable rows={visibleRows} showIssueDetail={issues} />
      ) : (
        <div className="sessions-week-wrap">
          <div className="sessions-week" role="grid" aria-label="Week calendar">
            {WEEK_DAYS.map((day) => (
              <section key={day.dayIndex} className="sessions-week-day">
                <h3 className="sessions-week-day-title">{day.weekday}</h3>
                <small className="sessions-week-day-date">{day.dateLabel}</small>
                {visibleRows
                  .filter((row) => row.dayIndex === day.dayIndex)
                  .map((row) => (
                    <a
                      key={row.id}
                      href="#"
                      className={`sessions-week-chip ${row.kind}`}
                      onClick={(event) => event.preventDefault()}
                    >
                      {SESSION_CHIP_LABEL[row.kind]}
                      <small>{[row.timeLabel, row.what].filter(Boolean).join(" · ")}</small>
                    </a>
                  ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
