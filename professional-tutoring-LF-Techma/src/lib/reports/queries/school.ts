import { eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  households,
  students,
} from "@/lib/db/schema";
import { ACTIVE_ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { isInstantInRange, type YmdRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { serviceFilterLabel } from "@/lib/reports/labels";
import {
  applyServiceFilter,
  groupRows,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
  type ServiceLabel,
} from "@/lib/reports/types";

const OPEN_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export async function querySchoolReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const [studentRows, bookingRows, enrollmentRows] = await Promise.all([
    database
      .select({
        id: students.id,
        schoolName: students.schoolName,
        lifecycle: students.lifecycle,
        updatedAt: students.updatedAt,
        householdStatus: households.status,
      })
      .from(students)
      .innerJoin(households, eq(students.householdId, households.id)),
    database
      .select({ studentId: bookings.studentId })
      .from(bookings)
      .where(inArray(bookings.status, [...OPEN_BOOKING_STATUSES])),
    database
      .select({ studentId: courseEnrollments.studentId })
      .from(courseEnrollments)
      .where(inArray(courseEnrollments.status, [...ACTIVE_ENROLLMENT_STATUSES])),
  ]);

  const tutoringIds = new Set(bookingRows.map((row) => row.studentId));
  const courseIds = new Set(enrollmentRows.map((row) => row.studentId));

  type Bucket = {
    school: string;
    students: number;
    tutoring: number;
    courses: number;
    active: number;
  };
  const buckets = new Map<string, Bucket>();

  for (const row of studentRows) {
    if (!isInstantInRange(row.updatedAt, range)) continue;
    const school = row.schoolName?.trim() || "Unspecified";
    const bucket = buckets.get(school) ?? {
      school,
      students: 0,
      tutoring: 0,
      courses: 0,
      active: 0,
    };
    bucket.students += 1;
    if (tutoringIds.has(row.id)) bucket.tutoring += 1;
    if (courseIds.has(row.id)) bucket.courses += 1;
    if (row.lifecycle === "active" || row.householdStatus === "active") bucket.active += 1;
    buckets.set(school, bucket);
  }

  const assembled: ReportRow[] = [...buckets.values()].map((bucket) => {
    const serviceBits = [
      bucket.tutoring ? "tutoring" : null,
      bucket.courses ? "courses" : null,
    ].filter(Boolean);
    const service: ServiceLabel = bucket.courses && !bucket.tutoring ? "Courses" : "Tutoring";
    return {
      id: slug(bucket.school),
      name: bucket.school,
      detail: `${bucket.students} student${bucket.students === 1 ? "" : "s"} · ${serviceBits.join(" and ") || "no current service"}`,
      service,
      period: range.label,
      group: bucket.school === "Unspecified" ? "Unspecified" : bucket.school,
      value: String(bucket.students),
      href: "/staff/students",
    };
  });

  const rows = applyServiceFilter(
    assembled.filter((row) => {
      if (filters.service === "all") return true;
      if (filters.service === "tutoring") return row.detail.includes("tutoring");
      if (filters.service === "courses") return row.detail.includes("courses");
      return false;
    }),
    "all",
  );

  return {
    ...REPORT_DEFINITIONS.school,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      {
        label: "Students rolled up",
        value: String(rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0)),
        detail: "Free-text school attribute",
      },
    ],
    groups: groupRows(rows),
    rows,
  };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unspecified";
}
