import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string; bookingId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id, bookingId } = await contextParams.params;
    const database = requireDb();

    const [row] = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        householdId: bookings.householdId,
        studentId: bookings.studentId,
        tutorId: bookings.tutorId,
        subjectId: bookings.subjectId,
        slotId: bookings.slotId,
        seatsClaimed: bookings.seatsClaimed,
        confirmedAt: bookings.confirmedAt,
        holdExpiresAt: bookings.holdExpiresAt,
        cancellationReason: bookings.cancellationReason,
        attendanceStatus: bookings.attendanceStatus,
        attendanceNotes: bookings.attendanceNotes,
        attendanceRecordedAt: bookings.attendanceRecordedAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        studentName: students.displayName,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
        slotLabel: availabilitySlots.label,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
        dayOfWeek: availabilitySlots.dayOfWeek,
      })
      .from(bookings)
      .leftJoin(students, eq(bookings.studentId, students.id))
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.householdId, id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = row.dayOfWeek != null ? dayNames[row.dayOfWeek] ?? null : null;
    const scheduleLabel =
      row.slotLabel ||
      [day, row.startTimeLocal && row.endTimeLocal ? `${row.startTimeLocal}–${row.endTimeLocal}` : null]
        .filter(Boolean)
        .join(" · ") ||
      null;

    return NextResponse.json({
      ok: true,
      booking: {
        id: row.id,
        status: row.status,
        studentName: row.studentName || "Student",
        tutorName: row.tutorName || "Unassigned",
        subjectName: row.subjectName || "Subject pending",
        scheduleLabel,
        seatsClaimed: row.seatsClaimed,
        confirmedAt: row.confirmedAt?.toISOString() ?? null,
        holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
        cancellationReason: row.cancellationReason,
        attendanceStatus: row.attendanceStatus,
        attendanceNotes: row.attendanceNotes,
        attendanceRecordedAt: row.attendanceRecordedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[staff/families/booking] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load booking." }, { status: 500 });
  }
}
