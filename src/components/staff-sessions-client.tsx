"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import {
  SESSION_CHIP_LABEL,
  SESSION_LAYOUTS,
  SESSION_TYPE_FILTERS,
  fallbackWeekDays,
  parseStaffSessionsSearch,
  sessionRowTab,
  staffSessionsHref,
  type StaffSessionListRow,
  type StaffSessionWeekDay,
  type StaffSessionsSearchState,
} from "@/lib/staff/sessions-list";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

function emptyCopy(state: StaffSessionsSearchState) {
  if (state.issues) return "No conflicts, payment issues, or available seats.";
  if (state.typeFilter === "tutoring") return "No tutoring sessions this week.";
  if (state.typeFilter === "classes") return "No classes to show.";
  return state.layout === "list" ? "No sessions to show." : "No sessions scheduled this week.";
}

function SessionsTable({
  rows,
  showIssueDetail,
}: {
  rows: StaffSessionListRow[];
  showIssueDetail: boolean;
}) {
  return (
    <Panel className="staff-dir-table-panel" style={{ padding: 0 }}>
      <div className="table-panel staff-dir-table">
        <div className="table-head staff-dir-cols-sessions">
          <span>Date &amp; time</span>
          <span>Session</span>
          <span>People</span>
          <span className="staff-dir-col-status">Status</span>
        </div>
        {rows.map((row) => {
          const detail = showIssueDetail ? row.issueDetail : null;
          return (
            <Link
              key={row.id}
              href={row.href}
              className={`table-row staff-dir-cols-sessions${row.issue && showIssueDetail ? " staff-dir-row-issue" : ""}`}
            >
              <span>
                <strong>{row.whenDay}</strong>
                <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                  {row.whenDetail}
                </small>
              </span>
              <span>{row.sessionLabel}</span>
              <span className="staff-dir-col-who" style={{ overflow: "visible", whiteSpace: "normal" }}>
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
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function SessionsWeekCalendar({
  rows,
  days,
}: {
  rows: StaffSessionListRow[];
  days: StaffSessionWeekDay[];
}) {
  const { byDay, unscheduled } = useMemo(() => {
    const grouped = new Map<number, StaffSessionListRow[]>();
    const leftover: StaffSessionListRow[] = [];
    for (const row of rows) {
      if (row.dayIndex == null) {
        leftover.push(row);
        continue;
      }
      const list = grouped.get(row.dayIndex) ?? [];
      list.push(row);
      grouped.set(row.dayIndex, list);
    }
    return { byDay: grouped, unscheduled: leftover };
  }, [rows]);

  return (
    <>
      <div className="sessions-week-wrap">
        <div className="sessions-week" role="grid" aria-label="Week calendar">
          {days.map((day) => (
            <section
              key={day.dayIndex}
              className="sessions-week-day"
              role="gridcell"
              aria-label={`${day.weekday}${day.dateLabel ? ` ${day.dateLabel}` : ""}`}
            >
              <h3 className="sessions-week-day-title">{day.weekday}</h3>
              {day.dateLabel ? <small className="sessions-week-day-date">{day.dateLabel}</small> : null}
              {(byDay.get(day.dayIndex) ?? []).map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  className={`sessions-week-chip ${row.kind}`}
                >
                  {SESSION_CHIP_LABEL[row.kind]}
                  <small>{[row.timeLabel, row.what].filter(Boolean).join(" · ")}</small>
                </Link>
              ))}
            </section>
          ))}
        </div>
      </div>
      {unscheduled.length > 0 ? (
        <Panel className="sessions-unscheduled">
          <h3 className="sessions-week-day-title">Unscheduled</h3>
          <div className="sessions-unscheduled-chips">
            {unscheduled.map((row) => (
              <Link key={row.id} href={row.href} className={`sessions-week-chip ${row.kind}`}>
                {SESSION_CHIP_LABEL[row.kind]}
                <small>{row.what}</small>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  );
}

export function StaffSessionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<StaffSessionsSearchState>(() =>
    parseStaffSessionsSearch(searchParams),
  );
  const [rows, setRows] = useState<StaffSessionListRow[]>([]);
  const [weekDays, setWeekDays] = useState<StaffSessionWeekDay[]>(fallbackWeekDays);
  const [weekLabel, setWeekLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exceptionId = searchParams.get("exceptionId");
    if (exceptionId) {
      router.replace(`/staff/requests/${exceptionId}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    setState(parseStaffSessionsSearch(searchParams));
  }, [searchParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/sessions");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load sessions.");
        setRows([]);
        return;
      }
      setWeekLabel(typeof data.weekLabel === "string" ? data.weekLabel : null);
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setWeekDays(Array.isArray(data.weekDays) && data.weekDays.length === 7 ? data.weekDays : fallbackWeekDays());
    } catch {
      setError("Unable to load sessions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function applyState(next: StaffSessionsSearchState) {
    setState(next);
    router.replace(staffSessionsHref(next, searchParams));
  }

  const visibleRows = useMemo(() => {
    const tab = sessionRowTab(state);
    return rows.filter((row) => row.tabs.includes(tab));
  }, [rows, state]);

  const showTable = state.issues || state.layout === "list";

  return (
    <>
      <PageIntro
        title="Sessions"
        description={weekLabel ? `This week · ${weekLabel}` : "Tutoring, classes, and tests for the week."}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <div className="sessions-toolbar">
        <section className="segmented" aria-label="Session layout">
          {SESSION_LAYOUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={!state.issues && state.layout === item.id ? "active" : ""}
              onClick={() => applyState({ ...state, layout: item.id, issues: false })}
            >
              {item.label}
            </button>
          ))}
        </section>

        {!state.issues ? (
          <section className="filter-row" aria-label="Session type">
            {SESSION_TYPE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`filter-chip${state.typeFilter === item.id ? " active" : ""}`}
                onClick={() => applyState({ ...state, typeFilter: item.id, issues: false })}
              >
                {item.label}
              </button>
            ))}
          </section>
        ) : null}

        <button
          type="button"
          className={`filter-chip sessions-issues-chip${state.issues ? " active" : ""}`}
          onClick={() => applyState({ ...state, issues: !state.issues })}
        >
          Issues
        </button>
      </div>

      {loading ? <p className="dashboard-empty staff-dir-status">Loading sessions…</p> : null}

      {!loading && visibleRows.length === 0 ? (
        <p className="dashboard-empty staff-dir-status">{emptyCopy(state)}</p>
      ) : null}

      {!loading && visibleRows.length > 0 && !showTable ? (
        <SessionsWeekCalendar rows={visibleRows} days={weekDays} />
      ) : null}

      {!loading && visibleRows.length > 0 && showTable ? (
        <SessionsTable rows={visibleRows} showIssueDetail={state.issues} />
      ) : null}
    </>
  );
}
