import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, inArray, ne, SQL, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { bookings, courseEnrollments, guardians, households, students, studentSubjects, subjects } from "@/lib/db/schema";
import { buildStudentListLabel } from "@/lib/staff/students";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";
import { parseDirectorySort, type DirectorySort } from "@/lib/ui/directory-sort";

const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);

function studentOrderBy(sort: DirectorySort) {
  if (sort === "oldest") {
    return [asc(students.createdAt), asc(students.displayName)] as const;
  }
  if (sort === "name_asc") {
    return [asc(students.displayName), desc(students.createdAt)] as const;
  }
  return [desc(students.createdAt), asc(students.displayName)] as const;
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
    const lifecycle = (searchParams.get("lifecycle") ?? "").trim();
    const grade = (searchParams.get("grade") ?? "").trim();
    const school = (searchParams.get("school") ?? "").trim();
    const householdId = (searchParams.get("householdId") ?? searchParams.get("household") ?? "").trim();
    const sort = parseDirectorySort(searchParams.get("sort"));

    if (lifecycle && lifecycle !== "all" && !LIFECYCLES.has(lifecycle)) {
      return NextResponse.json({ ok: false, error: "Invalid lifecycle filter." }, { status: 400 });
    }

    const database = requireDb();
    const filters: SQL[] = [];
    if (q) filters.push(ilike(students.displayName, `%${q}%`));
    if (lifecycle === "all") {
      // no lifecycle constraint
    } else if (lifecycle && LIFECYCLES.has(lifecycle)) {
      filters.push(eq(students.lifecycle, lifecycle as typeof students.$inferSelect.lifecycle));
    } else {
      // Default: exclude archived so Restore is reachable via Archived filter
      filters.push(ne(students.lifecycle, "archived"));
    }
    if (grade) filters.push(ilike(students.gradeLabel, `%${grade}%`));
    if (school) filters.push(ilike(students.schoolName, `%${school}%`));
    if (householdId) filters.push(eq(students.householdId, householdId));

    const rows = await database
      .select({
        id: students.id,
        displayName: students.displayName,
        firstName: students.firstName,
        lastName: students.lastName,
        gradeLabel: students.gradeLabel,
        schoolName: students.schoolName,
        graduationYear: students.graduationYear,
        lifecycle: students.lifecycle,
        householdId: students.householdId,
        householdDisplayName: households.displayName,
        householdBillingOwnerGuardianId: households.billingOwnerGuardianId,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        bookingCount: sql<number>`count(distinct ${bookings.id})::int`.mapWith(Number),
        enrollmentCount: sql<number>`count(distinct ${courseEnrollments.id})::int`.mapWith(Number),
      })
      .from(students)
      .leftJoin(households, eq(students.householdId, households.id))
      .leftJoin(bookings, eq(bookings.studentId, students.id))
      .leftJoin(courseEnrollments, eq(courseEnrollments.studentId, students.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .groupBy(
        students.id,
        students.displayName,
        students.firstName,
        students.lastName,
        students.gradeLabel,
        students.schoolName,
        students.graduationYear,
        students.lifecycle,
        students.householdId,
        households.displayName,
        households.billingOwnerGuardianId,
        students.createdAt,
        students.updatedAt,
      )
      .orderBy(...studentOrderBy(sort));

    const householdIds = [
      ...new Set(rows.map((row) => row.householdId).filter((id): id is string => Boolean(id))),
    ];
    const billingEmailByHousehold = new Map<string, string>();
    if (householdIds.length > 0) {
      const guardianRows = await database
        .select({
          id: guardians.id,
          householdId: guardians.householdId,
          email: guardians.email,
          isBillingOwner: guardians.isBillingOwner,
        })
        .from(guardians)
        .where(inArray(guardians.householdId, householdIds));

      for (const householdIdValue of householdIds) {
        const householdGuardians = guardianRows.filter((g) => g.householdId === householdIdValue);
        const row = rows.find((r) => r.householdId === householdIdValue);
        const billing =
          householdGuardians.find((g) => g.id === row?.householdBillingOwnerGuardianId) ||
          householdGuardians.find((g) => g.isBillingOwner) ||
          householdGuardians[0];
        if (billing?.email) billingEmailByHousehold.set(householdIdValue, billing.email);
      }
    }

    const studentIds = rows.map((row) => row.id);
    const subjectsByStudent = new Map<string, Array<{ id: string; name: string; code: string }>>();
    if (studentIds.length > 0) {
      const subjectRows = await database
        .select({
          studentId: studentSubjects.studentId,
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        })
        .from(studentSubjects)
        .innerJoin(subjects, eq(studentSubjects.subjectId, subjects.id))
        .where(inArray(studentSubjects.studentId, studentIds))
        .orderBy(asc(subjects.name));
      for (const row of subjectRows) {
        const list = subjectsByStudent.get(row.studentId) ?? [];
        list.push({ id: row.id, name: row.name, code: row.code });
        subjectsByStudent.set(row.studentId, list);
      }
    }

    return NextResponse.json({
      ok: true,
      students: rows.map((row) => {
        const bookingCount = Number(row.bookingCount ?? 0);
        const enrollmentCount = Number(row.enrollmentCount ?? 0);
        const billingEmail = row.householdId ? billingEmailByHousehold.get(row.householdId) ?? null : null;
        const listLabel = buildStudentListLabel({
          firstName: row.firstName,
          lastName: row.lastName,
          displayName: row.displayName,
          billingEmail,
        });
        return {
          id: row.id,
          displayName: row.displayName,
          firstName: row.firstName,
          lastName: row.lastName,
          listLabel,
          billingEmail,
          gradeLabel: row.gradeLabel,
          schoolName: row.schoolName,
          graduationYear: row.graduationYear,
          lifecycle: row.lifecycle,
          householdId: row.householdId,
          householdDisplayName: row.householdDisplayName || "Unassigned",
          subjects: subjectsByStudent.get(row.id) ?? [],
          canDelete: bookingCount === 0 && enrollmentCount === 0,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
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

    const { refreshHouseholdDisplayNameIfAuto } = await import("@/lib/staff/household-display-name");
    await refreshHouseholdDisplayNameIfAuto(householdId);

    return NextResponse.json({ ok: true, studentId: student.id });
  } catch (error) {
    console.warn("[staff/students] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create student." }, { status: 500 });
  }
}
