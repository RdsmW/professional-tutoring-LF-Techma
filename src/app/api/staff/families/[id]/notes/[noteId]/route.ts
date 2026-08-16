import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { householdNotes, households } from "@/lib/db/schema";
import { serializeHouseholdNote, softDeleteHouseholdNote } from "@/lib/staff/families";
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
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, id))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const now = new Date();
    const [note] = await database
      .update(householdNotes)
      .set({
        body: text,
        editorStaffId: context.staff.id,
        editorDisplayName: context.staff.fullName,
        updatedAt: now,
      })
      .where(
        and(
          eq(householdNotes.id, noteId),
          eq(householdNotes.householdId, id),
          isNull(householdNotes.deletedAt),
        ),
      )
      .returning();

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      note: serializeHouseholdNote(note),
    });
  } catch (error) {
    console.warn("[staff/families/id/notes/noteId] PATCH soft-fail", error);
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
    const note = await softDeleteHouseholdNote({
      householdId: id,
      noteId,
      staffId: context.staff.id,
    });

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, note });
  } catch (error) {
    console.warn("[staff/families/id/notes/noteId] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete note." }, { status: 500 });
  }
}
