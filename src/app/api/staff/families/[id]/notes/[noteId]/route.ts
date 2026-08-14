import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { householdNotes, households } from "@/lib/db/schema";
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

    const [note] = await database
      .update(householdNotes)
      .set({ body: text })
      .where(and(eq(householdNotes.id, noteId), eq(householdNotes.householdId, id)))
      .returning();

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      note: {
        id: note.id,
        body: note.body,
        authorDisplayName: note.authorDisplayName,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[staff/families/id/notes/noteId] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update note." }, { status: 500 });
  }
}
