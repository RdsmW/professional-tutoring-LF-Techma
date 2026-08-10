import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { isValidOptionId } from "@/lib/forms/options";

type OnboardingBody = {
  displayName?: string;
  primaryPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const { guardian, household } = context;
    return NextResponse.json({
      ok: true,
      household: {
        id: household.id,
        displayName: household.displayName,
        status: household.status,
        primaryPhone: household.primaryPhone ?? "",
        addressLine1: household.addressLine1 ?? "",
        addressLine2: household.addressLine2 ?? "",
        city: household.city ?? "",
        state: household.state ?? "",
        postalCode: household.postalCode ?? "",
      },
      billingOwner: {
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
      },
    });
  } catch (error) {
    console.warn("[family/onboarding] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load onboarding" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const body = (await request.json()) as OnboardingBody;
    const displayName = (body.displayName ?? "").trim();
    const primaryPhone = (body.primaryPhone ?? "").trim();
    const addressLine1 = (body.addressLine1 ?? "").trim();
    const city = (body.city ?? "").trim();
    const state = (body.state ?? "").trim();
    const postalCode = (body.postalCode ?? "").trim();

    if (!displayName || !primaryPhone || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Household name, phone, and full address are required to unlock the portal.",
        },
        { status: 400 },
      );
    }

    if (!isValidOptionId("US_STATES", state)) {
      return NextResponse.json({ ok: false, error: "Invalid state selection." }, { status: 400 });
    }

    const database = requireDb();
    const [updated] = await database
      .update(households)
      .set({
        displayName,
        primaryPhone,
        addressLine1,
        addressLine2: (body.addressLine2 ?? "").trim() || null,
        city,
        state,
        postalCode,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(households.id, context.household.id))
      .returning();

    return NextResponse.json({
      ok: true,
      householdStatus: updated.status,
      householdName: updated.displayName,
    });
  } catch (error) {
    console.warn("[family/onboarding] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to save onboarding" }, { status: 500 });
  }
}
