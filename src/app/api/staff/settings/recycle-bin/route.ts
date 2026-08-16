import { NextResponse } from "next/server";
import { listDeletedHouseholdNotes } from "@/lib/staff/families";
import { listDeletedGuardianNotes } from "@/lib/staff/guardians";
import { listDeletedStudentNotes } from "@/lib/staff/students";
import { STAFF_NOTE_RECYCLE_DAYS, type StaffRecycledNote } from "@/lib/staff/staff-notes-recycle";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const [guardianNotes, householdNotes, studentNotes] = await Promise.all([
      listDeletedGuardianNotes(),
      listDeletedHouseholdNotes(),
      listDeletedStudentNotes(),
    ]);

    const notes: StaffRecycledNote[] = [...guardianNotes, ...householdNotes, ...studentNotes].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );

    return NextResponse.json({
      ok: true,
      retentionDays: STAFF_NOTE_RECYCLE_DAYS,
      notes,
    });
  } catch (error) {
    console.warn("[staff/settings/recycle-bin] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load recycle bin." }, { status: 500 });
  }
}
