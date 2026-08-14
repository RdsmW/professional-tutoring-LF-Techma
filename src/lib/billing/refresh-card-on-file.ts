import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households } from "@/lib/db/schema";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export type CardOnFile = {
  stripeCustomerId: string | null;
  stripeDefaultPaymentMethodId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardOnFile: boolean;
};

/**
 * Refresh denormalized card brand/last4 from Stripe when the household has a
 * customer (and preferably a default payment method). Soft-fails to DB values.
 */
export async function refreshCardOnFile(householdId: string): Promise<CardOnFile> {
  const database = requireDb();
  const [household] = await database
    .select({
      id: households.id,
      stripeCustomerId: households.stripeCustomerId,
      stripeDefaultPaymentMethodId: households.stripeDefaultPaymentMethodId,
      cardBrand: households.cardBrand,
      cardLast4: households.cardLast4,
    })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household) {
    return {
      stripeCustomerId: null,
      stripeDefaultPaymentMethodId: null,
      cardBrand: null,
      cardLast4: null,
      cardOnFile: false,
    };
  }

  const asCard = (row: typeof household): CardOnFile => ({
    stripeCustomerId: row.stripeCustomerId,
    stripeDefaultPaymentMethodId: row.stripeDefaultPaymentMethodId,
    cardBrand: row.cardBrand,
    cardLast4: row.cardLast4,
    cardOnFile: Boolean(row.stripeDefaultPaymentMethodId && row.cardLast4),
  });

  if (!household.stripeCustomerId || !isStripeConfigured()) {
    return asCard(household);
  }

  try {
    const stripe = getStripe()!;
    let paymentMethodId = household.stripeDefaultPaymentMethodId;

    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(household.stripeCustomerId);
      if (customer.deleted) {
        return asCard(household);
      }
      const defaultPm = customer.invoice_settings?.default_payment_method;
      paymentMethodId =
        typeof defaultPm === "string" ? defaultPm : defaultPm?.id ?? null;
    }

    if (!paymentMethodId) {
      const listed = await stripe.paymentMethods.list({
        customer: household.stripeCustomerId,
        type: "card",
        limit: 1,
      });
      paymentMethodId = listed.data[0]?.id ?? null;
    }

    if (!paymentMethodId) {
      if (household.cardBrand || household.cardLast4 || household.stripeDefaultPaymentMethodId) {
        const [cleared] = await database
          .update(households)
          .set({
            stripeDefaultPaymentMethodId: null,
            cardBrand: null,
            cardLast4: null,
            updatedAt: new Date(),
          })
          .where(eq(households.id, householdId))
          .returning({
            stripeCustomerId: households.stripeCustomerId,
            stripeDefaultPaymentMethodId: households.stripeDefaultPaymentMethodId,
            cardBrand: households.cardBrand,
            cardLast4: households.cardLast4,
          });
        return asCard({ id: householdId, ...cleared });
      }
      return asCard(household);
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const brand = paymentMethod.card?.brand ?? null;
    const last4 = paymentMethod.card?.last4 ?? null;

    if (
      brand === household.cardBrand &&
      last4 === household.cardLast4 &&
      paymentMethodId === household.stripeDefaultPaymentMethodId
    ) {
      return asCard(household);
    }

    const [updated] = await database
      .update(households)
      .set({
        stripeDefaultPaymentMethodId: paymentMethodId,
        cardBrand: brand,
        cardLast4: last4,
        updatedAt: new Date(),
      })
      .where(eq(households.id, householdId))
      .returning({
        stripeCustomerId: households.stripeCustomerId,
        stripeDefaultPaymentMethodId: households.stripeDefaultPaymentMethodId,
        cardBrand: households.cardBrand,
        cardLast4: households.cardLast4,
      });

    return asCard({ id: householdId, ...updated });
  } catch (error) {
    console.warn("[refresh-card-on-file] soft-fail", error);
    return asCard(household);
  }
}
