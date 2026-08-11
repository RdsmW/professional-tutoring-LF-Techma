import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database
      .select({
        id: subjects.id,
        code: subjects.code,
        name: subjects.name,
        category: subjects.category,
      })
      .from(subjects)
      .where(eq(subjects.active, true))
      .orderBy(asc(subjects.name));

    return NextResponse.json({
      ok: true,
      subjects: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
      })),
    });
  } catch (error) {
    console.warn("[staff/subjects] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load subjects." }, { status: 500 });
  }
}
