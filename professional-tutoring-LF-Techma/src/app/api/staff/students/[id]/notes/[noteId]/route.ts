import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { studentNotes, students } from "@/lib/db/schema";
import { serializeStudentNote, softDeleteStudentNote } from "@/lib/staff/students";
import { getStaffContext } from "@/lib/staff/session";

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id, noteId } = await contextParams.params;
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

    const now = new Date();
    const [note] = await database
      .update(studentNotes)
      .set({
        body: text,
        editorStaffId: context.staff.id,
        editorDisplayName: context.staff.fullName,
        updatedAt: now,
      })
      .where(
        and(eq(studentNotes.id, noteId), eq(studentNotes.studentId, id), isNull(studentNotes.deletedAt)),
      )
      .returning();

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      note: serializeStudentNote(note),
    });
  } catch (error) {
    console.warn("[staff/students/id/notes/noteId] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update note." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  contextParams: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id, noteId } = await contextParams.params;
    const note = await softDeleteStudentNote({
      studentId: id,
      noteId,
      staffId: context.staff.id,
    });

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, note });
  } catch (error) {
    console.warn("[staff/students/id/notes/noteId] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete note." }, { status: 500 });
  }
}
