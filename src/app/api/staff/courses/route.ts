import { NextResponse } from "next/server";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings } from "@/lib/db/schema";
import { ACTIVE_ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    // Default: all offerings with active status. Pass includeInactive=0 for active-only.
    const includeInactive = searchParams.get("includeInactive") !== "0";

    const database = requireDb();
    const rows = includeInactive
      ? await database.select().from(courseOfferings).orderBy(asc(courseOfferings.name))
      : await database
          .select()
          .from(courseOfferings)
          .where(eq(courseOfferings.active, true))
          .orderBy(asc(courseOfferings.name));

    const ids = rows.map((row) => row.id);
    const countMap = new Map<string, number>();
    if (ids.length > 0) {
      const counts = await database
        .select({
          courseOfferingId: courseEnrollments.courseOfferingId,
          liveCount: count(courseEnrollments.id),
        })
        .from(courseEnrollments)
        .where(
          and(
            inArray(courseEnrollments.courseOfferingId, ids),
            inArray(courseEnrollments.status, [...ACTIVE_ENROLLMENT_STATUSES]),
          ),
        )
        .groupBy(courseEnrollments.courseOfferingId);
      for (const row of counts) {
        countMap.set(row.courseOfferingId, Number(row.liveCount));
      }
    }

    return NextResponse.json({
      ok: true,
      courses: rows.map((row) => {
        const live = countMap.get(row.id);
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          termLabel: row.termLabel,
          scheduleSummary: row.scheduleSummary,
          capacity: row.capacity,
          enrolledCount: live ?? row.enrolledCount,
          active: row.active,
          description: row.description,
          instructorName: row.instructorName ?? null,
        };
      }),
    });
  } catch (error) {
    console.warn("[staff/courses] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load courses." }, { status: 500 });
  }
}

type PostBody = {
  code?: string;
  name?: string;
  description?: string | null;
  termLabel?: string | null;
  scheduleSummary?: string | null;
  capacity?: number;
  active?: boolean;
  instructorName?: string | null;
};

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as PostBody;
    const name = (body.name ?? "").trim();
    const code = (body.code ?? "").trim().toUpperCase();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ ok: false, error: "Code is required." }, { status: 400 });
    }

    const capacity =
      typeof body.capacity === "number" && Number.isFinite(body.capacity) && body.capacity > 0
        ? Math.floor(body.capacity)
        : 20;

    const database = requireDb();
    const [course] = await database
      .insert(courseOfferings)
      .values({
        code,
        name,
        description: body.description == null ? null : String(body.description).trim() || null,
        termLabel: body.termLabel == null ? null : String(body.termLabel).trim() || null,
        scheduleSummary:
          body.scheduleSummary == null ? null : String(body.scheduleSummary).trim() || null,
        instructorName:
          body.instructorName == null ? null : String(body.instructorName).trim() || null,
        capacity,
        active: body.active !== false,
      })
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
    console.warn("[staff/courses] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create course." }, { status: 500 });
  }
}
