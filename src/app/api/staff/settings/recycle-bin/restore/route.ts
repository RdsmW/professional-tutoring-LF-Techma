import { NextResponse } from "next/server";
import { restoreGuardianNote } from "@/lib/staff/guardians";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const body = (await request.json()) as { kind?: string; noteId?: string };
    const kind = (body.kind ?? "guardian_note").trim();
    const noteId = (body.noteId ?? "").trim();

    if (kind !== "guardian_note") {
      return NextResponse.json({ ok: false, error: "Unsupported recycle item." }, { status: 400 });
    }
    if (!noteId) {
      return NextResponse.json({ ok: false, error: "noteId is required." }, { status: 400 });
    }

    const restored = await restoreGuardianNote(noteId);
    if (!restored) {
      return NextResponse.json(
        { ok: false, error: "Note not found or retention window expired." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, noteId: restored.id, guardianId: restored.guardianId });
  } catch (error) {
    console.warn("[staff/settings/recycle-bin/restore] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to restore note." }, { status: 500 });
  }
}
