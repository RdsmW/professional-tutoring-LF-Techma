import { and, desc, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  households,
  students,
  subjects,
  tutoringRequests,
} from "@/lib/db/schema";
import { ACADEMIC_SCHEDULE_WINDOWS } from "@/lib/forms/options";

const OCCUPYING_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export type TutoringAssignmentQueueRow = {
  id: string;
  studentName: string;
  familyName: string;
  subjectName: string;
  schedulingPath: "family_selected" | "pt_chooses" | "unknown";
  identityReview: string | null;
  preferredWindowsLabel: string;
  preferredSlotFull: boolean;
  reason: string;
  createdAt: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function windowLabel(id: string) {
  return ACADEMIC_SCHEDULE_WINDOWS.options.find((option) => option.id === id)?.label ?? id;
}

export async function listTutoringAssignmentQueue(): Promise<TutoringAssignmentQueueRow[]> {
  const database = requireDb();
  const rows = await database
    .select({
      id: tutoringRequests.id,
      createdAt: tutoringRequests.createdAt,
      preferredSlotId: tutoringRequests.preferredSlotId,
      scheduleWindowId: tutoringRequests.scheduleWindowId,
      payload: tutoringRequests.payload,
      studentName: students.displayName,
      familyName: households.displayName,
      subjectName: subjects.name,
      slotCapacity: availabilitySlots.capacitySeats,
      slotBooked: availabilitySlots.bookedSeats,
      slotHeld: availabilitySlots.heldSeats,
    })
    .from(tutoringRequests)
    .innerJoin(students, eq(tutoringRequests.studentId, students.id))
    .innerJoin(households, eq(tutoringRequests.householdId, households.id))
    .innerJoin(subjects, eq(tutoringRequests.subjectId, subjects.id))
    .leftJoin(availabilitySlots, eq(tutoringRequests.preferredSlotId, availabilitySlots.id))
    .where(
      and(
        eq(tutoringRequests.formId, "academic_year_tutoring"),
        eq(tutoringRequests.status, "pending_staff_review"),
      ),
    )
    .orderBy(desc(tutoringRequests.createdAt));

  const occupying = await database
    .select({ tutoringRequestId: bookings.tutoringRequestId })
    .from(bookings)
    .where(inArray(bookings.status, [...OCCUPYING_BOOKING_STATUSES]));
  const occupyingIds = new Set(
    occupying.map((row) => row.tutoringRequestId).filter((id): id is string => Boolean(id)),
  );

  const queue: TutoringAssignmentQueueRow[] = [];
  for (const row of rows) {
    if (occupyingIds.has(row.id)) continue;
    const payload = asRecord(row.payload);
    const schedulingPath =
      payload.schedulingPath === "family_selected" || payload.schedulingPath === "pt_chooses"
        ? payload.schedulingPath
        : row.preferredSlotId
          ? "family_selected"
          : "pt_chooses";
    const identityReview = typeof payload.identityReview === "string" ? payload.identityReview : null;
    const preferredSlotFull =
      row.preferredSlotId != null &&
      row.slotCapacity != null &&
      row.slotBooked != null &&
      row.slotHeld != null &&
      row.slotBooked + row.slotHeld >= row.slotCapacity;

    const isPathAOpenPreference =
      schedulingPath === "family_selected" && Boolean(row.preferredSlotId) && !preferredSlotFull && !identityReview;
    if (isPathAOpenPreference) continue;

    const windowIds = Array.isArray(payload.preferredWindowIds)
      ? payload.preferredWindowIds.filter((id): id is string => typeof id === "string")
      : row.scheduleWindowId
        ? [row.scheduleWindowId]
        : [];

    let reason = "Tutor assignment required";
    if (identityReview) reason = "Needs identity review";
    else if (preferredSlotFull) reason = "Preferred time is full — choose another";

    queue.push({
      id: row.id,
      studentName: row.studentName,
      familyName: row.familyName,
      subjectName: row.subjectName,
      schedulingPath,
      identityReview,
      preferredWindowsLabel: windowIds.map(windowLabel).join("; ") || "No preferred times listed",
      preferredSlotFull,
      reason,
      createdAt: row.createdAt.toISOString(),
    });
  }

  return queue;
}