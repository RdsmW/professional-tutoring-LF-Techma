import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { getStripe, getStripePublishableKey, isStripeConfigured } from "@/lib/stripe/client";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe is not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
        },
        { status: 503 },
      );
    }

    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const stripe = getStripe()!;
    const database = requireDb();
    let customerId = context.household.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.guardian.email,
        name: `${context.guardian.firstName} ${context.guardian.lastName}`.trim(),
        metadata: {
          householdId: context.household.id,
          guardianId: context.guardian.id,
        },
      });
      customerId = customer.id;
      await database
        .update(households)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(households.id, context.household.id));
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      metadata: {
        householdId: context.household.id,
      },
    });

    return NextResponse.json({
      ok: true,
      clientSecret: setupIntent.client_secret,
      publishableKey: getStripePublishableKey(),
      customerId,
    });
  } catch (error) {
    console.warn("[billing/setup-intent] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to start card setup" }, { status: 500 });
  }
}
