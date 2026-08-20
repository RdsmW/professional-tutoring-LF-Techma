import Stripe from "stripe";
import { and, eq, inArray, or } from "drizzle-orm";
import { confirmPendingPaymentBooking } from "@/lib/booking/assign-tutoring-request";
import { requireDb } from "@/lib/db";
import { bookings, households, paymentRecords, stripeWebhookEvents } from "@/lib/db/schema";
import {
  isAcademicYearRegistrationPayment,
  sendAcademicYearPortalInvitations,
} from "@/lib/family/clerk-portal-invitations";
import { getStripe } from "@/lib/stripe/client";

type ReconciledPayment = typeof paymentRecords.$inferSelect;

function isUuid(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value));
}

function stripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function findPayment(
  tx: Parameters<ReturnType<typeof requireDb>["transaction"]>[0] extends (arg: infer T) => unknown ? T : never,
  input: { paymentRecordId?: string; paymentIntentId?: string; setupIntentId?: string },
) {
  const clauses = [];
  if (input.paymentIntentId) clauses.push(eq(paymentRecords.stripePaymentIntentId, input.paymentIntentId));
  if (input.setupIntentId) clauses.push(eq(paymentRecords.stripeSetupIntentId, input.setupIntentId));
  if (isUuid(input.paymentRecordId)) clauses.push(eq(paymentRecords.id, input.paymentRecordId));
  if (clauses.length === 0) return null;
  const [payment] = await tx
    .select()
    .from(paymentRecords)
    .where(or(...clauses))
    .limit(1);
  return payment ?? null;
}

async function reconcilePendingBooking(payment: ReconciledPayment) {
  if (payment.relatedEntityType !== "tutoring_request" || !payment.relatedEntityId) return;
  const [booking] = await requireDb()
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.tutoringRequestId, payment.relatedEntityId), eq(bookings.status, "pending_payment")))
    .limit(1);
  if (!booking) return;
  await confirmPendingPaymentBooking({
    requestId: payment.relatedEntityId,
    bookingId: booking.id,
  }).catch(() => undefined);
}

async function storeSetupPaymentMethod(input: {
  payment: ReconciledPayment;
  customerId: string | null;
  paymentMethodId: string | null;
}) {
  if (!input.customerId || !input.paymentMethodId) return;
  const stripe = getStripe();
  if (!stripe) return;

  const method = await stripe.paymentMethods.retrieve(input.paymentMethodId);
  if (stripeId(method.customer) !== input.customerId) return;

  const now = new Date();
  await requireDb().transaction(async (tx) => {
    await tx
      .update(households)
      .set({
        stripeCustomerId: input.customerId,
        stripeDefaultPaymentMethodId: input.paymentMethodId,
        cardBrand: method.card?.brand ?? null,
        cardLast4: method.card?.last4 ?? null,
        cardOnFile: true,
        autoCharge: true,
        paymentMethodConsentAt: now,
        updatedAt: now,
      })
      .where(eq(households.id, input.payment.householdId));
    if (input.payment.billingScheduleId) {
      await tx
        .update(paymentRecords)
        .set({ paymentSetupCompletedAt: now, updatedAt: now })
        .where(
          and(
            eq(paymentRecords.billingScheduleId, input.payment.billingScheduleId),
            inArray(paymentRecords.status, ["pending", "unpaid"]),
          ),
        );
    }
  });
}

function paymentRecordId(metadata: Stripe.Metadata | null | undefined) {
  const value = metadata?.paymentRecordId;
  return isUuid(value) ? value : undefined;
}

async function reconcilePaymentIntent(
  tx: Parameters<ReturnType<typeof requireDb>["transaction"]>[0] extends (arg: infer T) => unknown ? T : never,
  intent: Stripe.PaymentIntent,
  outcome: "paid" | "failed",
) {
  const payment = await findPayment(tx, {
    paymentRecordId: paymentRecordId(intent.metadata),
    paymentIntentId: intent.id,
  });
  if (!payment) return null;
  if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== intent.id) {
    throw new Error("Stripe payment intent does not match the recorded payment.");
  }
  if (intent.amount !== payment.amountCents || intent.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    throw new Error("Stripe payment amount does not match the recorded payment.");
  }

  const now = new Date();
  if (outcome === "paid") {
    if (payment.status === "paid" || payment.status === "refunded") return payment;
    const [updated] = await tx
      .update(paymentRecords)
      .set({
        status: "paid",
        paidAt: payment.paidAt ?? now,
        paymentSetupCompletedAt: payment.paymentSetupCompletedAt ?? now,
        stripePaymentIntentId: intent.id,
        stripeChargeId: stripeId(intent.latest_charge),
        stripeCustomerId: stripeId(intent.customer) ?? payment.stripeCustomerId,
        stripeFailureCode: null,
        nextCollectionAttemptAt: null,
        updatedAt: now,
      })
      .where(eq(paymentRecords.id, payment.id))
      .returning();
    return updated ?? payment;
  }

  if (payment.status === "paid" || payment.status === "refunded") return payment;
  const [updated] = await tx
    .update(paymentRecords)
    .set({
      status: "failed",
      stripePaymentIntentId: intent.id,
      stripeFailureCode: intent.last_payment_error?.code ?? (intent.status === "canceled" ? "canceled" : "payment_failed"),
      nextCollectionAttemptAt: null,
      updatedAt: now,
    })
    .where(eq(paymentRecords.id, payment.id))
    .returning();
  return updated ?? payment;
}

