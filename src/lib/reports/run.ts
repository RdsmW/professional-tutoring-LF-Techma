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

export function listReportCatalog(): {
  reports: ReportCatalogItem[];
} {
  return {
    reports: REPORT_DEFINITION_LIST.map((definition) => ({
      ...definition,
      count: null,
    })),
  };
}
