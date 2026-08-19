import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  households,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const householdId = (searchParams.get("householdId") || "").trim();
    const tutorId = (searchParams.get("tutorId") || "").trim();

    const database = requireDb();

    const householdRows = await database
      .select({
        id: households.id,
        displayName: households.displayName,
      })
      .from(households)
      .orderBy(asc(households.displayName));

    const tutorRows = await database
      .select({
        id: tutors.id,
        displayName: tutors.displayName,
      })
      .from(tutors)
      .where(eq(tutors.active, true))
      .orderBy(asc(tutors.displayName));

    const subjectRows = await database
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
      })
      .from(subjects)
      .where(eq(subjects.active, true))
      .orderBy(asc(subjects.name));

    let studentRows: Array<{
      id: string;
      displayName: string;
      gradeLabel: string | null;
      schoolName: string | null;
    }> = [];

    if (householdId) {
      studentRows = await database
        .select({
          id: students.id,
          displayName: students.displayName,
          gradeLabel: students.gradeLabel,
          schoolName: students.schoolName,
        })
        .from(students)
        .where(eq(students.householdId, householdId))
        .orderBy(asc(students.displayName));
    }

    let slots: Array<{
      id: string;
      dayOfWeek: number;
      startTimeLocal: string;
      endTimeLocal: string;
      label: string | null;
      capacitySeats: number;
      heldSeats: number;
      bookedSeats: number;
    }> = [];

    if (tutorId) {
      const slotRows = await database
        .select({
          id: availabilitySlots.id,
          dayOfWeek: availabilitySlots.dayOfWeek,
          startTimeLocal: availabilitySlots.startTimeLocal,
          endTimeLocal: availabilitySlots.endTimeLocal,
          label: availabilitySlots.label,
          capacitySeats: availabilitySlots.capacitySeats,
          heldSeats: availabilitySlots.heldSeats,
          bookedSeats: availabilitySlots.bookedSeats,
        })
        .from(availabilitySlots)
        .where(and(eq(availabilitySlots.tutorId, tutorId), eq(availabilitySlots.active, true)))
        .orderBy(asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTimeLocal));

      slots = slotRows;
    }

    return NextResponse.json({
      ok: true,
      households: householdRows,
      students: studentRows,
      tutors: tutorRows,
      subjects: subjectRows,
      slots,
    });
  } catch (error) {
    console.warn("[staff/scheduling/options] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load scheduling options." }, { status: 500 });
  }
}
