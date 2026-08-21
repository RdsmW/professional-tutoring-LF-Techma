import { NextResponse } from "next/server";
import {
  listOpenSlotsForTutorWindow,
  listOpenTutorsForSubjectWindow,
} from "@/lib/booking/open-slots-for-subject-window";
import { isValidOptionId } from "@/lib/forms/options";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectCode = (searchParams.get("subjectCode") || "").trim();
    const windowId = (searchParams.get("windowId") || "").trim();
    const tutorId = (searchParams.get("tutorId") || "").trim();

    if (!subjectCode || !windowId) {
      return NextResponse.json({ ok: true, tutors: [], slots: [] });
    }
    if (!isValidOptionId("ACADEMIC_SUBJECTS", subjectCode)) {
      return NextResponse.json({ ok: false, error: "Invalid subject." }, { status: 400 });
    }
    if (!isValidOptionId("ACADEMIC_SCHEDULE_WINDOWS", windowId)) {
      return NextResponse.json({ ok: false, error: "Invalid time window." }, { status: 400 });
    }

    const tutors = await listOpenTutorsForSubjectWindow({ subjectCode, windowId });
    const slots = tutorId ? await listOpenSlotsForTutorWindow({ tutorId, windowId }) : [];

    return NextResponse.json({
      ok: true,
      tutors: tutors.map((tutor) => ({
        id: tutor.id,
        displayName: tutor.displayName,
        openSlots: tutor.openSlots,
      })),
      slots: slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        dayOfWeek: slot.dayOfWeek,
        startTimeLocal: slot.startTimeLocal,
        endTimeLocal: slot.endTimeLocal,
        openSeats: slot.openSeats,
      })),
    });
  } catch (error) {
    console.warn("[public/ay-tutoring-availability] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load available times." }, { status: 500 });
  }
}
