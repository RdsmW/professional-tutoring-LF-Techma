import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import {
  MAX_GUARDIANS_PER_HOUSEHOLD,
  refreshHouseholdDisplayNameIfAuto,
} from "@/lib/staff/household-display-name";
import {
  assertUniqueRelationshipRole,
  isGuardianRelationshipRole,
  nextAvailableRelationshipRole,
  type GuardianRelationshipRole,
} from "@/lib/staff/guardians";
import { getStaffContext } from "@/lib/staff/session";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/validation/contact";

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      isBillingOwner?: boolean;
      relationshipRole?: GuardianRelationshipRole | null;
    };

    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = (body.phone ?? "").trim();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { ok: false, error: "First name, last name, and email are required." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
    }

    const staffBlock = await assertNotStaffAsGuardian({ email });
    if (staffBlock) {
      return NextResponse.json({ ok: false, error: staffBlock }, { status: 400 });
    }

    const database = requireDb();
    const [household] = await database.select({ id: households.id }).from(households).where(eq(households.id, id)).limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const [guardianCount] = await database
      .select({ value: count() })
      .from(guardians)
      .where(eq(guardians.householdId, id));
    if (Number(guardianCount?.value ?? 0) >= MAX_GUARDIANS_PER_HOUSEHOLD) {
      return NextResponse.json(
        {
          ok: false,
          error: `This family already has ${MAX_GUARDIANS_PER_HOUSEHOLD} guardians. Unassign one before adding another.`,
        },
        { status: 400 },
      );
    }

    const makeBillingOwner = body.isBillingOwner === true;
    // Respect explicit checkbox: unchecked must stay false/No (do not auto-promote).
    const shouldBeBillingOwner = makeBillingOwner;

    let relationshipRole: GuardianRelationshipRole | null = null;
    if (body.relationshipRole !== undefined && body.relationshipRole !== null) {
      if (!isGuardianRelationshipRole(body.relationshipRole)) {
        return NextResponse.json(
          { ok: false, error: "Relationship role must be Parent 1 or Parent 2." },
          { status: 400 },
        );
      }
      relationshipRole = body.relationshipRole;
    } else {
      relationshipRole = await nextAvailableRelationshipRole(id);
    }

    if (shouldBeBillingOwner) {
      await database
        .update(guardians)
        .set({ isBillingOwner: false, updatedAt: new Date() })
        .where(eq(guardians.householdId, id));
    }

    // Placeholder id for uniqueness check before insert — use a temp check via siblings only.
    if (relationshipRole) {
      const conflict = await assertUniqueRelationshipRole({
        householdId: id,
        guardianId: "00000000-0000-0000-0000-000000000000",
        relationshipRole,
      });
      if (conflict) {
        return NextResponse.json({ ok: false, error: conflict }, { status: 400 });
      }
    }

    const [guardian] = await database
      .insert(guardians)
      .values({
        householdId: id,
        firstName,
        lastName,
        email,
        phone: normalizePhone(phone),
        relationshipRole,
        isBillingOwner: shouldBeBillingOwner,
        canManageStudents: true,
        canRequestServices: true,
        updatedAt: new Date(),
      })
      .returning({ id: guardians.id });

    if (shouldBeBillingOwner) {
      await database
        .update(households)
        .set({ billingOwnerGuardianId: guardian.id, updatedAt: new Date() })
        .where(eq(households.id, id));
    }

    await refreshHouseholdDisplayNameIfAuto(id);

    return NextResponse.json({ ok: true, guardianId: guardian.id });
  } catch (error) {
    console.warn("[staff/families/guardians] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create guardian." }, { status: 500 });
  }
}
