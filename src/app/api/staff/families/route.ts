import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import { listStaffFamilies } from "@/lib/staff/families";
import { getStaffContext } from "@/lib/staff/session";

type NewFamilyBody = {
  displayName?: string;
  primaryPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingEmail?: string;
  billingPhone?: string;
  secondFirstName?: string;
  secondLastName?: string;
  secondEmail?: string;
  secondPhone?: string;
  studentDisplayName?: string;
  secondStudentDisplayName?: string;
};

function optionalText(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();

    const families = await listStaffFamilies({ q, status });

    return NextResponse.json({
      ok: true,
      families,
    });
  } catch (error) {
    console.warn("[staff/families] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load families." }, { status: 500 });
  }
}

function insertStudentFromDisplayName(
  studentName: string,
  householdId: string,
  now: Date,
) {
  const parts = studentName.split(/\s+/);
  const firstName = parts[0] ?? studentName;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Student";
  return {
    householdId,
    displayName: studentName,
    firstName,
    lastName,
    lifecycle: "prospect" as const,
    updatedAt: now,
  };
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
    const billingPhone = optionalText(body.billingPhone);

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
        addressLine1: optionalText(body.addressLine1),
        addressLine2: optionalText(body.addressLine2),
        city: optionalText(body.city),
        state: optionalText(body.state),
        postalCode: optionalText(body.postalCode),
        notes: optionalText(body.notes),
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
        phone: billingPhone,
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
          phone: optionalText(body.secondPhone),
          isBillingOwner: false,
          inviteToken: secondInviteToken,
          updatedAt: now,
        })
        .returning();
      secondGuardianId = second.id;
    }

    const studentIds: string[] = [];
    for (const rawName of [body.studentDisplayName, body.secondStudentDisplayName]) {
      const studentName = (rawName ?? "").trim();
      if (!studentName) continue;
      const [student] = await database
        .insert(students)
        .values(insertStudentFromDisplayName(studentName, household.id, now))
        .returning();
      studentIds.push(student.id);
    }

    return NextResponse.json({
      ok: true,
      familyId: household.id,
      billingInvitePath: `/invite/${billingToken}`,
      secondGuardianId,
      secondInvitePath: secondInviteToken ? `/invite/${secondInviteToken}` : null,
      studentId: studentIds[0] ?? null,
      studentIds,
    });
  } catch (error) {
    console.warn("[staff/families] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create family." }, { status: 500 });
  }
}
