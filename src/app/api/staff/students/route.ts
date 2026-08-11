import { NextResponse } from "next/server";
import { and, desc, eq, ilike, SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const lifecycle = (searchParams.get("lifecycle") ?? "").trim();
    const grade = (searchParams.get("grade") ?? "").trim();
    const school = (searchParams.get("school") ?? "").trim();

    if (lifecycle && !LIFECYCLES.has(lifecycle)) {
      return NextResponse.json({ ok: false, error: "Invalid lifecycle filter." }, { status: 400 });
    }

    const database = requireDb();
    const filters: SQL[] = [];
    if (q) filters.push(ilike(students.displayName, `%${q}%`));
    if (lifecycle) filters.push(eq(students.lifecycle, lifecycle as typeof students.$inferSelect.lifecycle));
    if (grade) filters.push(ilike(students.gradeLabel, `%${grade}%`));
    if (school) filters.push(ilike(students.schoolName, `%${school}%`));

    const rows = await database
      .select({
        id: students.id,
        displayName: students.displayName,
        gradeLabel: students.gradeLabel,
        schoolName: students.schoolName,
        graduationYear: students.graduationYear,
        lifecycle: students.lifecycle,
        householdId: students.householdId,
        householdDisplayName: households.displayName,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .innerJoin(households, eq(students.householdId, households.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(students.updatedAt));

    return NextResponse.json({
      ok: true,
      students: rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        gradeLabel: row.gradeLabel,
        schoolName: row.schoolName,
        graduationYear: row.graduationYear,
        lifecycle: row.lifecycle,
        householdId: row.householdId,
        householdDisplayName: row.householdDisplayName,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[staff/students] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load students." }, { status: 500 });
  }
}
