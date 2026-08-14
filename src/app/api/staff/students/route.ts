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
    const householdId = (searchParams.get("householdId") ?? searchParams.get("household") ?? "").trim();

    if (lifecycle && !LIFECYCLES.has(lifecycle)) {
      return NextResponse.json({ ok: false, error: "Invalid lifecycle filter." }, { status: 400 });
    }

    const database = requireDb();
    const filters: SQL[] = [];
    if (q) filters.push(ilike(students.displayName, `%${q}%`));
    if (lifecycle) filters.push(eq(students.lifecycle, lifecycle as typeof students.$inferSelect.lifecycle));
    if (grade) filters.push(ilike(students.gradeLabel, `%${grade}%`));
    if (school) filters.push(ilike(students.schoolName, `%${school}%`));
    if (householdId) filters.push(eq(students.householdId, householdId));

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

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      householdId?: string;
      displayName?: string;
      gradeLabel?: string;
    };
    const householdId = (body.householdId ?? "").trim();
    const displayName = (body.displayName ?? "").trim();
    const gradeLabel = (body.gradeLabel ?? "").trim();

    if (!householdId || !displayName) {
      return NextResponse.json(
        { ok: false, error: "Household and student name are required." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const parts = displayName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? displayName;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Student";

    const [student] = await database
      .insert(students)
      .values({
        householdId,
        displayName,
        firstName,
        lastName,
        gradeLabel: gradeLabel || null,
        lifecycle: "prospect",
        updatedAt: new Date(),
      })
      .returning({ id: students.id });

    return NextResponse.json({ ok: true, studentId: student.id });
  } catch (error) {
    console.warn("[staff/students] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create student." }, { status: 500 });
  }
}
