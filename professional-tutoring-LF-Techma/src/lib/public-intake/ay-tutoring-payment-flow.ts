import { and, eq, inArray } from "drizzle-orm";
import {
  AssignTutoringRequestError,
  assignTutoringRequest,
  confirmPendingPaymentBooking,
  releasePendingPaymentBooking,
} from "@/lib/booking/assign-tutoring-request";
import { requireDb } from "@/lib/db";
import { availabilitySlots, bookings, households, paymentRecords, tutoringRequests } from "@/lib/db/schema";
import { sendAcademicYearPortalInvitations, type PortalInvitationDelivery } from "@/lib/family/clerk-portal-invitations";
import { findAyPublicPaymentContinuation } from "@/lib/public-intake/ay-tutoring-payment";
import { syncAcademicYearAfterFinalization } from "@/lib/zoho/academic-year";
import {
  getStripe,
  getStripePublishableKey,
  isStripeConfigured,
  PAYMENT_METHOD_CONSENT_VERSION,
} from "@/lib/stripe/client";

const ACTIVE_BOOKING_STATUSES = ["held", "pending_payment", "pending_staff_review", "confirmed"] as const;

type PaymentNotes = {
  source?: string;
  schedulingPath?: "family_selected" | "pt_chooses";
  autoCharge?: "yes" | "no";
};

type PaymentContext = {
  payment: typeof paymentRecords.$inferSelect;
  request: typeof tutoringRequests.$inferSelect;
  household: typeof households.$inferSelect;
  notes: Required<Pick<PaymentNotes, "schedulingPath" | "autoCharge">>;
};

export class AyPublicPaymentError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "invalid_payment") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function parsePaymentNotes(value: string | null): PaymentContext["notes"] {
  try {
    const parsed = asRecord(value ? JSON.parse(value) : null);
    const schedulingPath = parsed.schedulingPath;
    const autoCharge = parsed.autoCharge;
    if (
      (schedulingPath === "family_selected" || schedulingPath === "pt_chooses") &&
      (autoCharge === "yes" || autoCharge === "no")
    ) {
      return { schedulingPath, autoCharge };
    }
  } catch {
    // The generic error below keeps malformed internal metadata private.
  }
  throw new AyPublicPaymentError("This payment session is no longer available.", 409, "invalid_payment_session");
}

async function loadContext(token: string): Promise<PaymentContext> {
  const payment = await findAyPublicPaymentContinuation(token);
  if (!payment || payment.relatedEntityType !== "tutoring_request" || !payment.relatedEntityId) {
    throw new AyPublicPaymentError("This payment session has expired. Please restart registration.", 410, "expired");
  }
  const database = requireDb();
  const [request] = await database
    .select()
    .from(tutoringRequests)
    .where(eq(tutoringRequests.id, payment.relatedEntityId))
    .limit(1);
  const [household] = await database
    .select()
    .from(households)
    .where(eq(households.id, payment.householdId))
    .limit(1);
  if (!request || !household || request.householdId !== household.id) {
    throw new AyPublicPaymentError("This payment session is no longer available.", 410, "expired");
  }
  return { payment, request, household, notes: parsePaymentNotes(payment.notes) };
}

function billingDetails(request: typeof tutoringRequests.$inferSelect) {
  const payload = asRecord(request.payload);
  const billing = asRecord(payload.billingContact);
  const firstName = typeof billing.firstName === "string" ? billing.firstName : "";
  const lastName = typeof billing.lastName === "string" ? billing.lastName : "";
  return {
    name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
    email: typeof billing.email === "string" ? billing.email : undefined,
    phone: typeof billing.phone === "string" ? billing.phone : undefined,
  };
}

async function ensureStripeCustomer(context: PaymentContext) {
  const stripe = getStripe();
  if (!stripe) throw new AyPublicPaymentError("Stripe is not configured.", 503, "stripe_unavailable");
  if (context.household.stripeCustomerId) return context.household.stripeCustomerId;

  const customer = await stripe.customers.create({
    ...billingDetails(context.request),
    metadata: {
      householdId: context.household.id,
      source: "public_ay_tutoring",
    },
  });
  await requireDb()
    .update(households)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(households.id, context.household.id));
  return customer.id;
}

