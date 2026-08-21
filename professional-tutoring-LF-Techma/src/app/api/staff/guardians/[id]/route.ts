import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians } from "@/lib/db/schema";
import {
  HOUSEHOLD_COUNTRY_US,
  refreshHouseholdDisplayNameIfAuto,
} from "@/lib/staff/household-display-name";
import {
  assertUniqueRelationshipRole,
  getStaffGuardianDetail,
  isGuardianRelationshipRole,
  setHouseholdBillingOwner,
  syncHouseholdBillingAddressFromGuardian,
  type GuardianRelationshipRole,
} from "@/lib/staff/guardians";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/validation/contact";

type PatchBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  otherInformation?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  zohoCrmId?: string | null;
  zohoCrmUrl?: string | null;
  relationshipRole?: GuardianRelationshipRole | null;
  isBillingOwner?: boolean;
  canManageStudents?: boolean;
  canRequestServices?: boolean;
  status?: "active" | "archived";
};

function optionalTrimmedText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

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
    let addressTouched = false;
    let becameBillingOwner = false;

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
      const staffBlock = await assertNotStaffAsGuardian({
        email,
        clerkUserId: existing.clerkUserId,
      });
      if (staffBlock) {
        return NextResponse.json({ ok: false, error: staffBlock }, { status: 400 });
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
    if (body.otherInformation !== undefined) {
      updates.otherInformation = optionalTrimmedText(
        typeof body.otherInformation === "string" ? body.otherInformation : null,
      );
    }
    if (body.addressLine1 !== undefined) {
      updates.addressLine1 = optionalTrimmedText(
        typeof body.addressLine1 === "string" ? body.addressLine1 : null,
      );
      addressTouched = true;
    }
    if (body.addressLine2 !== undefined) {
      updates.addressLine2 = optionalTrimmedText(
        typeof body.addressLine2 === "string" ? body.addressLine2 : null,
      );
      addressTouched = true;
    }
    if (body.city !== undefined) {
      updates.city = optionalTrimmedText(typeof body.city === "string" ? body.city : null);
      addressTouched = true;
    }
    if (body.state !== undefined) {
      updates.state = optionalTrimmedText(typeof body.state === "string" ? body.state : null);
      addressTouched = true;
    }
    if (body.postalCode !== undefined) {
      updates.postalCode = optionalTrimmedText(
        typeof body.postalCode === "string" ? body.postalCode : null,
      );
      addressTouched = true;
    }
    if (addressTouched) {
      updates.country = HOUSEHOLD_COUNTRY_US;
    }

    if (body.zohoCrmId !== undefined) {
      updates.zohoCrmId =
        typeof body.zohoCrmId === "string" ? body.zohoCrmId.trim() || null : null;
    }
    if (body.zohoCrmUrl !== undefined) {
      const url = typeof body.zohoCrmUrl === "string" ? body.zohoCrmUrl.trim() : "";
      if (url && !/^https?:\/\//i.test(url)) {
        return NextResponse.json(
          { ok: false, error: "Zoho CRM URL must start with http:// or https://." },
          { status: 400 },
        );
      }
      updates.zohoCrmUrl = url || null;
    }

    if (typeof body.canManageStudents === "boolean") updates.canManageStudents = body.canManageStudents;
    if (typeof body.canRequestServices === "boolean") updates.canRequestServices = body.canRequestServices;

    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "archived") {
        return NextResponse.json(
          { ok: false, error: "Status must be active or archived." },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

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
        becameBillingOwner = true;
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

    const isPayerAfter =
      becameBillingOwner || existing.isBillingOwner || body.isBillingOwner === true;

    // setHouseholdBillingOwner syncs before address writes; re-sync when address changed for the payer.
    if (existing.householdId && addressTouched && isPayerAfter) {
      await syncHouseholdBillingAddressFromGuardian(existing.householdId, id);
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
