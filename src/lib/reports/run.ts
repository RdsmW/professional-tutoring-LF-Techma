import { resolveDateRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITION_LIST } from "@/lib/reports/definitions";
import { queryActiveReport } from "@/lib/reports/queries/active";
import { queryAttendanceReport } from "@/lib/reports/queries/attendance";
import { queryCoursesReport } from "@/lib/reports/queries/courses";
import { queryRevenueReport } from "@/lib/reports/queries/revenue";
import { querySchoolReport } from "@/lib/reports/queries/school";
import { queryTutorsReport } from "@/lib/reports/queries/tutors";
import { queryWaitlistReport } from "@/lib/reports/queries/waitlist";
import type { ReportCatalogItem, ReportFilters, ReportId, ReportResult } from "@/lib/reports/types";

const ALL_FILTERS: ReportFilters = { date: "all", service: "all" };

export async function runReport(id: ReportId, filters: ReportFilters): Promise<ReportResult> {
  const range = resolveDateRange(filters.date);
  if (id === "active") return queryActiveReport(filters, range);
  if (id === "tutors") return queryTutorsReport(filters, range);
  if (id === "attendance") return queryAttendanceReport(filters, range);
  if (id === "courses") return queryCoursesReport(filters, range);
  if (id === "waitlist") return queryWaitlistReport(filters, range);
  if (id === "revenue") return queryRevenueReport(filters, range);
  return querySchoolReport(filters, range);
}

export async function listReportCatalog(): Promise<{
  reports: ReportCatalogItem[];
  metrics: { label: string; value: string; detail: string }[];
}> {
  const [active, tutors, attendance, courses, waitlist, revenue, school] = await Promise.all(
    REPORT_DEFINITION_LIST.map((definition) => runReport(definition.id, ALL_FILTERS)),
  );
  const results = [active, tutors, attendance, courses, waitlist, revenue, school];
  return {
    reports: results.map((result) => ({
      id: result.id,
      name: result.name,
      summary: result.summary,
      columns: result.columns,
      count: result.rows.length,
    })),
    metrics: [
      { label: "Active students", value: String(active.rows.length), detail: "Open the report for filters" },
      { label: "Tutor records", value: String(tutors.rows.length), detail: "Derived weekly metrics" },
      { label: "Attendance rows", value: String(attendance.rows.length), detail: "Bookings as sessions" },
      { label: "Billing records", value: String(revenue.rows.length), detail: "Ledger only · not posted" },
    ],
  };
}
