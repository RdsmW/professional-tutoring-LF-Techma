import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { availabilitySlots, tutors } from "@/lib/db/schema";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type CreateBody = {
  dayOfWeek?: number;
  startTimeLocal?: string;
  endTimeLocal?: string;
  capacitySeats?: number;
  label?: string | null;
  scheduleWindowId?: string | null;
};

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/** Accept HH:MM or HH:MM:SS from forms/DB; always store/return HH:MM. */
function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  const match = TIME_RE.exec(trimmed);
  if (!match) return null;
  const hour = match[1]!.padStart(2, "0");
  const minute = match[2]!;
  return `${hour}:${minute}`;
}

function serializeSlot(slot: typeof availabilitySlots.$inferSelect) {
  return {
    id: slot.id,
    tutorId: slot.tutorId,
    dayOfWeek: slot.dayOfWeek,
    startTimeLocal: normalizeTime(slot.startTimeLocal) ?? slot.startTimeLocal,
    endTimeLocal: normalizeTime(slot.endTimeLocal) ?? slot.endTimeLocal,
    capacitySeats: slot.capacitySeats,
    heldSeats: slot.heldSeats,
    bookedSeats: slot.bookedSeats,
    active: slot.active,
    label: slot.label,
    scheduleWindowId: slot.scheduleWindowId,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: tutorId } = await context.params;
    if (!tutorId) {
      return NextResponse.json({ ok: false, error: "Tutor id required." }, { status: 400 });
    }

    const database = requireDb();
    const [tutor] = await database.select({ id: tutors.id }).from(tutors).where(eq(tutors.id, tutorId)).limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const slots = await database
      .select()
      .from(availabilitySlots)
      .where(and(eq(availabilitySlots.tutorId, tutorId), eq(availabilitySlots.active, true)))
      .orderBy(asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTimeLocal));

    return NextResponse.json({
      ok: true,
      slots: slots.map(serializeSlot),
    });
  } catch (error) {
    console.warn("[staff/tutors/availability] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load open hours." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: tutorId } = await context.params;
    if (!tutorId) {
      return NextResponse.json({ ok: false, error: "Tutor id required." }, { status: 400 });
    }

    const body = (await request.json()) as CreateBody;
    const dayOfWeek = Math.floor(Number(body.dayOfWeek));
    if (!Number.isFinite(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { ok: false, error: "dayOfWeek must be an integer from 0 (Sun) to 6 (Sat)." },
        { status: 400 },
      );
    }

    const startTimeLocal = normalizeTime(String(body.startTimeLocal ?? ""));
    const endTimeLocal = normalizeTime(String(body.endTimeLocal ?? ""));
    if (!startTimeLocal || !endTimeLocal) {
      return NextResponse.json(
        { ok: false, error: "Start and end times must be in HH:MM format." },
        { status: 400 },
      );
    }
    if (endTimeLocal <= startTimeLocal) {
      return NextResponse.json(
        { ok: false, error: "End time must be after start time." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const [tutor] = await database
      .select({ id: tutors.id, maxSeatsPerSlot: tutors.maxSeatsPerSlot })
      .from(tutors)
      .where(eq(tutors.id, tutorId))
      .limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    let capacitySeats = tutor.maxSeatsPerSlot;
    if (body.capacitySeats !== undefined) {
      const seats = Math.floor(Number(body.capacitySeats));
      if (!Number.isFinite(seats) || seats < 1) {
        return NextResponse.json(
          { ok: false, error: "capacitySeats must be at least 1." },
          { status: 400 },
        );
      }
      capacitySeats = seats;
    }

    const label =
      body.label === undefined || body.label === null ? null : String(body.label).trim() || null;
    const scheduleWindowId =
      body.scheduleWindowId === undefined || body.scheduleWindowId === null
        ? null
        : String(body.scheduleWindowId).trim() || null;

    const sameDaySlots = await database
      .select({
        id: availabilitySlots.id,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
      })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.tutorId, tutorId),
          eq(availabilitySlots.dayOfWeek, dayOfWeek),
          eq(availabilitySlots.active, true),
        ),
      );

    const duplicate = sameDaySlots.find(
      (slot) =>
        (normalizeTime(slot.startTimeLocal) ?? slot.startTimeLocal) === startTimeLocal &&
        (normalizeTime(slot.endTimeLocal) ?? slot.endTimeLocal) === endTimeLocal,
    );

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: "An open hour already exists for that day and time." },
        { status: 409 },
      );
    }

    const [slot] = await database
      .insert(availabilitySlots)
      .values({
        tutorId,
        dayOfWeek,
        startTimeLocal,
        endTimeLocal,
        capacitySeats,
        label,
        scheduleWindowId,
        active: true,
      })
      .returning();

    return NextResponse.json({ ok: true, slot: serializeSlot(slot) });
  } catch (error) {
    console.warn("[staff/tutors/availability] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to add open hour." }, { status: 500 });
  }
}
