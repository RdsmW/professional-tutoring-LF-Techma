import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseOfferings } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  active?: boolean;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Course id required." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Body must include active: boolean." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const [existing] = await database
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    }

    const [course] = await database
      .update(courseOfferings)
      .set({ active: body.active, updatedAt: new Date() })
      .where(eq(courseOfferings.id, id))
      .returning({
        id: courseOfferings.id,
        code: courseOfferings.code,
        name: courseOfferings.name,
        termLabel: courseOfferings.termLabel,
        scheduleSummary: courseOfferings.scheduleSummary,
        capacity: courseOfferings.capacity,
        enrolledCount: courseOfferings.enrolledCount,
        active: courseOfferings.active,
        description: courseOfferings.description,
      });

    return NextResponse.json({
      ok: true,
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
        termLabel: course.termLabel,
        scheduleSummary: course.scheduleSummary,
        capacity: course.capacity,
        enrolledCount: course.enrolledCount,
        active: course.active,
        description: course.description,
      },
    });
  } catch (error) {
    console.warn("[staff/courses/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update course." }, { status: 500 });
  }
}
