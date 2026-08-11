import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, households, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Course id required." }, { status: 400 });
    }

    const database = requireDb();
    const [course] = await database
      .select({
        id: courseOfferings.id,
        code: courseOfferings.code,
        name: courseOfferings.name,
        termLabel: courseOfferings.termLabel,
        scheduleSummary: courseOfferings.scheduleSummary,
        capacity: courseOfferings.capacity,
        enrolledCount: courseOfferings.enrolledCount,
        active: courseOfferings.active,
      })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, id))
      .limit(1);

    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    }

    const rows = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        createdAt: courseEnrollments.createdAt,
        studentId: courseEnrollments.studentId,
        householdId: courseEnrollments.householdId,
        studentName: students.displayName,
        householdName: households.displayName,
      })
      .from(courseEnrollments)
      .innerJoin(students, eq(courseEnrollments.studentId, students.id))
      .innerJoin(households, eq(courseEnrollments.householdId, households.id))
      .where(eq(courseEnrollments.courseOfferingId, id))
      .orderBy(desc(courseEnrollments.createdAt));

    return NextResponse.json({
      ok: true,
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        termLabel: course.termLabel,
        scheduleSummary: course.scheduleSummary,
        capacity: course.capacity,
        enrolledCount: rows.length || course.enrolledCount,
        active: course.active,
      },
      roster: rows.map((row) => ({
        id: row.id,
        studentName: row.studentName,
        householdName: row.householdName,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        studentId: row.studentId,
        householdId: row.householdId,
      })),
    });
  } catch (error) {
    console.warn("[staff/courses/roster] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load course roster." }, { status: 500 });
  }
}
