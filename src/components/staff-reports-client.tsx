"use client";

import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import type { ReportCatalogItem } from "@/lib/reports/types";

export function StaffReportsClient({
  initialReports,
}: {
  initialReports: ReportCatalogItem[];
}) {
  const reports = initialReports;

  return (
    <>
      <PageIntro
        title="Reports"
        action={<span className="pill blue">{reports.length} saved reports</span>}
      />

      <Panel>
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
              <span className="pill">—</span>
              <b>Open →</b>
            </Link>
          ))}
          {reports.length === 0 ? (
            <p style={{ padding: "13px 15px", color: "var(--muted)" }}>No saved reports available.</p>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
