import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { tutors } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type NewTutorBody = {
  displayName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  maxSeatsPerSlot?: number;
  active?: boolean;
};

function notesPreview(notes: string | null, max = 80) {
  if (!notes) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database.select().from(tutors).orderBy(desc(tutors.updatedAt));

    return NextResponse.json({
      ok: true,
      tutors: rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        email: row.email,
        phone: row.phone,
        active: row.active,
        maxSeatsPerSlot: row.maxSeatsPerSlot,
        notesPreview: notesPreview(row.notes),
      })),
    });
  } catch (error) {
    console.warn("[staff/tutors] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load tutors." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as NewTutorBody;
    const displayName = (body.displayName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = (body.phone ?? "").trim();
    const notes = (body.notes ?? "").trim();
    const maxSeatsPerSlot =
      typeof body.maxSeatsPerSlot === "number" && Number.isFinite(body.maxSeatsPerSlot)
        ? Math.floor(body.maxSeatsPerSlot)
        : 1;
    const active = body.active !== false;

    if (!displayName || !email) {
      return NextResponse.json(
        { ok: false, error: "Display name and email are required." },
        { status: 400 },
      );
    }

    if (maxSeatsPerSlot < 1) {
      return NextResponse.json(
        { ok: false, error: "Max seats per slot must be at least 1." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const now = new Date();
    const [tutor] = await database
      .insert(tutors)
      .values({
        displayName,
        email,
        phone: phone || null,
        notes: notes || null,
        maxSeatsPerSlot,
        active,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      tutorId: tutor.id,
    });
  } catch (error) {
    console.warn("[staff/tutors] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create tutor." }, { status: 500 });
  }
}
