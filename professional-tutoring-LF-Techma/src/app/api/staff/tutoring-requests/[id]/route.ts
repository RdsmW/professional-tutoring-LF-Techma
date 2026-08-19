import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import {
  listOpenSlotsForTutorWindow,
  listOpenTutorsForSubjectWindow,
} from "@/lib/booking/open-slots-for-subject-window";
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
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

const OCCUPYING = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await context.params;
    const database = requireDb();
    const [row] = await database
      .select({
        request: tutoringRequests,
        studentName: students.displayName,
        familyName: households.displayName,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(tutoringRequests)
      .innerJoin(students, eq(tutoringRequests.studentId, students.id))
      .innerJoin(households, eq(tutoringRequests.householdId, households.id))
      .innerJoin(subjects, eq(tutoringRequests.subjectId, subjects.id))
      .where(eq(tutoringRequests.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Registration not found." }, { status: 404 });
    }

    const occupying = await database
      .select({ id: bookings.id, status: bookings.status, slotId: bookings.slotId })
      .from(bookings)
      .where(and(eq(bookings.tutoringRequestId, row.request.id), inArray(bookings.status, [...OCCUPYING])))
      .limit(1);

    const payload = asRecord(row.request.payload);
    const catalogSubjectCode =
      typeof payload.catalogSubjectCode === "string" ? payload.catalogSubjectCode : "";
    const preferredWindowIds = Array.isArray(payload.preferredWindowIds)
      ? payload.preferredWindowIds.filter((value): value is string => typeof value === "string")
      : row.request.scheduleWindowId
        ? [row.request.scheduleWindowId]
        : [];

    const windows = preferredWindowIds.length
      ? preferredWindowIds
      : ACADEMIC_SCHEDULE_WINDOWS.options.map((option) => option.id);

    const compatible: Array<{
      windowId: string;
      windowLabel: string;
      tutors: Array<{
        id: string;
        displayName: string;
        openSlots: number;
        slots: Array<{
          id: string;
          dayOfWeek: number;
          startTimeLocal: string;
          endTimeLocal: string;
          openSeats: number;
        }>;
      }>;
    }> = [];

    if (catalogSubjectCode) {
      for (const windowId of windows) {
        const tutors = await listOpenTutorsForSubjectWindow({ subjectCode: catalogSubjectCode, windowId });
        const withSlots = [];
        for (const tutor of tutors) {
          const slots = await listOpenSlotsForTutorWindow({ tutorId: tutor.id, windowId });
          withSlots.push({
            id: tutor.id,
            displayName: tutor.displayName,
            openSlots: tutor.openSlots,
            slots: slots.map((slot) => ({
              id: slot.id,
              dayOfWeek: slot.dayOfWeek,
              startTimeLocal: slot.startTimeLocal,
              endTimeLocal: slot.endTimeLocal,
              openSeats: slot.openSeats,
            })),
          });
        }
        compatible.push({
          windowId,
          windowLabel:
            ACADEMIC_SCHEDULE_WINDOWS.options.find((option) => option.id === windowId)?.label ?? windowId,
          tutors: withSlots,
        });
      }
    }

    let preferredSlot: { openSeats: number; full: boolean } | null = null;
    if (row.request.preferredSlotId) {
      const [slot] = await database
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.id, row.request.preferredSlotId))
        .limit(1);
      if (slot) {
        const openSeats = slot.capacitySeats - slot.bookedSeats - slot.heldSeats;
        preferredSlot = { openSeats, full: openSeats <= 0 };
      }
    }

    return NextResponse.json({
      ok: true,
      request: {
        id: row.request.id,
        status: row.request.status,
        studentName: row.studentName,
        familyName: row.familyName,
        subjectName: row.subjectName,
        scheduleNotes: row.request.scheduleNotes,
        schedulingPath: payload.schedulingPath ?? null,
        identityReview: payload.identityReview ?? null,
        preferredWindows: preferredWindowIds,
        preferredSlotId: row.request.preferredSlotId,
        preferredSlot,
        occupyingBooking: occupying[0] ?? null,
        billingContact: payload.billingContact ?? null,
        signatures: payload.signatures ?? null,
      },
      compatible,
    });
  } catch (error) {
    console.warn("[staff/tutoring-requests/id] GET fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load this registration." }, { status: 500 });
  }
}
