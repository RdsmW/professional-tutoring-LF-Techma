import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, SQL, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, tutorNotes, tutorSubjects, tutors } from "@/lib/db/schema";
import { HOUSEHOLD_COUNTRY_US } from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

type NewTutorBody = {
  displayName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  maxSeatsPerSlot?: number;
  active?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

function notesPreview(notes: string | null, max = 80) {
  if (!notes) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const activeParam = (searchParams.get("active") ?? "").trim().toLowerCase();

    const database = requireDb();
    const filters: SQL[] = [];
    if (q) {
      filters.push(
        or(
          ilike(tutors.displayName, `%${q}%`),
          ilike(tutors.email, `%${q}%`),
          ilike(tutors.phone, `%${q}%`),
        )!,
      );
    }
    if (activeParam === "true") filters.push(eq(tutors.active, true));
    if (activeParam === "false") filters.push(eq(tutors.active, false));

    const latestNoteBody = sql<string | null>`(
      select ${tutorNotes.body}
      from ${tutorNotes}
      where ${tutorNotes.tutorId} = ${tutors.id}
        and ${tutorNotes.deletedAt} is null
      order by ${tutorNotes.createdAt} desc
      limit 1
    )`.mapWith((value) => (value == null ? null : String(value)));

    const rows = await database
      .select({
        id: tutors.id,
        displayName: tutors.displayName,
        email: tutors.email,
        phone: tutors.phone,
        active: tutors.active,
        maxSeatsPerSlot: tutors.maxSeatsPerSlot,
        notes: tutors.notes,
        latestNoteBody,
        updatedAt: tutors.updatedAt,
        bookingCount: sql<number>`count(distinct ${bookings.id})::int`.mapWith(Number),
        subjectCount: sql<number>`count(distinct ${tutorSubjects.id})::int`.mapWith(Number),
      })
      .from(tutors)
      .leftJoin(bookings, eq(bookings.tutorId, tutors.id))
      .leftJoin(tutorSubjects, eq(tutorSubjects.tutorId, tutors.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .groupBy(
        tutors.id,
        tutors.displayName,
        tutors.email,
        tutors.phone,
        tutors.active,
        tutors.maxSeatsPerSlot,
        tutors.notes,
        tutors.updatedAt,
      )
      .orderBy(desc(tutors.updatedAt));

    return NextResponse.json({
      ok: true,
      tutors: rows.map((row) => {
        const bookingCount = Number(row.bookingCount ?? 0);
        const subjectCount = Number(row.subjectCount ?? 0);
        return {
          id: row.id,
          displayName: row.displayName,
          email: row.email,
          phone: row.phone,
          active: row.active,
          maxSeatsPerSlot: row.maxSeatsPerSlot,
          notesPreview: notesPreview(row.latestNoteBody ?? row.notes),
          canDelete: bookingCount === 0 && subjectCount === 0,
        };
      }),
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const body = (await request.json()) as NewTutorBody;
    const displayName = (body.displayName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = (body.phone ?? "").trim();
    const notes = (body.notes ?? "").trim();
    const addressLine1 = (body.addressLine1 ?? "").trim();
    const addressLine2 = (body.addressLine2 ?? "").trim();
    const city = (body.city ?? "").trim();
    const state = (body.state ?? "").trim();
    const postalCode = (body.postalCode ?? "").trim();
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
        notes: null,
        maxSeatsPerSlot,
        active,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: HOUSEHOLD_COUNTRY_US,
        updatedAt: now,
      })
      .returning();

    if (notes) {
      await database.insert(tutorNotes).values({
        tutorId: tutor.id,
        authorStaffId: context.staff.id,
        authorDisplayName: context.staff.fullName,
        body: notes,
      });
    }

    return NextResponse.json({
      ok: true,
      tutorId: tutor.id,
    });
  } catch (error) {
    console.warn("[staff/tutors] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create tutor." }, { status: 500 });
  }
}
