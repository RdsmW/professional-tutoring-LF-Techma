import { NextResponse } from "next/server";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { isValidOptionId } from "@/lib/forms/options";

type StudentBody = {
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  gradeLabel?: string;
  graduationYear?: string | number;
  gender?: string;
  learningNeeds?: string;
};

function parseGraduationYear(value: string | number | undefined) {
  const year = typeof value === "number" ? value : Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(year)) return null;
  if (!isValidOptionId("GRADUATION_YEARS", String(year))) return null;
  return year;
}

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const rows = await listHouseholdStudents(context.household.id);
    return NextResponse.json({
      ok: true,
      students: rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        firstName: row.firstName,
        lastName: row.lastName,
        schoolName: row.schoolName,
        gradeLabel: row.gradeLabel,
        graduationYear: row.graduationYear,
        gender: row.gender,
        learningNeeds: row.learningNeeds,
        lifecycle: row.lifecycle,
      })),
    });
  } catch (error) {
    console.warn("[family/students] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    if (!context.guardian.canManageStudents) {
      return NextResponse.json({ ok: false, error: "Not allowed to manage students" }, { status: 403 });
    }

    const body = (await request.json()) as StudentBody;
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const schoolName = (body.schoolName ?? "").trim();
    const gradeLabel = (body.gradeLabel ?? "").trim();
    const gender = (body.gender ?? "").trim();
    const learningNeeds = (body.learningNeeds ?? "").trim();
    const graduationYear = parseGraduationYear(body.graduationYear);

    if (!firstName || !lastName || !schoolName || !gradeLabel || !graduationYear || !gender || !learningNeeds) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "First name, last name, school, grade, graduation year, gender, and learning needs are required.",
        },
        { status: 400 },
      );
    }

    if (!isValidOptionId("GRADE_LABELS", gradeLabel)) {
      return NextResponse.json({ ok: false, error: "Invalid grade selection." }, { status: 400 });
    }
    if (!isValidOptionId("GENDER", gender)) {
      return NextResponse.json({ ok: false, error: "Invalid gender selection." }, { status: 400 });
    }

    const displayName = `${firstName} ${lastName}`.trim();
    const database = requireDb();
    const [created] = await database
      .insert(students)
      .values({
        householdId: context.household.id,
        displayName,
        firstName,
        lastName,
        schoolName,
        gradeLabel,
        graduationYear,
        gender,
        learningNeeds,
        lifecycle: "prospect",
      })
      .returning();

    return NextResponse.json({
      ok: true,
      student: {
        id: created.id,
        displayName: created.displayName,
        schoolName: created.schoolName,
        gradeLabel: created.gradeLabel,
        graduationYear: created.graduationYear,
        gender: created.gender,
        learningNeeds: created.learningNeeds,
        lifecycle: created.lifecycle,
      },
    });
  } catch (error) {
    console.warn("[family/students] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create student" }, { status: 500 });
  }
}
