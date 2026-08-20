import { and, eq, inArray, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  paymentRecords,
  tutorSubjects,
  tutors,
  tutoringRequests,
} from "@/lib/db/schema";

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
  staffId?: string | null;
  /**
   * Path A uses the existing atomic slot claim while Stripe has an active
   * authorization. It is immediately confirmed or removed after capture.
   */
  bookingStatus?: "confirmed" | "pending_payment";
}) {
  const database = requireDb();
  const now = new Date();
  const bookingStatus = input.bookingStatus ?? "confirmed";
  const isStaffAssignment = Boolean(input.staffId);

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

    if (isStaffAssignment) {
      const [payment] = await tx
        .select({
          status: paymentRecords.status,
          paymentSetupCompletedAt: paymentRecords.paymentSetupCompletedAt,
        })
        .from(paymentRecords)
        .where(
          and(
            eq(paymentRecords.relatedEntityType, "tutoring_request"),
            eq(paymentRecords.relatedEntityId, request.id),
          ),
        )
        .limit(1);
      if (payment && payment.status !== "paid" && !payment.paymentSetupCompletedAt) {
        throw new AssignTutoringRequestError(
          "Complete the selected payment or payment setup before assigning a tutor.",
          409,
          "payment_not_ready",
        );
      }
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

    if (!isStaffAssignment) {
      if (!request.scheduleWindowId) {
        throw new AssignTutoringRequestError(
          "The originally selected scheduling window is no longer available. Choose another tutor or time.",
          409,
          "slot_unavailable",
        );
      }

      const [eligibleTutor] = await tx
        .select({ id: tutors.id })
        .from(tutors)
        .innerJoin(tutorSubjects, eq(tutorSubjects.tutorId, tutors.id))
        .where(
          and(
            eq(tutors.id, input.tutorId),
            eq(tutors.active, true),
            eq(tutorSubjects.subjectId, request.subjectId),
          ),
        )
        .limit(1);

      if (!eligibleTutor) {
        throw new AssignTutoringRequestError(
          "That tutor is no longer available for this subject. Choose another tutor or time.",
          409,
          "tutor_unavailable",
        );
      }
    }

    const slotClaimConditions = [
      eq(availabilitySlots.id, input.slotId),
      eq(availabilitySlots.tutorId, input.tutorId),
      eq(availabilitySlots.active, true),
      sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
    ];
    if (!isStaffAssignment) {
      slotClaimConditions.push(eq(availabilitySlots.scheduleWindowId, request.scheduleWindowId!));
    }

    const [claimed] = await tx
      .update(availabilitySlots)
      .set({
        bookedSeats: sql`${availabilitySlots.bookedSeats} + 1`,
        updatedAt: now,
      })
      .where(and(...slotClaimConditions))
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
        status: bookingStatus === "confirmed" ? "confirmed" : "pending_staff_review",
        scheduleWindowId: claimed.scheduleWindowId ?? request.scheduleWindowId,
        payload: {
          ...previousPayload,
          ...(isStaffAssignment ? { assignedByStaffId: input.staffId } : { assignedByFamily: true }),
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
        status: bookingStatus,
        seatsClaimed: 1,
        confirmedByStaffId: bookingStatus === "confirmed" && isStaffAssignment ? input.staffId : null,
        confirmedAt: bookingStatus === "confirmed" ? now : null,
        updatedAt: now,
      })
      .returning();

    return { request: updatedRequest, booking };
  });
}

/** Finalize a Path A booking only after Stripe captures its authorization. */
export async function confirmPendingPaymentBooking(input: { requestId: string; bookingId: string }) {
  const database = requireDb();
  const now = new Date();
  return database.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.tutoringRequestId, input.requestId)))
      .limit(1);
    if (!booking || booking.status !== "pending_payment") {
      throw new AssignTutoringRequestError("Pending booking not found.", 409, "pending_booking_not_found");
    }
    const [updatedBooking] = await tx
      .update(bookings)
      .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
      .where(eq(bookings.id, booking.id))
      .returning();
    const [updatedRequest] = await tx
      .update(tutoringRequests)
      .set({ status: "confirmed", updatedAt: now })
      .where(eq(tutoringRequests.id, input.requestId))
      .returning();
    return { booking: updatedBooking, request: updatedRequest };
  });
}

/**
 * If Stripe capture fails, delete the short-lived pending booking and return
 * the claimed seat. The request remains available for a fresh payment attempt.
 */
export async function releasePendingPaymentBooking(input: { requestId: string; bookingId: string }) {
  const database = requireDb();
  const now = new Date();
  return database.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.tutoringRequestId, input.requestId)))
      .limit(1);
    if (!booking || booking.status !== "pending_payment" || !booking.slotId) return;

    await tx.delete(bookings).where(eq(bookings.id, booking.id));
    await tx
      .update(availabilitySlots)
      .set({
        bookedSeats: sql`GREATEST(${availabilitySlots.bookedSeats} - 1, 0)`,
        updatedAt: now,
      })
      .where(eq(availabilitySlots.id, booking.slotId));
    await tx
      .update(tutoringRequests)
      .set({ status: "pending_staff_review", updatedAt: now })
      .where(eq(tutoringRequests.id, input.requestId));
  });
}
