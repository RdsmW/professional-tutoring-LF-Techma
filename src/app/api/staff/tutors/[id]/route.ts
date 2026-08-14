import { NextResponse } from "next/server";
import { and, count, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, subjects, tutorSubjects, tutors } from "@/lib/db/schema";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

type PatchBody = {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  active?: boolean;
  maxSeatsPerSlot?: number;
};

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [tutor] = await database.select().from(tutors).where(eq(tutors.id, id)).limit(1);
    if (!tutor) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const subjectRows = await database
      .select({
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        priority: tutorSubjects.priority,
      })
      .from(tutorSubjects)
      .innerJoin(subjects, eq(tutorSubjects.subjectId, subjects.id))
      .where(eq(tutorSubjects.tutorId, id));

    const workloadRows = await database
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.tutorId, id),
          inArray(bookings.status, ["confirmed", "held", "pending_payment"]),
        ),
      );

    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.tutorId, id));
    const [subjectCount] = await database
      .select({ value: count() })
      .from(tutorSubjects)
      .where(eq(tutorSubjects.tutorId, id));

    const canDelete =
      Number(bookingCount?.value ?? 0) === 0 && Number(subjectCount?.value ?? 0) === 0;

    return NextResponse.json({
      ok: true,
      tutor: {
        id: tutor.id,
        displayName: tutor.displayName,
        email: tutor.email,
        phone: tutor.phone,
        active: tutor.active,
        maxSeatsPerSlot: tutor.maxSeatsPerSlot,
        notes: tutor.notes,
        subjects: subjectRows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          priority: row.priority,
        })),
        workloadCount: workloadRows.length,
        canDelete,
      },
    });
  } catch (error) {
    console.warn("[staff/tutors/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load tutor." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(tutors).where(eq(tutors.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const updates: Partial<typeof tutors.$inferInsert> = { updatedAt: new Date() };

    if (body.displayName !== undefined) {
      const displayName = body.displayName.trim();
      if (!displayName) {
        return NextResponse.json({ ok: false, error: "Display name is required." }, { status: 400 });
      }
      updates.displayName = displayName;
    }

    if (body.email !== undefined) {
      const email = (body.email ?? "").trim().toLowerCase();
      updates.email = email || null;
    }

    if (body.phone !== undefined) {
      const phone = (body.phone ?? "").trim();
      updates.phone = phone || null;
    }

    if (body.notes !== undefined) {
      const notes = (body.notes ?? "").trim();
      updates.notes = notes || null;
    }

    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    if (body.maxSeatsPerSlot !== undefined) {
      const seats = Math.floor(Number(body.maxSeatsPerSlot));
      if (!Number.isFinite(seats) || seats < 1) {
        return NextResponse.json(
          { ok: false, error: "Max seats per slot must be at least 1." },
          { status: 400 },
        );
      }
      updates.maxSeatsPerSlot = seats;
    }

    const [tutor] = await database.update(tutors).set(updates).where(eq(tutors.id, id)).returning();

    return NextResponse.json({
      ok: true,
      tutor: {
        id: tutor.id,
        displayName: tutor.displayName,
        email: tutor.email,
        phone: tutor.phone,
        active: tutor.active,
        maxSeatsPerSlot: tutor.maxSeatsPerSlot,
        notes: tutor.notes,
      },
    });
  } catch (error) {
    console.warn("[staff/tutors/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update tutor." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [existing] = await database.select({ id: tutors.id }).from(tutors).where(eq(tutors.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Tutor not found." }, { status: 404 });
    }

    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.tutorId, id));
    const [subjectCount] = await database
      .select({ value: count() })
      .from(tutorSubjects)
      .where(eq(tutorSubjects.tutorId, id));

    if (Number(bookingCount?.value ?? 0) > 0 || Number(subjectCount?.value ?? 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Delete is only allowed when the tutor has no bookings and no assigned subjects. Remove subjects and archive instead.",
        },
        { status: 400 },
      );
    }

    await database.delete(tutorSubjects).where(eq(tutorSubjects.tutorId, id));
    await database.delete(tutors).where(eq(tutors.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/tutors/id] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete tutor." }, { status: 500 });
  }
}
