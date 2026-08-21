import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

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

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    // Tutor pickers omit this → active-only. Settings uses includeInactive=1.
    const includeInactive = searchParams.get("includeInactive") === "1";

    const database = requireDb();
    const rows = includeInactive
      ? await database.select().from(subjects).orderBy(asc(subjects.name))
      : await database
          .select()
          .from(subjects)
          .where(eq(subjects.active, true))
          .orderBy(asc(subjects.name));

    return NextResponse.json({
      ok: true,
      subjects: rows.map(serializeSubject),
    });
  } catch (error) {
    console.warn("[staff/subjects] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load subjects." }, { status: 500 });
  }
}

type PostBody = {
  name?: string;
  code?: string;
  category?: string | null;
  active?: boolean;
};

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as PostBody;
    const name = (body.name ?? "").trim();
    const code = (body.code ?? "").trim().toUpperCase();
    const category = body.category == null ? null : String(body.category).trim() || null;
    const active = body.active !== false;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ ok: false, error: "Code is required." }, { status: 400 });
    }

    const database = requireDb();
    try {
      const [row] = await database
        .insert(subjects)
        .values({ name, code, category, active })
        .returning();
      return NextResponse.json({ ok: true, subject: serializeSubject(row) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("unique") || message.includes("subjects_code")) {
        return NextResponse.json({ ok: false, error: "Subject code already exists." }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.warn("[staff/subjects] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create subject." }, { status: 500 });
  }
}
