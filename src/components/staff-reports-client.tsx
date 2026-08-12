"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import type { ReportCatalogItem, ReportMetric } from "@/lib/reports/types";

export function StaffReportsClient() {
  const [reports, setReports] = useState<ReportCatalogItem[]>([]);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/staff/reports");
        const data = await response.json();
        if (!response.ok || !data.ok) {
          if (!cancelled) setError(data.error || "Unable to load saved reports.");
          return;
        }
        if (!cancelled) {
          setReports(data.reports ?? []);
          setMetrics(data.metrics ?? []);
        }
      } catch {
        if (!cancelled) setError("Unable to load saved reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="Decision support"
        title="Reports"
        description="Every saved definition opens a filterable result set with matching count, metrics, groups, and record drill-down."
        action={<span className="pill blue">{reports.length} saved reports</span>}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <section className="report-metrics">
        {(metrics.length
          ? metrics
          : [
              { label: "Active students", value: loading ? "…" : "0", detail: "Open the report for filters" },
              { label: "Tutor records", value: loading ? "…" : "0", detail: "Derived weekly metrics" },
              { label: "Attendance rows", value: loading ? "…" : "0", detail: "Bookings as sessions" },
              { label: "Billing records", value: loading ? "…" : "0", detail: "Ledger only · not posted" },
            ]
        ).map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>{loading && !metrics.length ? "…" : metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <Panel title="Saved report definitions" eyebrow="Staff workspace">
        <div className="report-definition-list">
          <div className="report-definition-head">
            <span>Saved report</span>
            <span>Summary</span>
            <span>Records</span>
            <span />
          </div>
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/staff/reports/${report.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1.6fr .5fr .7fr",
                gap: 12,
                alignItems: "center",
                borderTop: "1px solid var(--line)",
                padding: "13px 15px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <strong>{report.name}</strong>
              <span>{report.summary}</span>
              <span className="pill blue">{report.count}</span>
              <b>Open report →</b>
            </Link>
          ))}
          {!loading && reports.length === 0 ? (
            <p style={{ padding: "13px 15px", color: "var(--muted)" }}>No saved reports available.</p>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
