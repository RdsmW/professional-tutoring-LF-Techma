import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians } from "@/lib/db/schema";
import { refreshHouseholdDisplayNameIfAuto } from "@/lib/staff/household-display-name";
import {
  assertUniqueRelationshipRole,
  getStaffGuardianDetail,
  isGuardianRelationshipRole,
  setHouseholdBillingOwner,
  type GuardianRelationshipRole,
} from "@/lib/staff/guardians";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/validation/contact";

type PatchBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  relationshipRole?: GuardianRelationshipRole | null;
  isBillingOwner?: boolean;
  canManageStudents?: boolean;
  canRequestServices?: boolean;
};

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const detail = await getStaffGuardianDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Guardian not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, guardian: detail });
  } catch (error) {
    console.warn("[staff/guardians/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load guardian." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(guardians).where(eq(guardians.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Guardian not found." }, { status: 404 });
    }

    const updates: Partial<typeof guardians.$inferInsert> = { updatedAt: new Date() };

    if (typeof body.firstName === "string") {
      const firstName = body.firstName.trim();
      if (!firstName) {
        return NextResponse.json({ ok: false, error: "First name is required." }, { status: 400 });
      }
      updates.firstName = firstName;
    }
    if (typeof body.lastName === "string") {
      const lastName = body.lastName.trim();
      if (!lastName) {
        return NextResponse.json({ ok: false, error: "Last name is required." }, { status: 400 });
      }
      updates.lastName = lastName;
    }
    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!isValidEmail(email)) {
        return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
      }
      updates.email = email;
    }
    if (body.phone !== undefined) {
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (phone && !isValidPhone(phone)) {
        return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
      }
      updates.phone = normalizePhone(phone);
    }
    if (typeof body.canManageStudents === "boolean") updates.canManageStudents = body.canManageStudents;
    if (typeof body.canRequestServices === "boolean") updates.canRequestServices = body.canRequestServices;

    if (body.relationshipRole !== undefined) {
      if (body.relationshipRole !== null && !isGuardianRelationshipRole(body.relationshipRole)) {
        return NextResponse.json(
          { ok: false, error: "Relationship role must be Parent 1 or Parent 2." },
          { status: 400 },
        );
      }
      if (!existing.householdId && body.relationshipRole) {
        return NextResponse.json(
          { ok: false, error: "Assign this guardian to a family before setting Parent 1 / Parent 2." },
          { status: 400 },
        );
      }
      if (existing.householdId && body.relationshipRole) {
        const conflict = await assertUniqueRelationshipRole({
          householdId: existing.householdId,
          guardianId: id,
          relationshipRole: body.relationshipRole,
        });
        if (conflict) {
          return NextResponse.json({ ok: false, error: conflict }, { status: 400 });
        }
      }
      updates.relationshipRole = body.relationshipRole;
    }

    if (body.isBillingOwner !== undefined) {
      if (!existing.householdId) {
        return NextResponse.json(
          { ok: false, error: "Assign this guardian to a family before setting payment responsibility." },
          { status: 400 },
        );
      }
      if (body.isBillingOwner) {
        await setHouseholdBillingOwner(existing.householdId, id);
      } else if (existing.isBillingOwner) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Choose another household guardian as Responsible for payment on the Family page before removing this payer.",
          },
          { status: 400 },
        );
      }
    }

    const hasIdentityUpdates = Object.keys(updates).some((key) => key !== "updatedAt");
    if (hasIdentityUpdates) {
      await database.update(guardians).set(updates).where(eq(guardians.id, id));
    }

    if (existing.householdId) {
      await refreshHouseholdDisplayNameIfAuto(existing.householdId);
    }

    const detail = await getStaffGuardianDetail(id);
    return NextResponse.json({ ok: true, guardian: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Responsible for payment")) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    console.warn("[staff/guardians/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update guardian." }, { status: 500 });
  }
}
