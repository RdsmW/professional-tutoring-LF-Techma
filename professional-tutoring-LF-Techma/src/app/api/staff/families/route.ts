import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import { listStaffFamilies } from "@/lib/staff/families";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";

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
  billingIsBillingOwner?: boolean;
  secondFirstName?: string;
  secondLastName?: string;
  secondEmail?: string;
  secondPhone?: string;
  secondIsBillingOwner?: boolean;
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const sort = (searchParams.get("sort") ?? "").trim();

    const families = await listStaffFamilies({ q, status, sort });

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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
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

    const billingStaffBlock = await assertNotStaffAsGuardian({ email: billingEmail });
    if (billingStaffBlock) {
      return NextResponse.json({ ok: false, error: billingStaffBlock }, { status: 400 });
    }

    const secondEmail = (body.secondEmail ?? "").trim().toLowerCase();
    const secondGuardianRequested =
      Boolean(secondEmail) &&
      Boolean((body.secondFirstName ?? "").trim()) &&
      Boolean((body.secondLastName ?? "").trim());
    if (secondGuardianRequested) {
      const secondStaffBlock = await assertNotStaffAsGuardian({ email: secondEmail });
      if (secondStaffBlock) {
        return NextResponse.json({ ok: false, error: secondStaffBlock }, { status: 400 });
      }
    }

    const database = requireDb();
    const now = new Date();
    const [household] = await database
      .insert(households)
      .values({
        displayName,
        displayNameManual: true,
        status: "pending",
        primaryPhone: primaryPhone || null,
        addressLine1: optionalText(body.addressLine1),
        addressLine2: optionalText(body.addressLine2),
        city: optionalText(body.city),
        state: optionalText(body.state),
        postalCode: optionalText(body.postalCode),
        country: "United States",
        notes: optionalText(body.notes),
        timezone: "America/New_York",
        updatedAt: now,
      })
      .returning();

    const billingToken = randomBytes(24).toString("hex");
    let secondIsOwner = secondGuardianRequested && body.secondIsBillingOwner === true;
    // First guardian defaults Yes when the flag is omitted; explicit false stays No.
    let firstIsOwner =
      body.billingIsBillingOwner === true ||
      (body.billingIsBillingOwner !== false && !secondIsOwner);
    if (firstIsOwner && secondIsOwner) {
      secondIsOwner = false;
    }

    const [billingGuardian] = await database
      .insert(guardians)
      .values({
        householdId: household.id,
        email: billingEmail,
        firstName: billingFirstName,
        lastName: billingLastName,
        phone: billingPhone,
        relationshipRole: "parent_1",
        isBillingOwner: firstIsOwner,
        inviteToken: billingToken,
        updatedAt: now,
      })
      .returning();

    if (firstIsOwner) {
      await database
        .update(households)
        .set({ billingOwnerGuardianId: billingGuardian.id, updatedAt: now })
        .where(eq(households.id, household.id));
    }

    let secondGuardianId: string | null = null;
    let secondInviteToken: string | null = null;
    if (secondGuardianRequested) {
      secondInviteToken = randomBytes(24).toString("hex");
      const [second] = await database
        .insert(guardians)
        .values({
          householdId: household.id,
          email: secondEmail,
          firstName: (body.secondFirstName ?? "").trim(),
          lastName: (body.secondLastName ?? "").trim(),
          phone: optionalText(body.secondPhone),
          relationshipRole: "parent_2",
          isBillingOwner: secondIsOwner,
          inviteToken: secondInviteToken,
          updatedAt: now,
        })
        .returning();
      secondGuardianId = second.id;
      if (secondIsOwner) {
        await database
          .update(households)
          .set({ billingOwnerGuardianId: second.id, updatedAt: now })
          .where(eq(households.id, household.id));
      }
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
