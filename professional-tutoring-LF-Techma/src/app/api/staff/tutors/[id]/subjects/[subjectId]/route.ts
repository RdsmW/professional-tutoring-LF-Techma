import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { tutorSubjects, tutors } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string; subjectId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id: tutorId, subjectId } = await context.params;
    if (!tutorId || !subjectId) {
      return NextResponse.json(
        { ok: false, error: "Tutor id and subject id are required." },
        { status: 400 },
      );
    }

    const database = requireDb();

    const [tutor] = await database.select({ id: tutors.id }).from(tutors).where(eq(tutors.id, tutorId)).limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const deleted = await database
      .delete(tutorSubjects)
      .where(and(eq(tutorSubjects.tutorId, tutorId), eq(tutorSubjects.subjectId, subjectId)))
      .returning({ id: tutorSubjects.id });

    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "Subject assignment not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      removed: {
        tutorId,
        subjectId,
        assignmentId: deleted[0].id,
      },
    });
  } catch (error) {
    console.warn("[staff/tutors/subjects] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to remove subject." }, { status: 500 });
  }
}
