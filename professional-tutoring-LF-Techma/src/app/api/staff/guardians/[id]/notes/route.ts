import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardianNotes, guardians } from "@/lib/db/schema";
import { serializeGuardianNote } from "@/lib/staff/guardians";
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
    const [guardian] = await database
      .select({ id: guardians.id })
      .from(guardians)
      .where(eq(guardians.id, id))
      .limit(1);
    if (!guardian) {
      return NextResponse.json({ ok: false, error: "Guardian not found." }, { status: 404 });
    }

    const [note] = await database
      .insert(guardianNotes)
      .values({
        guardianId: id,
        authorStaffId: context.staff.id,
        authorDisplayName: context.staff.fullName,
        body: text,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      note: serializeGuardianNote(note),
    });
  } catch (error) {
    console.warn("[staff/guardians/id/notes] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to add note." }, { status: 500 });
  }
}
