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

function derivedCardOnFile(row: {
  cardOnFile?: boolean;
  stripeDefaultPaymentMethodId: string | null;
  cardLast4: string | null;
}): boolean {
  const hasStripeCard = Boolean(row.stripeDefaultPaymentMethodId && row.cardLast4);
  return Boolean(row.cardOnFile) || hasStripeCard;
}

/**
 * Refresh denormalized card brand/last4 from Stripe when the household has a
 * customer (and preferably a default payment method). Soft-fails to DB values.
 * Keeps households.card_on_file in sync when Stripe confirms a payment method.
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
      cardOnFile: households.cardOnFile,
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

  const asCard = (row: {
    stripeCustomerId: string | null;
    stripeDefaultPaymentMethodId: string | null;
    cardBrand: string | null;
    cardLast4: string | null;
    cardOnFile?: boolean;
  }): CardOnFile => ({
    stripeCustomerId: row.stripeCustomerId,
    stripeDefaultPaymentMethodId: row.stripeDefaultPaymentMethodId,
    cardBrand: row.cardBrand,
    cardLast4: row.cardLast4,
    cardOnFile: derivedCardOnFile(row),
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
      // Do not invent a default card after staff cleared card-on-file
      // (cardOnFile false + no local PM/last4). List-adopt only when we already
      // believe a card should be on file or denormalized fields exist.
      const mayAdoptListedCard =
        Boolean(household.cardOnFile) ||
        Boolean(household.cardBrand) ||
        Boolean(household.cardLast4) ||
        Boolean(household.stripeDefaultPaymentMethodId);
      if (mayAdoptListedCard) {
        const listed = await stripe.paymentMethods.list({
          customer: household.stripeCustomerId,
          type: "card",
          limit: 1,
        });
        paymentMethodId = listed.data[0]?.id ?? null;
      }
    }

    if (!paymentMethodId) {
      if (household.cardBrand || household.cardLast4 || household.stripeDefaultPaymentMethodId) {
        const [cleared] = await database
          .update(households)
          .set({
            stripeDefaultPaymentMethodId: null,
            cardBrand: null,
            cardLast4: null,
            cardOnFile: false,
            updatedAt: new Date(),
          })
          .where(eq(households.id, householdId))
          .returning({
            stripeCustomerId: households.stripeCustomerId,
            stripeDefaultPaymentMethodId: households.stripeDefaultPaymentMethodId,
            cardBrand: households.cardBrand,
            cardLast4: households.cardLast4,
            cardOnFile: households.cardOnFile,
          });
        return asCard({ ...cleared });
      }
      return asCard(household);
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const brand = paymentMethod.card?.brand ?? null;
    const last4 = paymentMethod.card?.last4 ?? null;

    if (
      brand === household.cardBrand &&
      last4 === household.cardLast4 &&
      paymentMethodId === household.stripeDefaultPaymentMethodId &&
      household.cardOnFile
    ) {
      return asCard(household);
    }

    const [updated] = await database
      .update(households)
      .set({
        stripeDefaultPaymentMethodId: paymentMethodId,
        cardBrand: brand,
        cardLast4: last4,
        cardOnFile: true,
        updatedAt: new Date(),
      })
      .where(eq(households.id, householdId))
      .returning({
        stripeCustomerId: households.stripeCustomerId,
        stripeDefaultPaymentMethodId: households.stripeDefaultPaymentMethodId,
        cardBrand: households.cardBrand,
        cardLast4: households.cardLast4,
        cardOnFile: households.cardOnFile,
      });

    return asCard({ ...updated });
  } catch (error) {
    console.warn("[refresh-card-on-file] soft-fail", error);
    return asCard(household);
  }
}
