import { NextResponse } from "next/server";
import {
  AssignTutoringRequestError,
  assignTutoringRequest,
} from "@/lib/booking/assign-tutoring-request";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { tutorId?: string; slotId?: string };
    const tutorId = (body.tutorId ?? "").trim();
    const slotId = (body.slotId ?? "").trim();
    if (!tutorId || !slotId) {
      return NextResponse.json({ ok: false, error: "Choose a tutor and time." }, { status: 400 });
    }

    const result = await assignTutoringRequest({
      requestId: id,
      tutorId,
      slotId,
      staffId: staff.staff.id,
    });

    return NextResponse.json({
      ok: true,
      tutoringRequestId: result.request.id,
      bookingId: result.booking.id,
    });
  } catch (error) {
    if (error instanceof AssignTutoringRequestError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.warn("[staff/tutoring-requests/assign] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to assign a tutor." }, { status: 500 });
  }
}
