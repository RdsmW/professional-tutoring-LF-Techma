import { and, eq, inArray, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, bookings, tutoringRequests } from "@/lib/db/schema";

const OCCUPYING_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

export class AssignTutoringRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "invalid_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Path B (and Path A re-pick): update the existing tutoring_requests row,
 * insert one booking, increment booked_seats. Never inserts a second request.
 */
export async function assignTutoringRequest(input: {
  requestId: string;
  tutorId: string;
  slotId: string;
  staffId: string;
}) {
  const database = requireDb();
  const now = new Date();

  return database.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(tutoringRequests)
      .where(eq(tutoringRequests.id, input.requestId))
      .limit(1);

    if (!request) {
      throw new AssignTutoringRequestError("Registration not found.", 404, "not_found");
    }
    if (request.status === "cancelled") {
      throw new AssignTutoringRequestError("This registration was cancelled.", 409, "cancelled");
    }

    const occupying = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.tutoringRequestId, request.id),
          inArray(bookings.status, [...OCCUPYING_BOOKING_STATUSES]),
        ),
      )
      .limit(1);
    if (occupying.length > 0) {
      throw new AssignTutoringRequestError("This registration already has a confirmed time.", 409, "already_assigned");
    }

    const [claimed] = await tx
      .update(availabilitySlots)
      .set({
        bookedSeats: sql`${availabilitySlots.bookedSeats} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(availabilitySlots.id, input.slotId),
          eq(availabilitySlots.tutorId, input.tutorId),
          eq(availabilitySlots.active, true),
          sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
        ),
      )
      .returning({
        id: availabilitySlots.id,
        scheduleWindowId: availabilitySlots.scheduleWindowId,
      });

    if (!claimed) {
      throw new AssignTutoringRequestError(
        "That time is no longer open. Choose another tutor or time.",
        409,
        "slot_unavailable",
      );
    }

    const previousPayload =
      request.payload && typeof request.payload === "object" && !Array.isArray(request.payload)
        ? (request.payload as Record<string, unknown>)
        : {};

    const [updatedRequest] = await tx
      .update(tutoringRequests)
      .set({
        preferredSlotId: input.slotId,
        status: "confirmed",
        scheduleWindowId: claimed.scheduleWindowId ?? request.scheduleWindowId,
        payload: {
          ...previousPayload,
          assignedByStaffId: input.staffId,
          assignedAt: now.toISOString(),
          assignedTutorId: input.tutorId,
          assignedSlotId: input.slotId,
        },
        updatedAt: now,
      })
      .where(eq(tutoringRequests.id, request.id))
      .returning();

    const [booking] = await tx
      .insert(bookings)
      .values({
        tutoringRequestId: request.id,
        householdId: request.householdId,
        studentId: request.studentId,
        subjectId: request.subjectId,
        tutorId: input.tutorId,
        slotId: input.slotId,
        status: "confirmed",
        seatsClaimed: 1,
        confirmedByStaffId: input.staffId,
        confirmedAt: now,
        updatedAt: now,
      })
      .returning();

    return { request: updatedRequest, booking };
  });
}
