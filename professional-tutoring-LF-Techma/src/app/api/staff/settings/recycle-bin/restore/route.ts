import { NextResponse } from "next/server";
import { restoreHouseholdNote } from "@/lib/staff/families";
import { restoreGuardianNote } from "@/lib/staff/guardians";
import { restoreStudentNote } from "@/lib/staff/students";
import { restoreTutorNote } from "@/lib/staff/tutors";
import type { StaffRecycledNoteKind } from "@/lib/staff/staff-notes-recycle";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const body = (await request.json()) as { kind?: string; noteId?: string };
    const kind = (body.kind ?? "guardian_note").trim() as StaffRecycledNoteKind | string;
    const noteId = (body.noteId ?? "").trim();

    if (
      kind !== "guardian_note" &&
      kind !== "household_note" &&
      kind !== "student_note" &&
      kind !== "tutor_note"
    ) {
      return NextResponse.json({ ok: false, error: "Unsupported recycle item." }, { status: 400 });
    }
    if (!noteId) {
      return NextResponse.json({ ok: false, error: "noteId is required." }, { status: 400 });
    }

    if (kind === "guardian_note") {
      const restored = await restoreGuardianNote(noteId);
      if (!restored) {
        return NextResponse.json(
          { ok: false, error: "Note not found or retention window expired." },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, kind, noteId: restored.id, guardianId: restored.guardianId });
    }

    if (kind === "student_note") {
      const restored = await restoreStudentNote(noteId);
      if (!restored) {
        return NextResponse.json(
          { ok: false, error: "Note not found or retention window expired." },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, kind, noteId: restored.id, studentId: restored.studentId });
    }

    if (kind === "tutor_note") {
      const restored = await restoreTutorNote(noteId);
      if (!restored) {
        return NextResponse.json(
          { ok: false, error: "Note not found or retention window expired." },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, kind, noteId: restored.id, tutorId: restored.tutorId });
    }

    const restored = await restoreHouseholdNote(noteId);
    if (!restored) {
      return NextResponse.json(
        { ok: false, error: "Note not found or retention window expired." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      kind,
      noteId: restored.id,
      householdId: restored.householdId,
    });
  } catch (error) {
    console.warn("[staff/settings/recycle-bin/restore] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to restore note." }, { status: 500 });
  }
}
