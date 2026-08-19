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
        <div className="report-definition-list staff-reports-table">
          <div className="report-definition-head staff-reports-cols">
            <span>Saved report</span>
            <span>Summary</span>
            <span>Records</span>
            <span className="staff-dir-col-actions" aria-label="Actions" />
          </div>
          {reports.map((report) => (
            <div key={report.id} className="staff-reports-row staff-reports-cols">
              <strong>{report.name}</strong>
              <span>{report.summary}</span>
              <span className="pill">—</span>
              <span className="staff-dir-col-actions">
                <Link href={`/staff/reports/${report.id}`} className="secondary-button staff-open-control">
                  Open
                </Link>
              </span>
            </div>
          ))}
          {reports.length === 0 ? (
            <p style={{ padding: "13px 15px", color: "var(--muted)" }}>No saved reports available.</p>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
