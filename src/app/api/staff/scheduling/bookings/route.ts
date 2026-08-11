import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  students,
  subjects,
  tutoringRequests,
  tutors,
} from "@/lib/db/schema";
import { catalogSubjectToDbCode } from "@/lib/booking/subject-map";
import { getStaffContext } from "@/lib/staff/session";

type CreateBookingBody = {
  householdId?: string;
  studentId?: string;
  tutorId?: string;
  slotId?: string;
  subjectId?: string;
  subjectCode?: string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as CreateBookingBody;
    const householdId = (body.householdId ?? "").trim();
    const studentId = (body.studentId ?? "").trim();
    const tutorId = (body.tutorId ?? "").trim();
    const slotId = (body.slotId ?? "").trim();
    const subjectId = (body.subjectId ?? "").trim();
    const subjectCode = (body.subjectCode ?? "").trim();
    const notes = (body.notes ?? "").trim();

    if (!householdId || !studentId || !tutorId || !slotId || (!subjectId && !subjectCode)) {
      return NextResponse.json(
        { ok: false, error: "householdId, studentId, tutorId, slotId, and subjectId or subjectCode are required." },
        { status: 400 },
      );
    }

    const database = requireDb();

    const [studentRow] = await database
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
      .limit(1);

    if (!studentRow) {
      return NextResponse.json(
        { ok: false, error: "Student not found in this household." },
        { status: 404 },
      );
    }

    let subject:
      | {
          id: string;
          code: string;
          name: string;
        }
      | undefined;

    if (subjectId) {
      const [byId] = await database
        .select({
          id: subjects.id,
          code: subjects.code,
          name: subjects.name,
        })
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.active, true)))
        .limit(1);
      subject = byId;
    } else {
      const dbCode = catalogSubjectToDbCode(subjectCode);
      const [byCode] = await database
        .select({
          id: subjects.id,
          code: subjects.code,
          name: subjects.name,
        })
        .from(subjects)
        .where(and(eq(subjects.code, dbCode), eq(subjects.active, true)))
        .limit(1);
      subject = byCode;
    }

    if (!subject) {
      return NextResponse.json({ ok: false, error: "Subject not found." }, { status: 400 });
    }

    const [tutorRow] = await database
      .select({
        id: tutors.id,
        displayName: tutors.displayName,
      })
      .from(tutors)
      .where(and(eq(tutors.id, tutorId), eq(tutors.active, true)))
      .limit(1);

    if (!tutorRow) {
      return NextResponse.json({ ok: false, error: "Tutor not found or inactive." }, { status: 400 });
    }

    const [slot] = await database
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.tutorId, tutorId),
          eq(availabilitySlots.active, true),
          sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
        ),
      )
      .limit(1);

    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "Selected slot is unavailable or over capacity." },
        { status: 409 },
      );
    }

    const now = new Date();

    const [requestRow] = await database
      .insert(tutoringRequests)
      .values({
        householdId,
        studentId,
        subjectId: subject.id,
        status: "confirmed",
        preferredSlotId: slotId,
        scheduleNotes: notes || null,
        payload: {
          createdByStaffId: context.staff.id,
          source: "staff_scheduling",
        },
        updatedAt: now,
      })
      .returning();

    const [booking] = await database
      .insert(bookings)
      .values({
        tutoringRequestId: requestRow.id,
        householdId,
        studentId,
        subjectId: subject.id,
        tutorId,
        slotId,
        status: "confirmed",
        seatsClaimed: 1,
        confirmedByStaffId: context.staff.id,
        confirmedAt: now,
        updatedAt: now,
      })
      .returning();

    await database
      .update(availabilitySlots)
      .set({
        bookedSeats: sql`${availabilitySlots.bookedSeats} + 1`,
        updatedAt: now,
      })
      .where(eq(availabilitySlots.id, slotId));

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        studentName: studentRow.displayName,
        tutorName: tutorRow.displayName,
        subjectName: subject.name,
        slotId,
        confirmedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[staff/scheduling/bookings] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create booking." }, { status: 500 });
  }
}
