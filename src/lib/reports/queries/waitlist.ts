import { eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  courseOfferings,
  students,
  subjects,
  tutoringRequests,
} from "@/lib/db/schema";
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

const OPEN_REQUEST_STATUSES = ["submitted", "held", "pending_staff_review"] as const;

export async function queryWaitlistReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const now = new Date();

  const [requestRows, confirmedBookings, waitlistedEnrollments] = await Promise.all([
    database
      .select({
        id: tutoringRequests.id,
        createdAt: tutoringRequests.createdAt,
        scheduleWindowId: tutoringRequests.scheduleWindowId,
        studentId: students.id,
        studentName: students.displayName,
        subjectName: subjects.name,
      })
      .from(tutoringRequests)
      .innerJoin(students, eq(tutoringRequests.studentId, students.id))
      .innerJoin(subjects, eq(tutoringRequests.subjectId, subjects.id))
      .where(inArray(tutoringRequests.status, [...OPEN_REQUEST_STATUSES])),
    database
      .select({ tutoringRequestId: bookings.tutoringRequestId })
      .from(bookings)
      .where(eq(bookings.status, "confirmed")),
    database
      .select({
        id: courseEnrollments.id,
        createdAt: courseEnrollments.createdAt,
        requestedSlotPreference: courseEnrollments.requestedSlotPreference,
        studentId: students.id,
        studentName: students.displayName,
        courseName: courseOfferings.name,
      })
      .from(courseEnrollments)
      .innerJoin(students, eq(courseEnrollments.studentId, students.id))
      .innerJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
      .where(eq(courseEnrollments.status, "waitlisted")),
  ]);

  const confirmedIds = new Set(
    confirmedBookings.map((row) => row.tutoringRequestId).filter((id): id is string => Boolean(id)),
  );

  const assembled: ReportRow[] = [];

  for (const row of requestRows) {
    if (confirmedIds.has(row.id)) continue;
    if (!isInstantInRange(row.createdAt, range)) continue;
    const days = ageDays(row.createdAt, now);
    assembled.push({
      id: row.id,
      name: row.studentName,
      detail: `${row.subjectName} · ${row.scheduleWindowId || "No requested window"}`,
      service: "Tutoring",
      period: periodLabelForInstant(row.createdAt, range),
      group: ageGroup(days),
      value: `${days} day${days === 1 ? "" : "s"}`,
      href: `/staff/students/${row.studentId}`,
    });
  }

  for (const row of waitlistedEnrollments) {
    if (!isInstantInRange(row.createdAt, range)) continue;
    const days = ageDays(row.createdAt, now);
    assembled.push({
      id: row.id,
      name: row.studentName,
      detail: `${row.courseName} · ${row.requestedSlotPreference || "No class-time preference"}`,
      service: "Courses",
      period: periodLabelForInstant(row.createdAt, range),
      group: ageGroup(days),
      value: `${days} day${days === 1 ? "" : "s"}`,
      href: `/staff/students/${row.studentId}`,
    });
  }

  const rows = applyServiceFilter(assembled, filters.service);
  const oldest = rows.reduce((max, row) => Math.max(max, parseAge(row.value)), 0);

  return {
    ...REPORT_DEFINITIONS.waitlist,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      {
        label: "Oldest age",
        value: rows.length ? `${oldest} days` : "0 days",
        detail: "From visible waitlist rows",
      },
    ],
    groups: groupRows(rows),
    rows,
  };
}

function ageDays(createdAt: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000));
}

function ageGroup(days: number) {
  if (days <= 5) return "0–5 days";
  if (days <= 10) return "6–10 days";
  return "Over 10 days";
}

function parseAge(value: string) {
  return Number.parseInt(value, 10) || 0;
}
