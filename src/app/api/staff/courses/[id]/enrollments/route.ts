import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, households, students } from "@/lib/db/schema";
import {
  isActiveEnrollmentStatus,
  isEnrollmentStatus,
  type EnrollmentStatus,
} from "@/lib/enrollment/status";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type EnrollBody = {
  householdId?: string;
  studentId?: string;
  notes?: string | null;
  status?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id: courseId } = await context.params;
    if (!courseId) {
      return NextResponse.json({ ok: false, error: "Course id required." }, { status: 400 });
    }

    const body = (await request.json()) as EnrollBody;
    const householdId = (body.householdId ?? "").trim();
    const studentId = (body.studentId ?? "").trim();
    const notes = body.notes !== undefined ? (body.notes?.trim() || null) : null;
    const statusRaw = (body.status ?? "submitted").trim();

    if (!householdId || !studentId) {
      return NextResponse.json(
        { ok: false, error: "householdId and studentId are required." },
        { status: 400 },
      );
    }

    if (!isEnrollmentStatus(statusRaw)) {
      return NextResponse.json({ ok: false, error: "Invalid enrollment status." }, { status: 400 });
    }
    const status = statusRaw as EnrollmentStatus;

    const database = requireDb();
    const [course] = await database
      .select()
      .from(courseOfferings)
      .where(eq(courseOfferings.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    }

    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    if (!household) {
      return NextResponse.json({ ok: false, error: "Household not found." }, { status: 404 });
    }

    const [student] = await database
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.householdId, householdId)))
      .limit(1);

    if (!student) {
      return NextResponse.json(
        { ok: false, error: "Student not found in this household." },
        { status: 404 },
      );
    }

    const countsTowardCapacity = isActiveEnrollmentStatus(status);
    if (countsTowardCapacity && course.enrolledCount >= course.capacity) {
      return NextResponse.json(
        { ok: false, error: "This course cohort is at capacity." },
        { status: 409 },
      );
    }

    const now = new Date();
    const [enrollment] = await database
      .insert(courseEnrollments)
      .values({
        courseOfferingId: courseId,
        householdId,
        studentId,
        status,
        notes,
        updatedAt: now,
      })
      .returning();

    if (countsTowardCapacity) {
      await database
        .update(courseOfferings)
        .set({
          enrolledCount: sql`${courseOfferings.enrolledCount} + 1`,
          updatedAt: now,
        })
        .where(eq(courseOfferings.id, courseId));
    }

    const [updatedCourse] = await database
      .select({
        id: courseOfferings.id,
        capacity: courseOfferings.capacity,
        enrolledCount: courseOfferings.enrolledCount,
      })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, courseId))
      .limit(1);

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        notes: enrollment.notes,
        studentId: enrollment.studentId,
        householdId: enrollment.householdId,
        studentName: student.displayName,
        createdAt: enrollment.createdAt.toISOString(),
      },
      course: updatedCourse
        ? {
            id: updatedCourse.id,
            capacity: updatedCourse.capacity,
            enrolledCount: updatedCourse.enrolledCount,
          }
        : null,
    });
  } catch (error) {
    console.warn("[staff/courses/enrollments] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create enrollment." }, { status: 500 });
  }
}
