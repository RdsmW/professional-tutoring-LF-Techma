import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
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

    const database = requireDb();
    const [household] = await database.select({ id: households.id }).from(households).where(eq(households.id, id)).limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const makeBillingOwner = Boolean(body.isBillingOwner);
    if (makeBillingOwner) {
      await database
        .update(guardians)
        .set({ isBillingOwner: false, updatedAt: new Date() })
        .where(eq(guardians.householdId, id));
    }

    const [guardian] = await database
      .insert(guardians)
      .values({
        householdId: id,
        firstName,
        lastName,
        email,
        phone: normalizePhone(phone),
        isBillingOwner: makeBillingOwner,
        canManageStudents: true,
        canRequestServices: true,
        updatedAt: new Date(),
      })
      .returning({ id: guardians.id });

    if (makeBillingOwner) {
      await database
        .update(households)
        .set({ billingOwnerGuardianId: guardian.id, updatedAt: new Date() })
        .where(eq(households.id, id));
    }

    return NextResponse.json({ ok: true, guardianId: guardian.id });
  } catch (error) {
    console.warn("[staff/families/guardians] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create guardian." }, { status: 500 });
  }
}
