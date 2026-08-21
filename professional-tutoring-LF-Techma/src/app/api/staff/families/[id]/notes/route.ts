import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { householdNotes, households } from "@/lib/db/schema";
import { serializeHouseholdNote } from "@/lib/staff/families";
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
    const [household] = await database.select({ id: households.id }).from(households).where(eq(households.id, id)).limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const [note] = await database
      .insert(householdNotes)
      .values({
        householdId: id,
        authorStaffId: context.staff.id,
        authorDisplayName: context.staff.fullName,
        body: text,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      note: serializeHouseholdNote(note),
    });
  } catch (error) {
    console.warn("[staff/families/id/notes] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to add note." }, { status: 500 });
  }
}
