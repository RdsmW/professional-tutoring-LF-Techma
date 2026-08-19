import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { refreshHouseholdDisplayNameIfAuto } from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

/**
 * Unassign student from this family (orphan: householdId = null).
 * Bookings/enrollments keep their historical householdId; student can be reassigned later.
 */
export async function POST(
  _request: Request,
  contextParams: { params: Promise<{ id: string; studentId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId, studentId } = await contextParams.params;
    const database = requireDb();

    const [existing] = await database
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found on this family." }, { status: 404 });
    }

    await database
      .update(students)
      .set({ householdId: null, updatedAt: new Date() })
      .where(eq(students.id, studentId));

    await refreshHouseholdDisplayNameIfAuto(householdId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/families/students/unassign] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to unassign student." }, { status: 500 });
  }
}
