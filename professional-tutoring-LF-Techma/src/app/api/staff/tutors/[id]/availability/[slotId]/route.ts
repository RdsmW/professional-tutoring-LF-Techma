import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, tutors } from "@/lib/db/schema";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string; slotId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: tutorId, slotId } = await context.params;
    if (!tutorId || !slotId) {
      return NextResponse.json(
        { ok: false, error: "Tutor id and slot id are required." },
        { status: 400 },
      );
    }

    const database = requireDb();

    const [tutor] = await database.select({ id: tutors.id }).from(tutors).where(eq(tutors.id, tutorId)).limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const [existing] = await database
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.tutorId, tutorId),
          eq(availabilitySlots.active, true),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Open hour not found." }, { status: 404 });
    }

    const hasSeatActivity = existing.heldSeats > 0 || existing.bookedSeats > 0;

    if (hasSeatActivity) {
      await database
        .update(availabilitySlots)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(availabilitySlots.id, slotId));
    } else {
      await database.delete(availabilitySlots).where(eq(availabilitySlots.id, slotId));
    }

    return NextResponse.json({
      ok: true,
      removed: { id: slotId, tutorId, soft: hasSeatActivity },
    });
  } catch (error) {
    console.warn("[staff/tutors/availability] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to remove open hour." }, { status: 500 });
  }
}
