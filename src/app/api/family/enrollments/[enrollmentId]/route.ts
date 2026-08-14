import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, students } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const { enrollmentId } = await contextParams.params;
    const database = requireDb();

    const [row] = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        requestedSlotPreference: courseEnrollments.requestedSlotPreference,
        referralSource: courseEnrollments.referralSource,
        notes: courseEnrollments.notes,
        createdAt: courseEnrollments.createdAt,
        updatedAt: courseEnrollments.updatedAt,
        studentName: students.displayName,
        courseName: courseOfferings.name,
        scheduleSummary: courseOfferings.scheduleSummary,
      })
      .from(courseEnrollments)
      .leftJoin(students, eq(courseEnrollments.studentId, students.id))
      .leftJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
      .where(
        and(eq(courseEnrollments.id, enrollmentId), eq(courseEnrollments.householdId, context.household.id)),
      )
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

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: row.id,
        status: row.status,
        studentName: row.studentName || "Student",
        courseName: row.courseName || "Course",
        scheduleLabel,
        requestedSlotPreference: row.requestedSlotPreference,
        referralSource: row.referralSource,
        notes: familyNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[family/enrollments] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load enrollment." }, { status: 500 });
  }
}
