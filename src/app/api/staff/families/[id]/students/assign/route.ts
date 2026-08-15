import { NextResponse } from "next/server";
import { eq, isNull, ne, or } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, students } from "@/lib/db/schema";
import { refreshHouseholdDisplayNameIfAuto } from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

/** Assign an existing student (orphan or other household) to this family. */
export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId } = await contextParams.params;
    const body = (await request.json()) as { studentId?: string };
    const studentId = (body.studentId ?? "").trim();
    if (!studentId) {
      return NextResponse.json({ ok: false, error: "studentId is required." }, { status: 400 });
    }

    const database = requireDb();
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const [student] = await database.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }
    if (student.householdId === householdId) {
      return NextResponse.json({ ok: false, error: "Student is already on this family." }, { status: 400 });
    }

    const previousHouseholdId = student.householdId;

    await database
      .update(students)
      .set({ householdId, updatedAt: new Date() })
      .where(eq(students.id, studentId));

    // Historical bookings/enrollments keep their original householdId.
    if (previousHouseholdId) {
      await refreshHouseholdDisplayNameIfAuto(previousHouseholdId);
    }
    await refreshHouseholdDisplayNameIfAuto(householdId);

    return NextResponse.json({ ok: true, studentId });
  } catch (error) {
    console.warn("[staff/families/students/assign] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to assign student." }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId } = await contextParams.params;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();

    const database = requireDb();
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const rows = await database
      .select({
        id: students.id,
        displayName: students.displayName,
        gradeLabel: students.gradeLabel,
        lifecycle: students.lifecycle,
        householdId: students.householdId,
        householdDisplayName: households.displayName,
      })
      .from(students)
      .leftJoin(households, eq(students.householdId, households.id))
      .where(or(isNull(students.householdId), ne(students.householdId, householdId))!)
      .limit(80);

    const filtered = q
      ? rows.filter((row) => {
          const hay = `${row.displayName} ${row.gradeLabel ?? ""} ${row.householdDisplayName ?? ""}`.toLowerCase();
          return hay.includes(q);
        })
      : rows;

    return NextResponse.json({
      ok: true,
      students: filtered.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        gradeLabel: row.gradeLabel,
        lifecycle: row.lifecycle,
        householdId: row.householdId,
        householdDisplayName: row.householdDisplayName || "Unassigned",
      })),
    });
  } catch (error) {
    console.warn("[staff/families/students/assign] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load students." }, { status: 500 });
  }
}
