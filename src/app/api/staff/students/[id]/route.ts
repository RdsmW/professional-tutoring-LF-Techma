import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, households, students, tutors } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);

type PatchBody = {
  supportNotesRestricted?: string | null;
  lifecycle?: string;
};

async function loadStudentDetail(studentId: string) {
  const database = requireDb();
  const [joined] = await database
    .select({
      student: students,
      householdId: households.id,
      householdDisplayName: households.displayName,
    })
    .from(students)
    .innerJoin(households, eq(students.householdId, households.id))
    .where(eq(students.id, studentId))
    .limit(1);

  if (!joined) return null;

  const bookingRows = await database
    .select({
      id: bookings.id,
      status: bookings.status,
      createdAt: bookings.createdAt,
      tutorId: bookings.tutorId,
      tutorDisplayName: tutors.displayName,
    })
    .from(bookings)
    .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
    .where(eq(bookings.studentId, studentId))
    .orderBy(desc(bookings.createdAt))
    .limit(12);

  const s = joined.student;
  return {
    id: s.id,
    displayName: s.displayName,
    firstName: s.firstName,
    lastName: s.lastName,
    gender: s.gender,
    schoolName: s.schoolName,
    graduationYear: s.graduationYear,
    gradeLabel: s.gradeLabel,
    lifecycle: s.lifecycle,
    cellPhone: s.cellPhone,
    email: s.email,
    birthdate: s.birthdate,
    learningNeeds: s.learningNeeds,
    supportNotesRestricted: s.supportNotesRestricted,
    availabilityNotes: s.availabilityNotes,
    emergencyContact: s.emergencyContact,
    changeRequestStatus: s.changeRequestStatus,
    pendingIntakeNote: s.pendingIntakeNote,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    household: {
      id: joined.householdId,
      displayName: joined.householdDisplayName,
    },
    bookings: bookingRows.map((b) => ({
      id: b.id,
      status: b.status,
      tutorName: b.tutorDisplayName ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const detail = await loadStudentDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, student: detail });
  } catch (error) {
    console.warn("[staff/students/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load student." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(students).where(eq(students.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const updates: Partial<typeof students.$inferInsert> = { updatedAt: new Date() };

    if (body.supportNotesRestricted !== undefined) {
      const notes =
        body.supportNotesRestricted === null ? null : String(body.supportNotesRestricted).trim() || null;
      updates.supportNotesRestricted = notes;
    }

    if (body.lifecycle !== undefined) {
      const lifecycle = String(body.lifecycle).trim();
      if (!LIFECYCLES.has(lifecycle)) {
        return NextResponse.json({ ok: false, error: "Invalid lifecycle." }, { status: 400 });
      }
      updates.lifecycle = lifecycle as typeof students.$inferSelect.lifecycle;
    }

    await database.update(students).set(updates).where(eq(students.id, id));

    const detail = await loadStudentDetail(id);
    return NextResponse.json({ ok: true, student: detail });
  } catch (error) {
    console.warn("[staff/students/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update student." }, { status: 500 });
  }
}
