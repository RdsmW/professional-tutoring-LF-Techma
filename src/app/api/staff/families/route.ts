import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type NewFamilyBody = {
  displayName?: string;
  primaryPhone?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingEmail?: string;
  secondFirstName?: string;
  secondLastName?: string;
  secondEmail?: string;
  studentDisplayName?: string;
};

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database.select().from(households).orderBy(desc(households.updatedAt));
    const studentRows = await database.select().from(students);
    const guardianRows = await database.select().from(guardians);

    return NextResponse.json({
      ok: true,
      families: rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        status: row.status,
        primaryPhone: row.primaryPhone,
        studentCount: studentRows.filter((s) => s.householdId === row.id).length,
        guardianCount: guardianRows.filter((g) => g.householdId === row.id).length,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[staff/families] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load families." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as NewFamilyBody;
    const displayName = (body.displayName ?? "").trim();
    const primaryPhone = (body.primaryPhone ?? "").trim();
    const billingFirstName = (body.billingFirstName ?? "").trim();
    const billingLastName = (body.billingLastName ?? "").trim();
    const billingEmail = (body.billingEmail ?? "").trim().toLowerCase();

    if (!displayName || !billingFirstName || !billingLastName || !billingEmail) {
      return NextResponse.json(
        { ok: false, error: "Household name and billing guardian name/email are required." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const now = new Date();
    const [household] = await database
      .insert(households)
      .values({
        displayName,
        status: "pending",
        primaryPhone: primaryPhone || null,
        timezone: "America/New_York",
        updatedAt: now,
      })
      .returning();

    const billingToken = randomBytes(24).toString("hex");
    const [billingGuardian] = await database
      .insert(guardians)
      .values({
        householdId: household.id,
        email: billingEmail,
        firstName: billingFirstName,
        lastName: billingLastName,
        isBillingOwner: true,
        inviteToken: billingToken,
        updatedAt: now,
      })
      .returning();

    await database
      .update(households)
      .set({ billingOwnerGuardianId: billingGuardian.id, updatedAt: now })
      .where(eq(households.id, household.id));

    const secondEmail = (body.secondEmail ?? "").trim().toLowerCase();
    let secondGuardianId: string | null = null;
    let secondInviteToken: string | null = null;
    if (secondEmail && (body.secondFirstName ?? "").trim() && (body.secondLastName ?? "").trim()) {
      secondInviteToken = randomBytes(24).toString("hex");
      const [second] = await database
        .insert(guardians)
        .values({
          householdId: household.id,
          email: secondEmail,
          firstName: (body.secondFirstName ?? "").trim(),
          lastName: (body.secondLastName ?? "").trim(),
          isBillingOwner: false,
          inviteToken: secondInviteToken,
          updatedAt: now,
        })
        .returning();
      secondGuardianId = second.id;
    }

    const studentName = (body.studentDisplayName ?? "").trim();
    let studentId: string | null = null;
    if (studentName) {
      const parts = studentName.split(/\s+/);
      const firstName = parts[0] ?? studentName;
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Student";
      const [student] = await database
        .insert(students)
        .values({
          householdId: household.id,
          displayName: studentName,
          firstName,
          lastName,
          lifecycle: "prospect",
          updatedAt: now,
        })
        .returning();
      studentId = student.id;
    }

    return NextResponse.json({
      ok: true,
      familyId: household.id,
      billingInvitePath: `/invite/${billingToken}`,
      secondGuardianId,
      secondInvitePath: secondInviteToken ? `/invite/${secondInviteToken}` : null,
      studentId,
    });
  } catch (error) {
    console.warn("[staff/families] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create family." }, { status: 500 });
  }
}
