"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";
import {
  SESSION_CHIP_LABEL,
  SESSION_LAYOUTS,
  SESSION_TYPE_FILTERS,
  sessionHourKey,
  sessionHourRows,
  type StaffSessionKind,
  type StaffSessionLayout,
  type StaffSessionTab,
  type StaffSessionTypeFilter,
} from "@/lib/staff/sessions-list";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import "./staff-sessions.css";

type PreviewRow = {
  id: string;
  whenDay: string;
  whenDetail: string;
  dayIndex: number | null;
  timeLabel: string | null;
  kind: StaffSessionKind;
  sessionLabel: string;
  scheduleNote: string | null;
  what: string;
  familyName: string;
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
    scheduleNote: null,
    what: "Algebra II",
    familyName: "Chen",
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
    scheduleNote: null,
    what: "SAT Math",
    familyName: "Park",
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
    scheduleNote: null,
    what: "AP Chemistry Lab",
    familyName: "—",
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
    scheduleNote: null,
    what: "Geometry Regents",
    familyName: "Torres",
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
    scheduleNote: null,
    what: "English Literature",
    familyName: "—",
    people: "Jordan Reed · 1 of 2 seats",
    status: "available",
    tabs: ["week", "tutoring", "issues"],
    issue: true,
  },
  {
    id: "6",
    whenDay: "Mon",
    whenDetail: "Aug 18",
    dayIndex: 1,
    timeLabel: null,
    kind: "class",
    sessionLabel: "Class · First Class",
    scheduleNote: "Monday morning / Wednesday evening sequence",
    what: "First Class",
    familyName: "—",
    people: "— · 0 enrolled",
    status: "no_students",
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
    scheduleNote: null,
    what: "Algebra II",
    familyName: "Chen",
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
    scheduleNote: null,
    what: "Physics midterm review",
    familyName: "Brooks",
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
    scheduleNote: null,
    what: "Geometry",
    familyName: "—",
    people: "Jordan Reed · Available",
    status: "available",
    tabs: ["issues"],
    issue: true,
  },
  {
    id: "10",
    whenDay: "—",
    whenDetail: "—",
    dayIndex: null,
    timeLabel: null,
    kind: "class",
    sessionLabel: "Class · Makeup seminar",
    scheduleNote: "Date pending",
    what: "Makeup seminar",
    familyName: "—",
    people: "Ms. Rivera · 4 enrolled",
    status: "confirmed",
    tabs: ["week", "classes"],
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
        <div className="table-head staff-sessions-cols">
          <span>Date &amp; time</span>
          <span>Session</span>
          <span>Family</span>
          <span>People</span>
          <span className="staff-dir-col-status">Status</span>
        </div>
        {rows.map((row) => {
          const detail = showIssueDetail ? issueDetail(row) : null;
          return (
            <a
              key={row.id}
              href="#"
              className={`table-row staff-sessions-cols${row.issue && showIssueDetail ? " staff-dir-row-issue" : ""}`}
              onClick={(event) => event.preventDefault()}
            >
              <span className="staff-sessions-when">
                <strong>{row.whenDay}</strong>
                <small>{row.whenDetail}</small>
              </span>
              <span className="staff-sessions-session">
                {row.sessionLabel}
                {row.scheduleNote ? <small>{row.scheduleNote}</small> : null}
              </span>
              <span>{row.familyName}</span>
              <span className="staff-sessions-people">
                {row.people}
                {detail ? <small>{detail}</small> : null}
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

function PreviewWeek({ rows }: { rows: PreviewRow[] }) {
  const { byDay, unscheduled, hours } = useMemo(() => {
    const grouped = new Map<number, PreviewRow[]>();
    const leftover: PreviewRow[] = [];
    for (const row of rows) {
      if (row.dayIndex == null) {
        leftover.push(row);
        continue;
      }
      const list = grouped.get(row.dayIndex) ?? [];
      list.push(row);
      grouped.set(row.dayIndex, list);
    }
    return { byDay: grouped, unscheduled: leftover, hours: sessionHourRows(rows) };
  }, [rows]);

  return (
    <>
      <div className="staff-sessions-week-wrap">
        <div className="staff-sessions-week" role="grid" aria-label="Week calendar">
          <div className="staff-sessions-week-gutter" aria-hidden="true" />
          {WEEK_DAYS.map((day) => {
            const empty = (byDay.get(day.dayIndex) ?? []).length === 0;
            return (
              <div
                key={day.dayIndex}
                className={`staff-sessions-week-head${empty ? " is-empty" : ""}`}
              >
                <h3>{day.weekday}</h3>
                <small>{day.dateLabel}</small>
              </div>
            );
          })}
          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="staff-sessions-week-hour">{hour}</div>
              {WEEK_DAYS.map((day) => {
                const cellRows = (byDay.get(day.dayIndex) ?? []).filter(
                  (row) => sessionHourKey(row) === hour,
                );
                return (
                  <div
                    key={`${hour}-${day.dayIndex}`}
                    className={`staff-sessions-week-cell${cellRows.length === 0 ? " is-empty" : ""}`}
                  >
                    {cellRows.map((row) => (
                      <a
                        key={row.id}
                        href="#"
                        className={`staff-sessions-chip ${row.kind}`}
                        onClick={(event) => event.preventDefault()}
                      >
                        <span className="staff-sessions-chip-time">{row.timeLabel || "—"}</span>
                        {SESSION_CHIP_LABEL[row.kind]}
                        <small>{row.what}</small>
                      </a>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      {unscheduled.length > 0 ? (
        <div className="staff-sessions-unscheduled">
          <span className="staff-sessions-unscheduled-label">Unscheduled</span>
          <div className="staff-sessions-unscheduled-chips">
            {unscheduled.map((row) => (
              <a
                key={row.id}
                href="#"
                className={`staff-sessions-chip ${row.kind}`}
                onClick={(event) => event.preventDefault()}
              >
                <span className="staff-sessions-chip-time">{row.timeLabel || "—"}</span>
                {SESSION_CHIP_LABEL[row.kind]}
                <small>{row.what}</small>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
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

      <div className="staff-sessions-toolbar">
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
        <section className="filter-row" aria-label="Session type">
          {SESSION_TYPE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip${!issues && typeFilter === item.id ? " active" : ""}`}
              onClick={() => {
                setTypeFilter(item.id);
                setIssues(false);
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`filter-chip${issues ? " active" : ""}`}
            onClick={() => setIssues((value) => !value)}
          >
            Issues
          </button>
        </section>
      </div>

      {visibleRows.length === 0 ? (
        <p className="dashboard-empty" style={{ padding: "18px 17px" }}>
          No sample rows for this view.
        </p>
      ) : issues || layout === "list" ? (
        <PreviewTable rows={visibleRows} showIssueDetail={issues} />
      ) : (
        <PreviewWeek rows={visibleRows} />
      )}
    </>
  );
}
