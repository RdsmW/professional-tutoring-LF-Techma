import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { subjects, tutorSubjects, tutors } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type AssignBody = {
  subjectId?: string;
  priority?: number;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id: tutorId } = await context.params;
    if (!tutorId) {
      return NextResponse.json({ ok: false, error: "Tutor id required." }, { status: 400 });
    }

    const body = (await request.json()) as AssignBody;
    const subjectId = (body.subjectId ?? "").trim();
    if (!subjectId) {
      return NextResponse.json({ ok: false, error: "subjectId is required." }, { status: 400 });
    }

    let priority = 0;
    if (body.priority !== undefined) {
      const parsed = Math.floor(Number(body.priority));
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ ok: false, error: "priority must be a number." }, { status: 400 });
      }
      priority = parsed;
    }

    const database = requireDb();

    const [tutor] = await database.select({ id: tutors.id }).from(tutors).where(eq(tutors.id, tutorId)).limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const [subject] = await database
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
      })
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.active, true)))
      .limit(1);

    if (!subject) {
      return NextResponse.json({ ok: false, error: "Subject not found." }, { status: 404 });
    }

    const [existing] = await database
      .select({ id: tutorSubjects.id })
      .from(tutorSubjects)
      .where(and(eq(tutorSubjects.tutorId, tutorId), eq(tutorSubjects.subjectId, subjectId)))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Subject already assigned to this tutor." },
        { status: 409 },
      );
    }

    const [row] = await database
      .insert(tutorSubjects)
      .values({
        tutorId,
        subjectId,
        priority,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      assignment: {
        id: row.id,
        tutorId: row.tutorId,
        subjectId: row.subjectId,
        priority: row.priority,
        subject: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
        },
      },
    });
  } catch (error) {
    console.warn("[staff/tutors/subjects] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to assign subject." }, { status: 500 });
  }
}
