import { eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  changeRequests,
  courseEnrollments,
  households,
  students,
} from "@/lib/db/schema";
import { ACTIVE_ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { isInstantInRange, periodLabelForInstant, type YmdRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import {
  groupRows,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
  type ServiceFilter,
  type ServiceLabel,
} from "@/lib/reports/types";
import { serviceFilterLabel } from "@/lib/reports/labels";

const OPEN_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export async function queryActiveReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const [studentRows, bookingRows, enrollmentRows, exceptionRows] = await Promise.all([
    database
      .select({
        id: students.id,
        displayName: students.displayName,
        schoolName: students.schoolName,
        lifecycle: students.lifecycle,
        updatedAt: students.updatedAt,
        householdId: households.id,
        householdName: households.displayName,
        householdStatus: households.status,
      })
      .from(students)
      .innerJoin(households, eq(students.householdId, households.id)),
    database
      .select({
        studentId: bookings.studentId,
        updatedAt: bookings.updatedAt,
      })
      .from(bookings)
      .where(inArray(bookings.status, [...OPEN_BOOKING_STATUSES])),
    database
      .select({
        studentId: courseEnrollments.studentId,
        updatedAt: courseEnrollments.updatedAt,
      })
      .from(courseEnrollments)
      .where(inArray(courseEnrollments.status, [...ACTIVE_ENROLLMENT_STATUSES])),
    database
      .select({
        studentId: changeRequests.studentId,
        updatedAt: changeRequests.updatedAt,
      })
      .from(changeRequests),
  ]);

  const latestBooking = latestByStudent(bookingRows);
  const latestEnrollment = latestByStudent(enrollmentRows);
  const latestException = latestByStudent(exceptionRows);

  const rows: ReportRow[] = [];
  for (const row of studentRows) {
    const tutoringAt = latestBooking.get(row.id) ?? null;
    const courseAt = latestEnrollment.get(row.id) ?? null;
    const exceptionAt = latestException.get(row.id) ?? null;
    const flags = {
      tutoring: Boolean(tutoringAt),
      courses: Boolean(courseAt),
      exceptions: Boolean(exceptionAt),
    };
    const activityAt = latestDate([row.updatedAt, tutoringAt, courseAt, exceptionAt]);
    if (!isInstantInRange(activityAt, range)) continue;
    if (!matchesService(flags, filters.service)) continue;

    const { group, service } = classify(flags);
    rows.push({
      id: row.id,
      name: row.displayName,
      detail: `${row.householdName} · ${row.householdStatus} · ${row.schoolName?.trim() || "School unspecified"}`,
      service,
      period: periodLabelForInstant(activityAt, range),
      group,
      value: row.lifecycle,
      href: `/staff/students/${row.id}`,
    });
  }

  return {
    ...REPORT_DEFINITIONS.active,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      {
        label: "Households represented",
        value: String(new Set(rows.map((row) => row.detail.split(" · ")[0])).size),
        detail: "From student rows",
      },
    ],
    groups: groupRows(rows),
    rows,
  };
}

function matchesService(
  flags: { tutoring: boolean; courses: boolean; exceptions: boolean },
  service: ServiceFilter,
) {
  if (service === "all") return true;
  if (service === "tutoring") return flags.tutoring;
  if (service === "courses") return flags.courses;
  return flags.exceptions;
}

function classify(flags: { tutoring: boolean; courses: boolean; exceptions: boolean }): {
  group: string;
  service: ServiceLabel;
} {
  if (flags.tutoring && flags.courses) return { group: "Multiple services", service: "Tutoring" };
  if (flags.tutoring) return { group: "Active tutoring", service: "Tutoring" };
  if (flags.courses) return { group: "Active course enrollment", service: "Courses" };
  if (flags.exceptions) return { group: "Exceptions", service: "Exceptions" };
  return { group: "No active service", service: "Tutoring" };
}

function latestByStudent(rows: Array<{ studentId: string; updatedAt: Date }>) {
  const map = new Map<string, Date>();
  for (const row of rows) {
    const previous = map.get(row.studentId);
    if (!previous || row.updatedAt > previous) map.set(row.studentId, row.updatedAt);
  }
  return map;
}

function latestDate(dates: Array<Date | null>): Date | null {
  return dates.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    if (!latest || value > latest) return value;
    return latest;
  }, null);
}
