import { NextResponse } from "next/server";
import { listDeletedGuardianNotes } from "@/lib/staff/guardians";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const notes = await listDeletedGuardianNotes();
    return NextResponse.json({
      ok: true,
      retentionDays: 30,
      notes,
    });
  } catch (error) {
    console.warn("[staff/settings/recycle-bin] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load recycle bin." }, { status: 500 });
  }
}
