import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { availabilitySlots, bookings, subjects, tutors } from "@/lib/db/schema";

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const database = requireDb();
    const studentRows = await listHouseholdStudents(context.household.id);

    const bookingRows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        studentId: bookings.studentId,
        createdAt: bookings.createdAt,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
        slotLabel: availabilitySlots.label,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
        dayOfWeek: availabilitySlots.dayOfWeek,
      })
      .from(bookings)
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .where(eq(bookings.householdId, context.household.id))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return NextResponse.json({
      ok: true,
      household: {
        displayName: context.household.displayName,
        status: context.household.status,
        cardLast4: context.household.cardLast4,
        cardBrand: context.household.cardBrand,
      },
      students: studentRows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        schoolName: row.schoolName,
        gradeLabel: row.gradeLabel,
        learningNeeds: row.learningNeeds,
        lifecycle: row.lifecycle,
      })),
      bookings: bookingRows.map((row) => {
        const student = studentRows.find((item) => item.id === row.studentId);
        const day = row.dayOfWeek != null ? dayNames[row.dayOfWeek] ?? "" : "";
        const time =
          row.slotLabel ||
          [day, row.startTimeLocal && row.endTimeLocal ? `${row.startTimeLocal}–${row.endTimeLocal}` : null]
            .filter(Boolean)
            .join(" · ");
        return {
          id: row.id,
          status: row.status,
          studentName: student?.displayName ?? "Student",
          tutorName: row.tutorName,
          subjectName: row.subjectName,
          timeLabel: time || "Schedule pending",
        };
      }),
    });
  } catch (error) {
    console.warn("[family/home] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load family home" }, { status: 500 });
  }
}
