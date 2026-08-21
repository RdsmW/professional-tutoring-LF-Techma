"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import {
  SESSION_CHIP_LABEL,
  SESSION_LAYOUTS,
  SESSION_TYPE_FILTERS,
  fallbackWeekDays,
  parseStaffSessionsSearch,
  sessionHourKey,
  sessionHourRows,
  sessionRowTab,
  staffSessionsHref,
  type StaffSessionListRow,
  type StaffSessionWeekDay,
  type StaffSessionsSearchState,
} from "@/lib/staff/sessions-list";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import "./staff-sessions.css";

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
        <div className="table-head staff-sessions-cols">
          <span>Date &amp; time</span>
          <span>Session</span>
          <span>Family</span>
          <span>People</span>
          <span className="staff-dir-col-status">Status</span>
        </div>
        {rows.map((row) => {
          const detail = showIssueDetail ? row.issueDetail : null;
          return (
            <Link
              key={row.id}
              href={row.href}
              className={`table-row staff-sessions-cols${row.issue && showIssueDetail ? " staff-dir-row-issue" : ""}`}
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
  const { byDay, unscheduled, hours } = useMemo(() => {
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
    return { byDay: grouped, unscheduled: leftover, hours: sessionHourRows(rows) };
  }, [rows]);

  return (
    <>
      <div className="staff-sessions-week-wrap">
        <div className="staff-sessions-week" role="grid" aria-label="Week calendar">
          <div className="staff-sessions-week-gutter" aria-hidden="true" />
          {days.map((day) => {
            const empty = (byDay.get(day.dayIndex) ?? []).length === 0;
            return (
              <div
                key={day.dayIndex}
                className={`staff-sessions-week-head${empty ? " is-empty" : ""}`}
                role="columnheader"
              >
                <h3>{day.weekday}</h3>
                {day.dateLabel ? <small>{day.dateLabel}</small> : null}
              </div>
            );
          })}
          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="staff-sessions-week-hour">{hour}</div>
              {days.map((day) => {
                const cellRows = (byDay.get(day.dayIndex) ?? []).filter(
                  (row) => sessionHourKey(row) === hour,
                );
                return (
                  <div
                    key={`${hour}-${day.dayIndex}`}
                    className={`staff-sessions-week-cell${cellRows.length === 0 ? " is-empty" : ""}`}
                    role="gridcell"
                    aria-label={`${day.weekday}${day.dateLabel ? ` ${day.dateLabel}` : ""} ${hour}`}
                  >
                    {cellRows.map((row) => (
                      <Link
                        key={row.id}
                        href={row.href}
                        className={`staff-sessions-chip ${row.kind}`}
                      >
                        <span className="staff-sessions-chip-time">{row.timeLabel || "—"}</span>
                        {SESSION_CHIP_LABEL[row.kind]}
                        <small>{row.what}</small>
                      </Link>
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
              <Link key={row.id} href={row.href} className={`staff-sessions-chip ${row.kind}`}>
                <span className="staff-sessions-chip-time">{row.timeLabel || "—"}</span>
                {SESSION_CHIP_LABEL[row.kind]}
                <small>{row.what}</small>
              </Link>
            ))}
          </div>
        </div>
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

      <div className="staff-sessions-toolbar">
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

        <section className="filter-row" aria-label="Session type">
          {SESSION_TYPE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-chip${!state.issues && state.typeFilter === item.id ? " active" : ""}`}
              onClick={() => applyState({ ...state, typeFilter: item.id, issues: false })}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`filter-chip${state.issues ? " active" : ""}`}
            onClick={() => applyState({ ...state, issues: !state.issues })}
          >
            Issues
          </button>
        </section>
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
