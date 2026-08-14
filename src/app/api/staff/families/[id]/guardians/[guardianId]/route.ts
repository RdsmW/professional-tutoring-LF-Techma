import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/validation/contact";

type GuardianPatchBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  isBillingOwner?: boolean;
  canManageStudents?: boolean;
  canRequestServices?: boolean;
};

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string; guardianId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id, guardianId } = await contextParams.params;
    const body = (await request.json()) as GuardianPatchBody;
    const database = requireDb();

    const [existing] = await database
      .select()
      .from(guardians)
      .where(and(eq(guardians.id, guardianId), eq(guardians.householdId, id)))
      .limit(1);
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

    const makeBillingOwner = body.isBillingOwner === true;
    const clearBillingOwner = body.isBillingOwner === false;

    if (makeBillingOwner) {
      await database
        .update(guardians)
        .set({ isBillingOwner: false, updatedAt: new Date() })
        .where(eq(guardians.householdId, id));
      updates.isBillingOwner = true;
      await database
        .update(households)
        .set({ billingOwnerGuardianId: guardianId, updatedAt: new Date() })
        .where(eq(households.id, id));
    } else if (clearBillingOwner) {
      updates.isBillingOwner = false;
      const [household] = await database
        .select({ billingOwnerGuardianId: households.billingOwnerGuardianId })
        .from(households)
        .where(eq(households.id, id))
        .limit(1);
      if (household?.billingOwnerGuardianId === guardianId) {
        await database
          .update(households)
          .set({ billingOwnerGuardianId: null, updatedAt: new Date() })
          .where(eq(households.id, id));
      }
    }

    const [updated] = await database
      .update(guardians)
      .set(updates)
      .where(eq(guardians.id, guardianId))
      .returning();

    return NextResponse.json({
      ok: true,
      guardian: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        isBillingOwner: updated.isBillingOwner,
        canManageStudents: updated.canManageStudents,
        canRequestServices: updated.canRequestServices,
        invitePending: Boolean(updated.inviteToken && !updated.inviteAcceptedAt && !updated.clerkUserId),
        invitePath:
          updated.inviteToken && !updated.inviteAcceptedAt ? `/invite/${updated.inviteToken}` : null,
        linked: Boolean(updated.clerkUserId),
      },
    });
  } catch (error) {
    console.warn("[staff/families/id/guardians] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update guardian." }, { status: 500 });
  }
}
