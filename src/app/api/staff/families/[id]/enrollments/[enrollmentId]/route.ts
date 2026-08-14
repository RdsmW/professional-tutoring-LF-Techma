import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, guardians, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string; enrollmentId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id, enrollmentId } = await contextParams.params;
    const database = requireDb();

    const [row] = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        householdId: courseEnrollments.householdId,
        studentId: courseEnrollments.studentId,
        requestedByGuardianId: courseEnrollments.requestedByGuardianId,
        requestedSlotPreference: courseEnrollments.requestedSlotPreference,
        referralSource: courseEnrollments.referralSource,
        notes: courseEnrollments.notes,
        createdAt: courseEnrollments.createdAt,
        updatedAt: courseEnrollments.updatedAt,
        studentName: students.displayName,
        courseName: courseOfferings.name,
        scheduleSummary: courseOfferings.scheduleSummary,
        courseActive: courseOfferings.active,
        guardianFirstName: guardians.firstName,
        guardianLastName: guardians.lastName,
      })
      .from(courseEnrollments)
      .leftJoin(students, eq(courseEnrollments.studentId, students.id))
      .leftJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
      .leftJoin(guardians, eq(courseEnrollments.requestedByGuardianId, guardians.id))
      .where(and(eq(courseEnrollments.id, enrollmentId), eq(courseEnrollments.householdId, id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Enrollment not found." }, { status: 404 });
    }

    let scheduleLabel = row.scheduleSummary || row.requestedSlotPreference || null;
    let familyNotes: string | null = row.notes;
    if (row.notes) {
      try {
        const parsed = JSON.parse(row.notes) as { scheduleLabel?: string; notes?: string };
        if (parsed.scheduleLabel) scheduleLabel = parsed.scheduleLabel;
        if (typeof parsed.notes === "string") familyNotes = parsed.notes;
      } catch {
        // keep raw notes
      }
    }

    const requestedBy =
      row.guardianFirstName || row.guardianLastName
        ? `${row.guardianFirstName ?? ""} ${row.guardianLastName ?? ""}`.trim()
        : null;

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: row.id,
        status: row.status,
        studentName: row.studentName || "Student",
        courseName: row.courseName || "Course",
        courseActive: row.courseActive,
        scheduleLabel,
        requestedSlotPreference: row.requestedSlotPreference,
        referralSource: row.referralSource,
        notes: familyNotes,
        requestedBy,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[staff/families/enrollment] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load enrollment." }, { status: 500 });
  }
}
