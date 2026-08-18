"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import {
  SESSION_TABS,
  SESSION_TYPE_PILL,
  isStaffSessionTab,
  type StaffSessionListRow,
  type StaffSessionTab,
} from "@/lib/staff/sessions-list";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

const EMPTY_COPY: Record<StaffSessionTab, string> = {
  week: "No sessions scheduled this week.",
  tutoring: "No tutoring sessions this week.",
  classes: "No classes to show.",
  issues: "No conflicts, payment issues, or open seats.",
};

export function StaffSessionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<StaffSessionTab>(isStaffSessionTab(tabParam) ? tabParam : "week");
  const [rows, setRows] = useState<StaffSessionListRow[]>([]);
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
    if (isStaffSessionTab(tabParam)) setTab(tabParam);
    else setTab("week");
  }, [tabParam]);

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

  function selectTab(next: StaffSessionTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "week") params.delete("tab");
    else params.set("tab", next);
    params.delete("exceptionId");
    const query = params.toString();
    router.replace(query ? `/staff/sessions?${query}` : "/staff/sessions");
  }

  const visibleRows = useMemo(() => rows.filter((row) => row.tabs.includes(tab)), [rows, tab]);

  return (
    <>
      <PageIntro
        title="Sessions"
        description={weekLabel ? `This week · ${weekLabel}` : "Tutoring, classes, and tests in one list."}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <section className="segmented" aria-label="Session views">
        {SESSION_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : ""}
            onClick={() => selectTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>

      {loading ? <p className="dashboard-empty staff-dir-status">Loading sessions…</p> : null}

      {!loading && visibleRows.length === 0 ? (
        <p className="dashboard-empty staff-dir-status">{EMPTY_COPY[tab]}</p>
      ) : null}

      {!loading && visibleRows.length > 0 ? (
        <Panel className="staff-dir-table-panel" style={{ padding: 0 }}>
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-sessions">
              <span>When</span>
              <span>Type</span>
              <span>What</span>
              <span>Who</span>
              <span className="staff-dir-col-status">Status</span>
            </div>
            {visibleRows.map((row) => {
              const detail = tab === "issues" ? row.issueDetail : null;
              return (
                <Link
                  key={row.id}
                  href={row.href}
                  className={`table-row staff-dir-cols-sessions${row.issue && tab === "issues" ? " staff-dir-row-issue" : ""}`}
                >
                  <span>
                    <strong>{row.whenDay}</strong>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                      {row.whenDetail}
                    </small>
                  </span>
                  <span>
                    <span className={`pill ${SESSION_TYPE_PILL[row.kind]}`}>{row.typeLabel}</span>
                  </span>
                  <span>{row.what}</span>
                  <span className="staff-dir-col-who" style={{ overflow: "visible", whiteSpace: "normal" }}>
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
                </Link>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </>
  );
}
