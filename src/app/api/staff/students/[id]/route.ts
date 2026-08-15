import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, courseEnrollments, households, students, tutors } from "@/lib/db/schema";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);

type PatchBody = {
  supportNotesRestricted?: string | null;
  lifecycle?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string | null;
  schoolName?: string | null;
  graduationYear?: number | null;
  gradeLabel?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  birthdate?: string | null;
  learningNeeds?: string | null;
  availabilityNotes?: string | null;
  emergencyContact?: string | null;
};

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

async function loadStudentDetail(studentId: string) {
  const database = requireDb();
  const [joined] = await database
    .select({
      student: students,
      householdId: households.id,
      householdDisplayName: households.displayName,
    })
    .from(students)
    .leftJoin(households, eq(students.householdId, households.id))
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

  const [bookingCount] = await database
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.studentId, studentId));
  const [enrollmentCount] = await database
    .select({ value: count() })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.studentId, studentId));

  const canDelete =
    Number(bookingCount?.value ?? 0) === 0 && Number(enrollmentCount?.value ?? 0) === 0;

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
    canDelete,
    household: joined.householdId
      ? {
          id: joined.householdId,
          displayName: joined.householdDisplayName || "Family",
        }
      : null,
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(students).where(eq(students.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const updates: Partial<typeof students.$inferInsert> = { updatedAt: new Date() };

    if (body.firstName !== undefined) {
      const firstName = String(body.firstName).trim();
      if (!firstName) {
        return NextResponse.json({ ok: false, error: "First name is required." }, { status: 400 });
      }
      updates.firstName = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = String(body.lastName).trim();
      if (!lastName) {
        return NextResponse.json({ ok: false, error: "Last name is required." }, { status: 400 });
      }
      updates.lastName = lastName;
    }

    if (body.displayName !== undefined) {
      const displayName = String(body.displayName).trim();
      if (!displayName) {
        return NextResponse.json({ ok: false, error: "Preferred name is required." }, { status: 400 });
      }
      updates.displayName = displayName;
    }

    if (body.gender !== undefined) updates.gender = optionalText(body.gender);
    if (body.schoolName !== undefined) updates.schoolName = optionalText(body.schoolName);
    if (body.gradeLabel !== undefined) updates.gradeLabel = optionalText(body.gradeLabel);
    if (body.cellPhone !== undefined) updates.cellPhone = optionalText(body.cellPhone);
    if (body.email !== undefined) updates.email = optionalText(body.email)?.toLowerCase() ?? null;
    if (body.birthdate !== undefined) updates.birthdate = optionalText(body.birthdate);
    if (body.learningNeeds !== undefined) updates.learningNeeds = optionalText(body.learningNeeds);
    if (body.availabilityNotes !== undefined) updates.availabilityNotes = optionalText(body.availabilityNotes);
    if (body.emergencyContact !== undefined) updates.emergencyContact = optionalText(body.emergencyContact);

    if (body.graduationYear !== undefined) {
      if (body.graduationYear === null) {
        updates.graduationYear = null;
      } else {
        const year = Math.floor(Number(body.graduationYear));
        if (!Number.isFinite(year) || year < 1990 || year > 2100) {
          return NextResponse.json({ ok: false, error: "Enter a valid graduation year." }, { status: 400 });
        }
        updates.graduationYear = year;
      }
    }

    if (body.supportNotesRestricted !== undefined) {
      updates.supportNotesRestricted = optionalText(body.supportNotesRestricted);
    }

    if (body.lifecycle !== undefined) {
      const lifecycle = String(body.lifecycle).trim();
      if (!LIFECYCLES.has(lifecycle)) {
        return NextResponse.json({ ok: false, error: "Invalid lifecycle." }, { status: 400 });
      }
      updates.lifecycle = lifecycle as typeof students.$inferSelect.lifecycle;
    }

    await database.update(students).set(updates).where(eq(students.id, id));

    if (existing.householdId && (body.lastName !== undefined || body.displayName !== undefined)) {
      const { refreshHouseholdDisplayNameIfAuto } = await import("@/lib/staff/household-display-name");
      await refreshHouseholdDisplayNameIfAuto(existing.householdId);
    }

    const detail = await loadStudentDetail(id);
    return NextResponse.json({ ok: true, student: detail });
  } catch (error) {
    console.warn("[staff/students/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update student." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [existing] = await database.select({ id: students.id }).from(students).where(eq(students.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.studentId, id));
    const [enrollmentCount] = await database
      .select({ value: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.studentId, id));

    if (Number(bookingCount?.value ?? 0) > 0 || Number(enrollmentCount?.value ?? 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Delete is only allowed when the student has no bookings or enrollments. Archive instead.",
        },
        { status: 400 },
      );
    }

    await database.delete(students).where(eq(students.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/students/id] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete student." }, { status: 500 });
  }
}
