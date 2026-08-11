import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  households,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        householdId: bookings.householdId,
        studentId: bookings.studentId,
        tutorId: bookings.tutorId,
        createdAt: bookings.createdAt,
        studentName: students.displayName,
        householdName: households.displayName,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
        slotStart: availabilitySlots.startTimeLocal,
        slotEnd: availabilitySlots.endTimeLocal,
        dayOfWeek: availabilitySlots.dayOfWeek,
        slotLabel: availabilitySlots.label,
      })
      .from(bookings)
      .innerJoin(students, eq(bookings.studentId, students.id))
      .innerJoin(households, eq(bookings.householdId, households.id))
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .orderBy(desc(bookings.createdAt))
      .limit(120);

    return NextResponse.json({
      ok: true,
      bookings: rows.map((row) => ({
        id: row.id,
        status: row.status,
        studentName: row.studentName,
        tutorName: row.tutorName,
        householdName: row.householdName,
        subjectName: row.subjectName,
        slotStart: row.slotStart,
        slotEnd: row.slotEnd,
        dayOfWeek: row.dayOfWeek,
        slotLabel: row.slotLabel,
        createdAt: row.createdAt.toISOString(),
        householdId: row.householdId,
        studentId: row.studentId,
        tutorId: row.tutorId,
      })),
    });
  } catch (error) {
    console.warn("[staff/scheduling] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load scheduling." }, { status: 500 });
  }
}
