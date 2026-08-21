import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseOfferings } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  active?: boolean;
  name?: string;
  code?: string;
  description?: string | null;
  termLabel?: string | null;
  scheduleSummary?: string | null;
  capacity?: number;
  instructorName?: string | null;
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
    const database = requireDb();
    const [existing] = await database
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(eq(courseOfferings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Course not found." }, { status: 404 });
    }

    const patch: {
      active?: boolean;
      name?: string;
      code?: string;
      description?: string | null;
      termLabel?: string | null;
      scheduleSummary?: string | null;
      capacity?: number;
      instructorName?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (typeof body.active === "boolean") patch.active = body.active;
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ ok: false, error: "Name cannot be empty." }, { status: 400 });
      }
      patch.name = name;
    }
    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ ok: false, error: "Code cannot be empty." }, { status: 400 });
      }
      patch.code = code;
    }
    if (body.description !== undefined) {
      patch.description = body.description == null ? null : String(body.description).trim() || null;
    }
    if (body.termLabel !== undefined) {
      patch.termLabel = body.termLabel == null ? null : String(body.termLabel).trim() || null;
    }
    if (body.scheduleSummary !== undefined) {
      patch.scheduleSummary =
        body.scheduleSummary == null ? null : String(body.scheduleSummary).trim() || null;
    }
    if (body.capacity !== undefined) {
      if (typeof body.capacity !== "number" || !Number.isFinite(body.capacity) || body.capacity < 1) {
        return NextResponse.json({ ok: false, error: "Capacity must be a positive number." }, { status: 400 });
      }
      patch.capacity = Math.floor(body.capacity);
    }
    if (body.instructorName !== undefined) {
      patch.instructorName =
        body.instructorName == null ? null : String(body.instructorName).trim() || null;
    }

    if (Object.keys(patch).length === 1) {
      return NextResponse.json(
        { ok: false, error: "Body must include at least one editable field." },
        { status: 400 },
      );
    }

    const [course] = await database
      .update(courseOfferings)
      .set(patch)
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
        instructorName: courseOfferings.instructorName,
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
        instructorName: course.instructorName ?? null,
      },
    });
  } catch (error) {
    console.warn("[staff/courses/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update course." }, { status: 500 });
  }
}
