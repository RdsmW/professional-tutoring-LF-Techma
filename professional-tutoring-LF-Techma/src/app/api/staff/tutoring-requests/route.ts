import { NextResponse } from "next/server";
import { listTutoringAssignmentQueue } from "@/lib/staff/tutoring-assignment-queue";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const rows = await listTutoringAssignmentQueue();
    return NextResponse.json({ ok: true, requests: rows });
  } catch (error) {
    console.warn("[staff/tutoring-requests] GET fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load tutoring requests." }, { status: 500 });
  }
}