function asId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function storeCardOnHousehold(input: {
  householdId: string;
  customerId: string;
  paymentMethodId: string;
}) {
  const stripe = getStripe()!;
  const paymentMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId);
  const customerId = asId(paymentMethod.customer);
  if (customerId !== input.customerId) {
    throw new AyPublicPaymentError("The payment method does not match this household.", 403, "payment_mismatch");
  }
  await stripe.customers.update(input.customerId, {
    invoice_settings: { default_payment_method: input.paymentMethodId },
  });
  await requireDb()
    .update(households)
    .set({
      stripeCustomerId: input.customerId,
      stripeDefaultPaymentMethodId: input.paymentMethodId,
      cardBrand: paymentMethod.card?.brand ?? null,
      cardLast4: paymentMethod.card?.last4 ?? null,
      cardOnFile: true,
      autoCharge: true,
      paymentMethodConsentAt: new Date(),
      paymentMethodConsentVersion: PAYMENT_METHOD_CONSENT_VERSION,
      updatedAt: new Date(),
    })
    .where(eq(households.id, input.householdId));
}

async function markBillingSchedulePaymentMethodReady(payment: typeof paymentRecords.$inferSelect) {
  if (!payment.billingScheduleId) return;
  const now = new Date();
  await requireDb()
    .update(paymentRecords)
    .set({ paymentSetupCompletedAt: now, updatedAt: now })
    .where(
      and(
        eq(paymentRecords.billingScheduleId, payment.billingScheduleId),
        inArray(paymentRecords.status, ["pending", "unpaid"]),
      ),
    );
}

async function findActiveBooking(requestId: string) {
  const [booking] = await requireDb()
    .select()
    .from(bookings)
    .where(and(eq(bookings.tutoringRequestId, requestId), inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES])))
    .limit(1);
  return booking ?? null;
}

async function assignPreferredSlot(context: PaymentContext, bookingStatus: "confirmed" | "pending_payment") {
  if (!context.request.preferredSlotId) {
    throw new AyPublicPaymentError("Choose a tutor and time before completing payment.", 409, "missing_slot");
  }
  const [slot] = await requireDb()
    .select({ tutorId: availabilitySlots.tutorId })
    .from(availabilitySlots)
    .where(eq(availabilitySlots.id, context.request.preferredSlotId))
    .limit(1);
  if (!slot) {
    throw new AyPublicPaymentError("That time is no longer available. Choose another tutor and time.", 409, "slot_unavailable");
  }
  try {
    return await assignTutoringRequest({
      requestId: context.request.id,
      tutorId: slot.tutorId,
      slotId: context.request.preferredSlotId,
      bookingStatus,
    });
  } catch (error) {
    if (
      error instanceof AssignTutoringRequestError &&
      (error.code === "already_assigned" || error.code === "slot_unavailable")
    ) {
      const existing = await findActiveBooking(context.request.id);
      if (existing) {
        return {
          request: context.request,
          booking: existing,
        };
      }
    }
    throw error;
  }
}

async function confirmPendingBookingIdempotently(context: PaymentContext, bookingId: string) {
  try {
    return await confirmPendingPaymentBooking({
      requestId: context.request.id,
      bookingId,
    });
  } catch (error) {
    if (error instanceof AssignTutoringRequestError && error.code === "pending_booking_not_found") {
      const existing = await findActiveBooking(context.request.id);
      if (existing?.status === "confirmed") {
        return {
          request: context.request,
          booking: existing,
        };
      }
    }
    throw error;
  }
}

