"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import { reportToCsv } from "@/lib/reports/csv";
import type {
  DateFilter,
  ReportResult,
  ServiceFilter,
} from "@/lib/reports/types";

const DATE_OPTIONS: Array<{ id: DateFilter; label: string }> = [
  { id: "all", label: "All dates" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "term", label: "Current term" },
];

const SERVICE_OPTIONS: Array<{ id: ServiceFilter; label: string }> = [
  { id: "all", label: "All services" },
  { id: "tutoring", label: "Tutoring only" },
  { id: "courses", label: "Courses only" },
  { id: "exceptions", label: "Exceptions only" },
];

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StaffReportDetailClient({ reportId }: { reportId: string }) {
  const [draftDate, setDraftDate] = useState<DateFilter>("all");
  const [draftService, setDraftService] = useState<ServiceFilter>("all");
  const [appliedDate, setAppliedDate] = useState<DateFilter>("all");
  const [appliedService, setAppliedService] = useState<ServiceFilter>("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const load = useCallback(async (date: DateFilter, service: ServiceFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date, service });
      const response = await fetch(`/api/staff/reports/${reportId}?${params}`);
      const data = await response.json();
      if (!response.ok || !data.ok || !data.report) {
        setError(data.error || "Unable to load report.");
        setReport(null);
        return;
      }
      setReport(data.report);
    } catch {
      setError("Unable to load report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load("all", "all");
  }, [load]);

  function resetFilters() {
    setDraftDate("all");
    setDraftService("all");
    setAppliedDate("all");
    setAppliedService("all");
    setSelectedGroup(null);
    void load("all", "all");
  }

  function viewResults() {
    setAppliedDate(draftDate);
    setAppliedService(draftService);
    setSelectedGroup(null);
    void load(draftDate, draftService);
  }

  const visibleRows = (report?.rows ?? []).filter((row) => !selectedGroup || row.group === selectedGroup);
  const dateLabel = DATE_OPTIONS.find((option) => option.id === appliedDate)?.label ?? "All dates";
  const serviceLabel = SERVICE_OPTIONS.find((option) => option.id === appliedService)?.label ?? "All services";

  return (
    <>
      <Link href="/staff/reports" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Saved reports
      </Link>
      <PageIntro
        title={report?.name ?? "Report"}
        action={<span className="pill blue">{visibleRows.length} records</span>}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <section className="panel report-filter-panel">
        <div>
          <strong>Date range</strong>
          <div className="field-choice-row">
            {DATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={draftDate === option.id ? "selected" : ""}
                onClick={() => setDraftDate(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <strong>Service</strong>
          <div className="field-choice-row">
            {SERVICE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={draftService === option.id ? "selected" : ""}
                onClick={() => setDraftService(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="report-controls">
          <button type="button" className="primary-button" onClick={viewResults} disabled={loading}>
            View Results
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!report || visibleRows.length === 0}
            onClick={() => {
              if (!report) return;
              downloadCsv(`${report.id}-report.csv`, reportToCsv({ ...report, rows: visibleRows }));
              setDownloaded(true);
              window.setTimeout(() => setDownloaded(false), 1800);
            }}
          >
            {downloaded ? "Downloaded" : "Export CSV"}
          </button>
          <button type="button" className="text-button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

      <section className="applied-filter-strip">
        <strong>Applied filters:</strong>
        <span>{dateLabel}</span>
        <span>{serviceLabel}</span>
        {selectedGroup ? <span>Group: {selectedGroup}</span> : null}
        <small>{visibleRows.length} matching records</small>
      </section>

      <Panel title="Groups">
        {(report?.groups ?? []).length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>{loading ? "Loading groups…" : "No groups for this view."}</p>
        ) : (
          report?.groups.map((group) => (
            <button
              key={group.name}
              type="button"
              className={selectedGroup === group.name ? "selected-report-group" : ""}
              onClick={() => setSelectedGroup(selectedGroup === group.name ? null : group.name)}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                alignItems: "center",
                border: 0,
                borderTop: "1px solid var(--line)",
                background: selectedGroup === group.name ? "var(--blue-soft)" : "#fff",
                padding: "12px 0",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>
                <strong style={{ display: "block" }}>{group.name}</strong>
                <small style={{ color: "var(--muted)" }}>{report.columns}</small>
              </span>
              <b>{group.count}</b>
              <span>{selectedGroup === group.name ? "Show all" : "Open rows →"}</span>
            </button>
          ))
        )}
      </Panel>

      <section className="panel filtered-report-table">
        <div className="panel-heading">
          <div>
            <h3 style={{ margin: 0 }}>{visibleRows.length} rows</h3>
          </div>
          {selectedGroup ? (
            <button type="button" className="text-button" onClick={() => setSelectedGroup(null)}>
              Clear group
            </button>
          ) : null}
        </div>
        {visibleRows.map((row) => (
          <Link
            key={row.id}
            href={row.href}
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1.5fr auto 100px 80px",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid var(--line)",
              background: "#fff",
              padding: "12px 16px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span>
              <strong>{row.name}</strong>
              <small>{row.detail}</small>
            </span>
            <span className={`pill ${row.service === "Exceptions" ? "amber" : "blue"}`}>{row.service}</span>
            <span>{row.period}</span>
            <b>{row.value}</b>
          </Link>
        ))}
        {!loading && visibleRows.length === 0 ? (
          <div className="empty-action compact-empty">
            <span className="empty-symbol">∅</span>
            <h3>No records match</h3>
            <p>Adjust the date/service filters or clear the group.</p>
            <button type="button" className="primary-button" onClick={resetFilters}>
              Reset
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
