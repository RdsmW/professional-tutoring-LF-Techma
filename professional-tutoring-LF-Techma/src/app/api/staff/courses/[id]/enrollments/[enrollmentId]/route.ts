import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, households, students } from "@/lib/db/schema";
import {
  enrollmentCountDelta,
  isActiveEnrollmentStatus,
  isEnrollmentStatus,
  type EnrollmentStatus,
} from "@/lib/enrollment/status";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string; enrollmentId: string }> };

type PatchBody = {
  status?: string;
  notes?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id: courseId, enrollmentId } = await context.params;
    if (!courseId || !enrollmentId) {
      return NextResponse.json({ ok: false, error: "Course and enrollment ids required." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database
      .select()
      .from(courseEnrollments)
      .where(
        and(eq(courseEnrollments.id, enrollmentId), eq(courseEnrollments.courseOfferingId, courseId)),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Enrollment not found." }, { status: 404 });
    }

    const [course] = await database
      .select()
      .from(courseOfferings)
      .where(eq(courseOfferings.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    }

    const updates: Partial<typeof courseEnrollments.$inferInsert> = { updatedAt: new Date() };
    let nextStatus: EnrollmentStatus = existing.status;
    let changed = false;

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!isEnrollmentStatus(status)) {
        return NextResponse.json({ ok: false, error: "Invalid enrollment status." }, { status: 400 });
      }
      nextStatus = status;
      if (status !== existing.status) {
        const delta = enrollmentCountDelta(existing.status, status);
        if (delta > 0 && course.enrolledCount >= course.capacity) {
          return NextResponse.json(
            { ok: false, error: "This course cohort is at capacity." },
            { status: 409 },
          );
        }
        updates.status = status;
        changed = true;
      }
    }

    if (body.notes !== undefined) {
      const notes = body.notes?.trim() || null;
      if (notes !== existing.notes) {
        updates.notes = notes;
        changed = true;
      }
    }

    if (changed) {
      await database.update(courseEnrollments).set(updates).where(eq(courseEnrollments.id, enrollmentId));

      const delta = enrollmentCountDelta(existing.status, nextStatus);
      if (delta !== 0) {
        await database
          .update(courseOfferings)
          .set({
            enrolledCount:
              delta > 0
                ? sql`${courseOfferings.enrolledCount} + 1`
                : sql`GREATEST(${courseOfferings.enrolledCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(courseOfferings.id, courseId));
      }
    }

    const [row] = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        notes: courseEnrollments.notes,
        createdAt: courseEnrollments.createdAt,
        studentId: courseEnrollments.studentId,
        householdId: courseEnrollments.householdId,
        studentName: students.displayName,
        householdName: households.displayName,
      })
      .from(courseEnrollments)
      .innerJoin(students, eq(courseEnrollments.studentId, students.id))
      .innerJoin(households, eq(courseEnrollments.householdId, households.id))
      .where(eq(courseEnrollments.id, enrollmentId))
      .limit(1);

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
      enrollment: row
        ? {
            id: row.id,
            status: row.status,
            notes: row.notes,
            createdAt: row.createdAt.toISOString(),
            studentId: row.studentId,
            householdId: row.householdId,
            studentName: row.studentName,
            householdName: row.householdName,
            active: isActiveEnrollmentStatus(row.status),
          }
        : null,
      course: updatedCourse
        ? {
            id: updatedCourse.id,
            capacity: updatedCourse.capacity,
            enrolledCount: updatedCourse.enrolledCount,
          }
        : null,
    });
  } catch (error) {
    console.warn("[staff/courses/enrollments/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update enrollment." }, { status: 500 });
  }
}
