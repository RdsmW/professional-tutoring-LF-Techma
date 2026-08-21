import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, bookings, subjects, tutorSubjects, tutors } from "@/lib/db/schema";
import { isInstantInRange, periodLabelForInstant, type YmdRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { serviceFilterLabel } from "@/lib/reports/labels";
import { formatHours, slotHours } from "@/lib/reports/slot-hours";
import {
  applyServiceFilter,
  groupRows,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
} from "@/lib/reports/types";

const OPEN_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export async function queryTutorsReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const [tutorRows, slotRows, subjectRows, bookingRows] = await Promise.all([
    database.select().from(tutors),
    database
      .select({
        tutorId: availabilitySlots.tutorId,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
        active: availabilitySlots.active,
      })
      .from(availabilitySlots),
    database
      .select({
        tutorId: tutorSubjects.tutorId,
        subjectName: subjects.name,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subjectId, subjects.id)),
    database
      .select({
        tutorId: bookings.tutorId,
        updatedAt: bookings.updatedAt,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
      })
      .from(bookings)
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .where(and(inArray(bookings.status, [...OPEN_BOOKING_STATUSES]), isNotNull(bookings.tutorId))),
  ]);

  const subjectsByTutor = new Map<string, string[]>();
  for (const row of subjectRows) {
    const list = subjectsByTutor.get(row.tutorId) ?? [];
    list.push(row.subjectName);
    subjectsByTutor.set(row.tutorId, list);
  }

  const declaredByTutor = new Map<string, number>();
  for (const slot of slotRows) {
    if (!slot.active) continue;
    declaredByTutor.set(slot.tutorId, (declaredByTutor.get(slot.tutorId) ?? 0) + slotHours(slot.startTimeLocal, slot.endTimeLocal));
  }

  const bookedByTutor = new Map<string, { hours: number; at: Date }>();
  for (const booking of bookingRows) {
    if (!booking.tutorId) continue;
    if (!isInstantInRange(booking.updatedAt, range) && range.startYmd) continue;
    const hours = slotHours(booking.startTimeLocal, booking.endTimeLocal);
    const previous = bookedByTutor.get(booking.tutorId);
    bookedByTutor.set(booking.tutorId, {
      hours: (previous?.hours ?? 0) + hours,
      at: !previous || booking.updatedAt > previous.at ? booking.updatedAt : previous.at,
    });
  }

  const assembled: ReportRow[] = tutorRows.map((tutor) => {
    const declared = declaredByTutor.get(tutor.id) ?? 0;
    const booked = bookedByTutor.get(tutor.id)?.hours ?? 0;
    const open = Math.max(declared - booked, 0);
    const pct = declared > 0 ? Math.round((booked / declared) * 100) : 0;
    const group = !tutor.active
      ? "Inactive"
      : open <= 0 && declared > 0
        ? "At capacity"
        : "Active with openings";
    const subjectList = subjectsByTutor.get(tutor.id) ?? [];
    return {
      id: tutor.id,
      name: tutor.displayName,
      detail: `${formatHours(booked)} / ${formatHours(declared)} · ${formatHours(open)} open · ${subjectList.slice(0, 3).join(", ") || "No subjects"}`,
      service: "Tutoring" as const,
      period: periodLabelForInstant(bookedByTutor.get(tutor.id)?.at ?? tutor.updatedAt, range),
      group,
      value: `${pct}%`,
      href: `/staff/tutors/${tutor.id}`,
    };
  });

  const dated = assembled.filter((row) => {
    const tutor = tutorRows.find((item) => item.id === row.id);
    if (!tutor) return false;
    if (!range.startYmd) return true;
    const bookedAt = bookedByTutor.get(row.id)?.at ?? null;
    return isInstantInRange(bookedAt ?? tutor.updatedAt, range);
  });

  const rows = applyServiceFilter(dated, filters.service);

  return {
    ...REPORT_DEFINITIONS.tutors,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      { label: "Active tutors", value: String(rows.filter((row) => row.group !== "Inactive").length), detail: "Not archived" },
    ],
    groups: groupRows(rows),
    rows,
  };
}
