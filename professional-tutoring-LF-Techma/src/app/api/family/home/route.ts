import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { refreshCardOnFile } from "@/lib/billing/refresh-card-on-file";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  courseEnrollments,
  courseOfferings,
  subjects,
  tutors,
} from "@/lib/db/schema";

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const card = await refreshCardOnFile(context.household.id);
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

    const enrollmentRows = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        studentId: courseEnrollments.studentId,
        createdAt: courseEnrollments.createdAt,
        courseName: courseOfferings.name,
        scheduleSummary: courseOfferings.scheduleSummary,
        requestedSlotPreference: courseEnrollments.requestedSlotPreference,
        notes: courseEnrollments.notes,
      })
      .from(courseEnrollments)
      .leftJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
      .where(eq(courseEnrollments.householdId, context.household.id))
      .orderBy(desc(courseEnrollments.createdAt))
      .limit(5);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return NextResponse.json({
      ok: true,
      household: {
        displayName: context.household.displayName,
        status: context.household.status,
        cardLast4: card.cardLast4,
        cardBrand: card.cardBrand,
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
      enrollments: enrollmentRows.map((row) => {
        const student = studentRows.find((item) => item.id === row.studentId);
        let scheduleLabel = row.scheduleSummary || "Schedule pending";
        if (row.notes) {
          try {
            const parsed = JSON.parse(row.notes) as { scheduleLabel?: string };
            if (parsed.scheduleLabel) scheduleLabel = parsed.scheduleLabel;
          } catch {
            // keep schedule summary
          }
        }
        return {
          id: row.id,
          status: row.status,
          studentName: student?.displayName ?? "Student",
          courseName: row.courseName ?? "Course",
          scheduleLabel,
        };
      }),
    });
  } catch (error) {
    console.warn("[family/home] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load family home" }, { status: 500 });
  }
}
