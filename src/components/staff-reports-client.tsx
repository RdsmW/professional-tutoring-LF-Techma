"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import type { ReportCatalogItem } from "@/lib/reports/types";

export function StaffReportsClient() {
  const [reports, setReports] = useState<ReportCatalogItem[]>([]);
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
        title="Reports"
        action={<span className="pill blue">{reports.length} saved reports</span>}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <Panel title="Saved reports">
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
              <b>Open →</b>
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
