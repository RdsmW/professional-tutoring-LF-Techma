import { inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings } from "@/lib/db/schema";
import { ACTIVE_ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { isInstantInRange, periodLabelForInstant, type YmdRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { serviceFilterLabel } from "@/lib/reports/labels";
import {
  applyServiceFilter,
  groupRows,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
} from "@/lib/reports/types";

export async function queryCoursesReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const [offerings, enrollments] = await Promise.all([
    database.select().from(courseOfferings),
    database
      .select({
        courseOfferingId: courseEnrollments.courseOfferingId,
        createdAt: courseEnrollments.createdAt,
      })
      .from(courseEnrollments)
      .where(inArray(courseEnrollments.status, [...ACTIVE_ENROLLMENT_STATUSES])),
  ]);

  const latestEnrollment = new Map<string, Date>();
  const enrollmentCounts = new Map<string, number>();
  for (const row of enrollments) {
    enrollmentCounts.set(row.courseOfferingId, (enrollmentCounts.get(row.courseOfferingId) ?? 0) + 1);
    const previous = latestEnrollment.get(row.courseOfferingId);
    if (!previous || row.createdAt > previous) latestEnrollment.set(row.courseOfferingId, row.createdAt);
  }

  const assembled: ReportRow[] = [];
  for (const offering of offerings) {
    const activityAt = latestEnrollment.get(offering.id) ?? offering.updatedAt;
    if (!isInstantInRange(activityAt, range)) continue;
    const enrolled = enrollmentCounts.get(offering.id) ?? offering.enrolledCount;
    const fill = offering.capacity > 0 ? Math.round((enrolled / offering.capacity) * 100) : 0;
    assembled.push({
      id: offering.id,
      name: offering.name,
      detail: `${enrolled} / ${offering.capacity} seats · ${offering.termLabel || "No term"} · ${offering.active ? "enrollment open" : "archived"}`,
      service: "Courses",
      period: periodLabelForInstant(activityAt, range),
      group: offering.name,
      value: `${fill}%`,
      href: `/staff/scheduling/courses/${offering.id}`,
    });
  }

  const rows = applyServiceFilter(assembled, filters.service);

  return {
    ...REPORT_DEFINITIONS.courses,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      {
        label: "Active offerings",
        value: String(offerings.filter((row) => row.active).length),
        detail: "Not archived",
      },
    ],
    groups: groupRows(rows),
    rows,
  };
}