async function withPortalInvitation<T extends object>(
  context: PaymentContext,
  result: T,
  invitationOrigin: string,
) {
  let portalInvitation: PortalInvitationDelivery = {
    emailSent: false,
    emailAlreadySent: false,
    pending: false,
    failed: false,
      sentCount: 0,
      alreadySentCount: 0,
      eligibleCount: 0,
      pendingCount: 0,
      failedCount: 0,
      deliveryComplete: false,
      recipientConfigurationValid: false,
  };
  if (context.notes.autoCharge === "yes") {
    try {
      portalInvitation = await sendAcademicYearPortalInvitations({
        householdId: context.household.id,
        redirectOrigin: invitationOrigin,
      });
    } catch (error) {
      console.warn("[academic-year-payment] Clerk invitation dispatch soft-fail", error);
      portalInvitation = { ...portalInvitation, failed: true };
    }
  }
  const zohoSyncStatus = await syncAcademicYearAfterFinalization(context.request.id);
  return { ...result, portalInvitation, zohoSyncStatus };
}

export async function prepareAyPublicPayment(token: string) {
  const context = await loadContext(token);
  if (context.payment.continuationConsumedAt) {
    return { kind: "completed" as const, paymentRecordId: context.payment.id };
  }
  if (!isStripeConfigured()) {
    throw new AyPublicPaymentError("Card payment is not available right now.", 503, "stripe_unavailable");
  }
  if (context.notes.autoCharge === "no") {
    return { kind: "manual" as const, paymentRecordId: context.payment.id };
  }

  const stripe = getStripe()!;
  const customerId = await ensureStripeCustomer(context);
  const dueNow = !context.payment.dueAt || context.payment.dueAt.getTime() <= Date.now();

  if (dueNow) {
    if (context.payment.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(context.payment.stripePaymentIntentId);
      if (existing.status !== "canceled" && existing.status !== "succeeded") {
        return {
          kind: "payment_intent" as const,
          clientSecret: existing.client_secret,
          publishableKey: getStripePublishableKey(),
          paymentRecordId: context.payment.id,
          billingEmail: billingDetails(context.request).email ?? null,
        };
      }
    }
    const intent = await stripe.paymentIntents.create(
      {
        amount: context.payment.amountCents,
        currency: context.payment.currency.toLowerCase(),
        customer: customerId,
        capture_method: "manual",
        setup_future_usage: "off_session",
        automatic_payment_methods: { enabled: true },
        metadata: {
          householdId: context.household.id,
          paymentRecordId: context.payment.id,
          tutoringRequestId: context.request.id,
          flow: "public_ay_tutoring",
        },
      },
      {
        // A cancelled authorization must be replaced on retry. Including the
        // previous intent id keeps one key per attempt while preventing a
        // second intent during a single active attempt.
        idempotencyKey: `ay-public-payment-intent-${context.payment.id}-${context.payment.stripePaymentIntentId ?? "initial"}`,
      },
    );
    await requireDb()
      .update(paymentRecords)
      .set({
        stripePaymentIntentId: intent.id,
        stripeCustomerId: customerId,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(paymentRecords.id, context.payment.id));
    return {
      kind: "payment_intent" as const,
      clientSecret: intent.client_secret,
      publishableKey: getStripePublishableKey(),
      paymentRecordId: context.payment.id,
      billingEmail: billingDetails(context.request).email ?? null,
    };
  }

  if (context.payment.stripeSetupIntentId) {
    const existing = await stripe.setupIntents.retrieve(context.payment.stripeSetupIntentId);
    if (existing.status !== "canceled") {
      return {
        kind: "setup_intent" as const,
        clientSecret: existing.client_secret,
        publishableKey: getStripePublishableKey(),
        paymentRecordId: context.payment.id,
      billingEmail: billingDetails(context.request).email ?? null,
      };
    }
  }
  const intent = await stripe.setupIntents.create(
    {
      customer: customerId,
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
      metadata: {
        householdId: context.household.id,
        paymentRecordId: context.payment.id,
        tutoringRequestId: context.request.id,
        flow: "public_ay_tutoring",
      },
    },
    {
      idempotencyKey: `ay-public-setup-intent-${context.payment.id}-${context.payment.stripeSetupIntentId ?? "initial"}`,
    },
  );
  await requireDb()
    .update(paymentRecords)
    .set({
      stripeSetupIntentId: intent.id,
      stripeCustomerId: customerId,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(paymentRecords.id, context.payment.id));
  return {
    kind: "setup_intent" as const,
    clientSecret: intent.client_secret,
    publishableKey: getStripePublishableKey(),
    paymentRecordId: context.payment.id,
    billingEmail: billingDetails(context.request).email ?? null,
  };
}

export async function finalizeAyPublicPayment(input: {
  token: string;
  intentId?: string | null;
  invitationOrigin: string;
}) {
  const context = await loadContext(input.token);
  const existingBooking = await findActiveBooking(context.request.id);
  if (
    (context.notes.schedulingPath === "pt_chooses" && context.payment.paymentSetupCompletedAt) ||
    (context.notes.schedulingPath === "family_selected" && existingBooking?.status === "confirmed")
  ) {
    return withPortalInvitation(
      context,
      {
        schedulingPath: context.notes.schedulingPath,
        bookingId: existingBooking?.id ?? null,
        paymentStatus: context.payment.status,
        alreadyCompleted: true,
      },
      input.invitationOrigin,
    );
  }
  if (
    context.notes.schedulingPath === "family_selected" &&
    context.notes.autoCharge === "no" &&
    existingBooking?.status === "pending_payment"
  ) {
    return {
      schedulingPath: context.notes.schedulingPath,
      bookingId: existingBooking.id,
      paymentStatus: "unpaid",
      pendingManualPayment: true,
      alreadyCompleted: true,
    };
  }

  if (context.notes.autoCharge === "no") {
    await requireDb()
      .update(paymentRecords)
      .set({
        paymentSetupCompletedAt: new Date(),
        continuationConsumedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentRecords.id, context.payment.id));
    if (context.notes.schedulingPath === "family_selected") {
      const assignment = await assignPreferredSlot(context, "pending_payment");
      return {
        schedulingPath: context.notes.schedulingPath,
        bookingId: assignment.booking.id,
        paymentStatus: "unpaid",
        pendingManualPayment: true,
      };
    }
    return { schedulingPath: context.notes.schedulingPath, bookingId: null, paymentStatus: "unpaid" };
  }

  if (!isStripeConfigured() || !input.intentId) {
    throw new AyPublicPaymentError("Card confirmation is required.", 400, "missing_intent");
  }
  const stripe = getStripe()!;
  const dueNow = !context.payment.dueAt || context.payment.dueAt.getTime() <= Date.now();

  if (!dueNow) {
    if (context.payment.stripeSetupIntentId !== input.intentId) {
      throw new AyPublicPaymentError("Card setup does not match this payment.", 403, "payment_mismatch");
    }
    const setupIntent = await stripe.setupIntents.retrieve(input.intentId);
    if (setupIntent.status !== "succeeded") {
      throw new AyPublicPaymentError("Card setup is not complete.", 409, "setup_incomplete");
    }
    if (setupIntent.metadata?.paymentRecordId !== context.payment.id) {
      throw new AyPublicPaymentError("Card setup does not match this payment.", 403, "payment_mismatch");
    }
    const paymentMethodId = asId(setupIntent.payment_method);
    const customerId = asId(setupIntent.customer) ?? context.payment.stripeCustomerId;
    if (!paymentMethodId || !customerId) {
      throw new AyPublicPaymentError("Card setup is missing a payment method.", 409, "setup_incomplete");
    }
    await storeCardOnHousehold({ householdId: context.household.id, customerId, paymentMethodId });
    await markBillingSchedulePaymentMethodReady(context.payment);
    await requireDb()
      .update(paymentRecords)
      .set({
        paymentSetupCompletedAt: new Date(),
        continuationConsumedAt: new Date(),
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(paymentRecords.id, context.payment.id));
    if (context.notes.schedulingPath === "family_selected") {
      const assignment = await assignPreferredSlot(context, "confirmed");
      return withPortalInvitation(
        context,
        {
          schedulingPath: context.notes.schedulingPath,
          bookingId: assignment.booking.id,
          paymentStatus: "pending",
        },
        input.invitationOrigin,
      );
    }
    return withPortalInvitation(
      context,
      {
        schedulingPath: context.notes.schedulingPath,
        bookingId: null,
        paymentStatus: "pending",
      },
      input.invitationOrigin,
    );
  }

  if (context.payment.stripePaymentIntentId !== input.intentId) {
    throw new AyPublicPaymentError("Payment does not match this registration.", 403, "payment_mismatch");
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(input.intentId);
  if (
    paymentIntent.status !== "requires_capture" ||
    paymentIntent.metadata.paymentRecordId !== context.payment.id ||
    paymentIntent.amount !== context.payment.amountCents
  ) {
    throw new AyPublicPaymentError("Payment authorization is not ready.", 409, "authorization_incomplete");
  }
  const paymentMethodId = asId(paymentIntent.payment_method);
  const customerId = asId(paymentIntent.customer) ?? context.payment.stripeCustomerId;
  if (!paymentMethodId || !customerId) {
    throw new AyPublicPaymentError("Payment authorization is missing a card.", 409, "authorization_incomplete");
  }

  if (context.notes.schedulingPath === "pt_chooses") {
    const captured = await stripe.paymentIntents.capture(paymentIntent.id, {}, {
      idempotencyKey: `ay-public-capture-${context.payment.id}`,
    });
    if (captured.status !== "succeeded") {
      throw new AyPublicPaymentError("We could not complete the payment. Please try again.", 409, "capture_failed");
    }
    await storeCardOnHousehold({ householdId: context.household.id, customerId, paymentMethodId });
    await markBillingSchedulePaymentMethodReady(context.payment);
    await requireDb()
      .update(paymentRecords)
      .set({
        status: "paid",
        paidAt: new Date(),
        paymentSetupCompletedAt: new Date(),
        continuationConsumedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentRecords.id, context.payment.id));
    return withPortalInvitation(
      context,
      {
        schedulingPath: context.notes.schedulingPath,
        bookingId: null,
        paymentStatus: "paid",
      },
      input.invitationOrigin,
    );
  }

  let assignment;
  try {
    assignment = await assignPreferredSlot(context, "pending_payment");
  } catch (error) {
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    throw error;
  }
  try {
    const captured = await stripe.paymentIntents.capture(paymentIntent.id, {}, {
      idempotencyKey: `ay-public-capture-${context.payment.id}`,
    });
    if (captured.status !== "succeeded") {
      throw new Error("Stripe did not return a successful capture.");
    }
  } catch {
    await releasePendingPaymentBooking({ requestId: context.request.id, bookingId: assignment.booking.id });
    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
    await requireDb()
      .update(paymentRecords)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(paymentRecords.id, context.payment.id));
    throw new AyPublicPaymentError("We could not complete the payment. Your time was not booked.", 409, "capture_failed");
  }
  const finalized = await confirmPendingBookingIdempotently(context, assignment.booking.id);
  await storeCardOnHousehold({ householdId: context.household.id, customerId, paymentMethodId });
  await markBillingSchedulePaymentMethodReady(context.payment);
  await requireDb()
    .update(paymentRecords)
    .set({
      status: "paid",
      paidAt: new Date(),
      paymentSetupCompletedAt: new Date(),
      continuationConsumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(paymentRecords.id, context.payment.id));
  return withPortalInvitation(
    context,
    {
      schedulingPath: context.notes.schedulingPath,
      bookingId: finalized.booking.id,
      paymentStatus: "paid",
    },
    input.invitationOrigin,
  );
}

export function isAyPublicPaymentError(error: unknown): error is AyPublicPaymentError | AssignTutoringRequestError {
  return error instanceof AyPublicPaymentError || error instanceof AssignTutoringRequestError;
}