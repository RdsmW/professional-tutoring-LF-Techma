import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, subjects, tutorSubjects } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  name?: string;
  code?: string;
  category?: string | null;
  active?: boolean;
};

function serializeSubject(row: {
  id: string;
  code: string;
  name: string;
  category: string | null;
  active: boolean;
}) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    active: row.active,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Subject id required." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    const database = requireDb();
    const [existing] = await database.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Subject not found." }, { status: 404 });
    }

    const patch: {
      name?: string;
      code?: string;
      category?: string | null;
      active?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ ok: false, error: "Name cannot be empty." }, { status: 400 });
      }
      patch.name = name;
    }
    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ ok: false, error: "Code cannot be empty." }, { status: 400 });
      }
      patch.code = code;
    }
    if (body.category !== undefined) {
      patch.category = body.category == null ? null : String(body.category).trim() || null;
    }
    if (typeof body.active === "boolean") {
      patch.active = body.active;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update." }, { status: 400 });
    }

    try {
      const [row] = await database.update(subjects).set(patch).where(eq(subjects.id, id)).returning();
      return NextResponse.json({ ok: true, subject: serializeSubject(row) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("unique") || message.includes("subjects_code")) {
        return NextResponse.json({ ok: false, error: "Subject code already exists." }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.warn("[staff/subjects/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update subject." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Subject id required." }, { status: 400 });
    }

    const database = requireDb();
    const [existing] = await database
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Subject not found." }, { status: 404 });
    }

    const [tutorUse] = await database
      .select({ total: count(tutorSubjects.id) })
      .from(tutorSubjects)
      .where(eq(tutorSubjects.subjectId, id));
    const [bookingUse] = await database
      .select({ total: count(bookings.id) })
      .from(bookings)
      .where(eq(bookings.subjectId, id));

    const tutorCount = Number(tutorUse?.total ?? 0);
    const bookingCount = Number(bookingUse?.total ?? 0);
    if (tutorCount > 0 || bookingCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subject is in use (tutor assignments or bookings). Deactivate it instead of deleting.",
        },
        { status: 409 },
      );
    }

    await database.delete(subjects).where(eq(subjects.id, id));
    return NextResponse.json({ ok: true, deleted: { id } });
  } catch (error) {
    console.warn("[staff/subjects/id] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete subject." }, { status: 500 });
  }
}
