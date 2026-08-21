import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { studentNotes, students } from "@/lib/db/schema";
import { serializeStudentNote } from "@/lib/staff/students";
import { getStaffContext } from "@/lib/staff/session";

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as { body?: string };
    const text = (body.body ?? "").trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "Note body is required." }, { status: 400 });
    }

    const database = requireDb();
    const [student] = await database
      .select({ id: students.id })
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    if (!student) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const [note] = await database
      .insert(studentNotes)
      .values({
        studentId: id,
        authorStaffId: context.staff.id,
        authorDisplayName: context.staff.fullName,
        body: text,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      note: serializeStudentNote(note),
    });
  } catch (error) {
    console.warn("[staff/students/id/notes] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to add note." }, { status: 500 });
  }
}
