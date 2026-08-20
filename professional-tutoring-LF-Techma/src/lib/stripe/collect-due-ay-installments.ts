import Stripe from "stripe";
import { and, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, paymentRecords } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { reconcilePaymentIntentSucceeded } from "@/lib/stripe/reconcile-payment";

const COLLECTION_STATUSES = ["pending"] as const;

function retryAt(now: Date) {
  return new Date(now.getTime() + 60 * 60 * 1000);
}

function failureCode(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) return error.code ?? error.type;
  return "collection_error";
}

export async function collectDueAcademicYearInstallments(input?: { now?: Date; limit?: number }) {
  const now = input?.now ?? new Date();
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 100);
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const database = requireDb();
  const dueRows = await database
    .select({
      payment: paymentRecords,
      customerId: households.stripeCustomerId,
      paymentMethodId: households.stripeDefaultPaymentMethodId,
    })
    .from(paymentRecords)
    .innerJoin(households, eq(households.id, paymentRecords.householdId))
    .where(
      and(
        eq(paymentRecords.relatedEntityType, "tutoring_request"),
        isNotNull(paymentRecords.billingScheduleId),
        isNotNull(paymentRecords.paymentSetupCompletedAt),
        inArray(paymentRecords.status, [...COLLECTION_STATUSES]),
        lte(paymentRecords.dueAt, now),
        or(isNull(paymentRecords.nextCollectionAttemptAt), lte(paymentRecords.nextCollectionAttemptAt, now)),
      ),
    )
    .limit(limit);

  const result = { examined: dueRows.length, collected: 0, failed: 0, deferred: 0 };
  for (const row of dueRows) {
    const [claimed] = await database
      .update(paymentRecords)
      .set({
        collectionAttempts: sql`${paymentRecords.collectionAttempts} + 1`,
        lastCollectionAttemptAt: now,
        nextCollectionAttemptAt: retryAt(now),
        updatedAt: now,
      })
      .where(
        and(
          eq(paymentRecords.id, row.payment.id),
          inArray(paymentRecords.status, [...COLLECTION_STATUSES]),
          or(isNull(paymentRecords.nextCollectionAttemptAt), lte(paymentRecords.nextCollectionAttemptAt, now)),
        ),
      )
      .returning();
    if (!claimed) {
      result.deferred += 1;
      continue;
    }

    if (!row.customerId || !row.paymentMethodId) {
      await database
        .update(paymentRecords)
        .set({
          status: "failed",
          stripeFailureCode: "missing_payment_method",
          nextCollectionAttemptAt: null,
          updatedAt: new Date(),
        })
        .where(eq(paymentRecords.id, claimed.id));
      result.failed += 1;
      continue;
    }

    try {
      const intent = claimed.stripePaymentIntentId
        ? await stripe.paymentIntents.retrieve(claimed.stripePaymentIntentId)
        : await stripe.paymentIntents.create(
            {
              amount: claimed.amountCents,
              currency: claimed.currency.toLowerCase(),
              customer: row.customerId,
              payment_method: row.paymentMethodId,
              confirm: true,
              off_session: true,
              metadata: {
                householdId: claimed.householdId,
                paymentRecordId: claimed.id,
                tutoringRequestId: claimed.relatedEntityId ?? "",
                billingScheduleId: claimed.billingScheduleId ?? "",
                installmentSequence: String(claimed.installmentSequence ?? ""),
                flow: "academic_year_scheduled_collection",
              },
            },
            { idempotencyKey: `ay-scheduled-collection-${claimed.id}` },
          );

      if (!claimed.stripePaymentIntentId) {
        await database
          .update(paymentRecords)
          .set({ stripePaymentIntentId: intent.id, stripeCustomerId: row.customerId, updatedAt: new Date() })
          .where(eq(paymentRecords.id, claimed.id));
      }

      if (intent.status === "succeeded") {
        await reconcilePaymentIntentSucceeded(intent);
        result.collected += 1;
      } else {
        await database
          .update(paymentRecords)
          .set({
            status: "failed",
            stripeFailureCode: intent.last_payment_error?.code ?? `payment_intent_${intent.status}`,
            nextCollectionAttemptAt: null,
            updatedAt: new Date(),
          })
          .where(eq(paymentRecords.id, claimed.id));
        result.failed += 1;
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.type === "StripeCardError") {
        await database
          .update(paymentRecords)
          .set({
            status: "failed",
            stripeFailureCode: failureCode(error),
            nextCollectionAttemptAt: null,
            updatedAt: new Date(),
          })
          .where(eq(paymentRecords.id, claimed.id));
        result.failed += 1;
      } else {
        await database
          .update(paymentRecords)
          .set({
            stripeFailureCode: failureCode(error),
            nextCollectionAttemptAt: retryAt(new Date()),
            updatedAt: new Date(),
          })
          .where(eq(paymentRecords.id, claimed.id));
        result.deferred += 1;
      }
    }
  }

  return result;
}