async function reconcileSetupIntent(
  tx: Parameters<ReturnType<typeof requireDb>["transaction"]>[0] extends (arg: infer T) => unknown ? T : never,
  intent: Stripe.SetupIntent,
) {
  const payment = await findPayment(tx, {
    paymentRecordId: paymentRecordId(intent.metadata),
    setupIntentId: intent.id,
  });
  if (!payment) return null;
  if (payment.stripeSetupIntentId && payment.stripeSetupIntentId !== intent.id) {
    throw new Error("Stripe setup intent does not match the recorded payment.");
  }

  const now = new Date();
  const [updated] = await tx
    .update(paymentRecords)
    .set({
      status: payment.status === "paid" ? "paid" : "pending",
      paymentSetupCompletedAt: payment.paymentSetupCompletedAt ?? now,
      stripeSetupIntentId: intent.id,
      stripeCustomerId: stripeId(intent.customer) ?? payment.stripeCustomerId,
      updatedAt: now,
    })
    .where(eq(paymentRecords.id, payment.id))
    .returning();
  const reconciled = updated ?? payment;

  if (reconciled.billingScheduleId) {
    await tx
      .update(paymentRecords)
      .set({ paymentSetupCompletedAt: now, updatedAt: now })
      .where(
        and(
          eq(paymentRecords.billingScheduleId, reconciled.billingScheduleId),
          inArray(paymentRecords.status, ["pending", "unpaid"]),
        ),
      );
  }
  return reconciled;
}

export async function reconcilePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const database = requireDb();
  const payment = await database.transaction((tx) => reconcilePaymentIntent(tx, intent, "paid"));
  if (payment) await reconcilePendingBooking(payment);
  return payment;
}

export async function reconcileStripeWebhookEvent(event: Stripe.Event) {
  const database = requireDb();
  let completedBookingFor: ReconciledPayment | null = null;
  let setupPayment: ReconciledPayment | null = null;

  await database.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(stripeWebhookEvents)
      .values({
        id: event.id,
        eventType: event.type,
        stripeObjectId: "id" in event.data.object ? event.data.object.id : null,
      })
      .onConflictDoNothing()
      .returning({ id: stripeWebhookEvents.id });
    if (!inserted) return;

    if (event.type === "payment_intent.succeeded") {
      completedBookingFor = await reconcilePaymentIntent(tx, event.data.object as Stripe.PaymentIntent, "paid");
    } else if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
      await reconcilePaymentIntent(tx, event.data.object as Stripe.PaymentIntent, "failed");
    } else if (event.type === "setup_intent.succeeded") {
      setupPayment = await reconcileSetupIntent(tx, event.data.object as Stripe.SetupIntent);
    }
  });

  const reconciledPayment = completedBookingFor as ReconciledPayment | null;
  const reconciledSetup = setupPayment as ReconciledPayment | null;
  if (reconciledPayment) {
    await reconcilePendingBooking(reconciledPayment);
    if (isAcademicYearRegistrationPayment(reconciledPayment)) {
      await sendAcademicYearPortalInvitations({ householdId: reconciledPayment.householdId }).catch((error) => {
        console.warn("[stripe-reconcile] Clerk Academic Year invitation soft-fail", error);
      });
    }
  }
  if (reconciledSetup) {
    const setupIntent = event.data.object as Stripe.SetupIntent;
    await storeSetupPaymentMethod({
      payment: reconciledSetup,
      customerId: stripeId(setupIntent.customer),
      paymentMethodId: stripeId(setupIntent.payment_method),
    });
    if (isAcademicYearRegistrationPayment(reconciledSetup)) {
      await sendAcademicYearPortalInvitations({ householdId: reconciledSetup.householdId }).catch((error) => {
        console.warn("[stripe-reconcile] Clerk Academic Year invitation soft-fail", error);
      });
    }
  }
}