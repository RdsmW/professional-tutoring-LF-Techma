import { eq } from "drizzle-orm";
import type { FamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { getStripe, isStripeConfigured, PAYMENT_METHOD_CONSENT_VERSION } from "@/lib/stripe/client";

export type ResolvedPaymentMethod = {
  paymentMethodId: string;
  customerId: string | null;
  methodLabel: string;
  brand: string | null;
  last4: string | null;
  savedForFuture: boolean;
};

/**
 * Resolve the card for this booking/enrollment.
 * - Prefer an explicit paymentMethodId from the wizard collect step.
 * - Else fall back to the household default on-file card.
 * - Only stamp household card-on-file when saveForFuture is true.
 */
export async function resolveFamilyPaymentMethod(
  context: FamilyContext,
  options: {
    paymentMethodId?: string | null;
    saveForFuture?: boolean;
  },
): Promise<{ ok: true; value: ResolvedPaymentMethod } | { ok: false; error: string; status: number }> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured.", status: 503 };
  }

  const paymentMethodId =
    options.paymentMethodId?.trim() || context.household.stripeDefaultPaymentMethodId || null;

  if (!paymentMethodId) {
    return {
      ok: false,
      error: "Confirm a payment method before continuing.",
      status: 400,
    };
  }

  const stripe = getStripe()!;
  let paymentMethod;
  try {
    paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch {
    return { ok: false, error: "Payment method could not be verified.", status: 400 };
  }

  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id ?? context.household.stripeCustomerId;

  if (
    context.household.stripeCustomerId &&
    customerId &&
    customerId !== context.household.stripeCustomerId
  ) {
    return {
      ok: false,
      error: "Payment method does not belong to this household.",
      status: 403,
    };
  }

  const brand = paymentMethod.card?.brand ?? null;
  const last4 = paymentMethod.card?.last4 ?? null;
  const methodLabel = `${brand || "card"} ···· ${last4 || "****"}`;
  const saveForFuture = Boolean(options.saveForFuture);
  const database = requireDb();

  if (saveForFuture && customerId) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    await database
      .update(households)
      .set({
        stripeCustomerId: customerId,
        stripeDefaultPaymentMethodId: paymentMethodId,
        cardBrand: brand,
        cardLast4: last4,
        paymentMethodConsentAt: new Date(),
        paymentMethodConsentVersion: PAYMENT_METHOD_CONSENT_VERSION,
        updatedAt: new Date(),
      })
      .where(eq(households.id, context.household.id));
  } else if (customerId && !context.household.stripeCustomerId) {
    await database
      .update(households)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(households.id, context.household.id));
  }

  return {
    ok: true,
    value: {
      paymentMethodId,
      customerId: customerId ?? null,
      methodLabel,
      brand,
      last4,
      savedForFuture: saveForFuture,
    },
  };
}
