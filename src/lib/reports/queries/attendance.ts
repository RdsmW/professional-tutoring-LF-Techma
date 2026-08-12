import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  changeRequests,
  households,
  students,
  subjects,
  tutors,
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
  type ServiceLabel,
} from "@/lib/reports/types";

export async function queryAttendanceReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const [sessionRows, exceptionIds] = await Promise.all([
    database
      .select({
        id: bookings.id,
        status: bookings.status,
        attendanceStatus: bookings.attendanceStatus,
        confirmedAt: bookings.confirmedAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        studentName: students.displayName,
        householdName: households.displayName,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
      })
      .from(bookings)
      .innerJoin(students, eq(bookings.studentId, students.id))
      .innerJoin(households, eq(bookings.householdId, households.id))
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id)),
    database
      .select({ relatedEntityId: changeRequests.relatedEntityId })
      .from(changeRequests)
      .where(eq(changeRequests.relatedEntityType, "booking")),
  ]);

  const exceptionSet = new Set(
    exceptionIds.map((row) => row.relatedEntityId).filter((id): id is string => Boolean(id)),
  );

  const assembled: ReportRow[] = [];
  for (const row of sessionRows) {
    const activityAt = row.confirmedAt ?? row.createdAt;
    if (!isInstantInRange(activityAt, range)) continue;
    const hasException = exceptionSet.has(row.id);
    const service: ServiceLabel = hasException ? "Exceptions" : "Tutoring";
    const attendance = row.attendanceStatus || "Unrecorded";
    const group = attendanceGroup(row.status, row.attendanceStatus);
    assembled.push({
      id: row.id,
      name: `${row.studentName}${row.subjectName ? ` · ${row.subjectName}` : ""}`,
      detail: `${row.householdName} · ${row.tutorName || "Unassigned"} · ${attendance}`,
      service,
      period: periodLabelForInstant(activityAt, range),
      group,
      value: statusLabel(row.status, row.attendanceStatus),
      href: `/staff/sessions/${row.id}`,
    });
  }

  const rows = applyServiceFilter(assembled, filters.service);

  return {
    ...REPORT_DEFINITIONS.attendance,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      {
        label: "Recorded attendance",
        value: String(rows.filter((row) => !row.detail.includes("Unrecorded")).length),
        detail: "Present / absent / late / excused",
      },
    ],
    groups: groupRows(rows),
    rows,
  };
}

function attendanceGroup(status: string, attendance: string | null) {
  if (status === "cancelled" || attendance === "absent") return "Cancelled / No-show";
  if (attendance === "present" || attendance === "late" || attendance === "excused") return "Completed";
  return "Scheduled";
}

function statusLabel(status: string, attendance: string | null) {
  if (attendance) return attendance;
  return status;
}
