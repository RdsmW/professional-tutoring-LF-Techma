import { StaffReportsClient } from "@/components/staff-reports-client";
import { listReportCatalog } from "@/lib/reports/run";

export default function StaffReportsPage() {
  const catalog = listReportCatalog();
  return <StaffReportsClient initialReports={catalog.reports} />;
}
