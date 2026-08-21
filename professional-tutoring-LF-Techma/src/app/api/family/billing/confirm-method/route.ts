import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { getStripe, isStripeConfigured, PAYMENT_METHOD_CONSENT_VERSION } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
    }

    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      /** Persist this card on the household for future charges. */
      saveForFuture?: boolean;
      /** @deprecated alias for saveForFuture */
      consent?: boolean;
      setupIntentId?: string;
      paymentMethodId?: string;
    };

    const saveForFuture = Boolean(body.saveForFuture ?? body.consent);

    if (!body.setupIntentId && !body.paymentMethodId) {
      return NextResponse.json({ ok: false, error: "Missing payment method confirmation." }, { status: 400 });
    }

    const stripe = getStripe()!;
    let paymentMethodId = body.paymentMethodId ?? null;

    if (body.setupIntentId) {
      const setupIntent = await stripe.setupIntents.retrieve(body.setupIntentId);
      if (setupIntent.status !== "succeeded") {
        return NextResponse.json({ ok: false, error: "Card setup is not complete." }, { status: 400 });
      }
      if (setupIntent.metadata?.householdId && setupIntent.metadata.householdId !== context.household.id) {
        return NextResponse.json({ ok: false, error: "Setup does not match this household." }, { status: 403 });
      }
      paymentMethodId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id ?? null;
    }

    if (!paymentMethodId) {
      return NextResponse.json({ ok: false, error: "No payment method found." }, { status: 400 });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const customerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : paymentMethod.customer?.id ?? context.household.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ ok: false, error: "Stripe customer missing." }, { status: 400 });
    }

    if (
      context.household.stripeCustomerId &&
      customerId !== context.household.stripeCustomerId
    ) {
      return NextResponse.json({ ok: false, error: "Payment method does not belong to this household." }, { status: 403 });
    }

    const card = paymentMethod.card;
    const database = requireDb();

    if (saveForFuture) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      await database
        .update(households)
        .set({
          stripeCustomerId: customerId,
          stripeDefaultPaymentMethodId: paymentMethodId,
          cardBrand: card?.brand ?? null,
          cardLast4: card?.last4 ?? null,
          cardOnFile: true,
          paymentMethodConsentAt: new Date(),
          paymentMethodConsentVersion: PAYMENT_METHOD_CONSENT_VERSION,
          updatedAt: new Date(),
        })
        .where(eq(households.id, context.household.id));
    } else if (!context.household.stripeCustomerId) {
      await database
        .update(households)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(households.id, context.household.id));
    }

    return NextResponse.json({
      ok: true,
      savedForFuture: saveForFuture,
      paymentMethod: {
        id: paymentMethodId,
        brand: card?.brand ?? null,
        last4: card?.last4 ?? null,
      },
    });
  } catch (error) {
    console.warn("[billing/confirm-method] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to confirm payment method" }, { status: 500 });
  }
}
