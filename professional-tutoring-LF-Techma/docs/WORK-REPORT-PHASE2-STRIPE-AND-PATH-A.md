# Work Report — Phase 2 Stripe and Path A

## Executive summary

Implemented the approved Academic Year Tutoring Phase 2 billing flow and corrected the Path A finalization safety gap.

The implementation preserves the existing public intake contract:

- one public registration creates or updates one tutoring request;
- Path A can self-finalize a valid selected tutor and slot;
- Path B1 remains unbooked until Staff assignment;
- payment retries and concurrent finalization do not create duplicate charges, requests, or bookings;
- no new seat-hold or reservation system was introduced;
- Zoho, Acuity, and QuickBooks were not changed.

## Path A finalization safety

Family Path A finalization now revalidates the original selection immediately before booking:

1. The selected tutor is still active.
2. The tutor still teaches the request’s primary subject.
3. The selected slot is still within the original schedule window.
4. The selected slot still has available capacity.

These checks apply only to family self-service Path A assignments. The existing Staff assignment path remains unchanged.

Concurrent finalization is idempotent. If two requests attempt to finalize the same valid Path A continuation, the existing booking for that tutoring request is reused rather than creating a second booking.

## Academic Year payment schedules

The existing pricing rules were retained and converted into persisted fixed schedules:

| Plan | Installments |
| --- | ---: |
| Full Year | 1 |
| Semester | 2 |
| Monthly | 10 |

Each installment stores its own due date, amount, sequence number, schedule identifier, payment state, and price snapshot. The initial continuation is associated only with the first installment.

The plans use bounded application-owned schedules and server-side off-session PaymentIntents for future collection. They are not modeled as open-ended Stripe Subscriptions.

## Public payment flow

The public Academic Year payment flow now supports:

- payment continuation tokens that are bound to the request and household;
- one-time continuation consumption;
- Stripe Customer and payment-method ownership checks;
- initial PaymentIntent capture with a stable idempotency key;
- propagation of saved-card authorization to future installments;
- retry-safe completion after refreshes or repeated requests;
- preservation of the existing Path B1 behavior, with payment before later Staff assignment.

For Path A, booking reuse and payment finalization are coordinated so a successful payment cannot create a duplicate reservation.

## Stripe reconciliation

Added server-side reconciliation for PaymentIntents, SetupIntents, and Stripe webhook events.

The webhook implementation:

- reads and verifies the raw Stripe request body;
- deduplicates webhook events;
- applies monotonic payment-state transitions;
- reconciles successful, failed, and canceled payment states;
- can resume a Path A booking that was already created while payment completion was pending;
- does not create bookings or capture payments by itself.

## Scheduled collection

Added the application-side scheduled collection capability:

- due-installment selection is atomic;
- existing PaymentIntents are reused when possible;
- each installment uses a stable idempotency key;
- successful collections update the internal payment record;
- failed collections record the Stripe error and retry state;
- a protected internal API route exposes the collector;
- a runnable server script is available for external scheduling.

The implementation exposes the required configuration points without changing or displaying environment secrets. Production scheduler activation and live Stripe webhook configuration are operational settings outside the code changes in this report.

## Database and migration

Added the Phase 2 billing fields and indexes to the application schema, including:

- installment schedule identifiers and sequence values;
- due dates and collection attempt state;
- Stripe error details;
- continuation-consumption state;
- webhook event journal data;
- uniqueness protections for installment and webhook replay behavior.

The dedicated development migration was applied successfully:

`drizzle/0024_ay_billing_phase2.sql`

## Main implementation areas

- `src/lib/booking/assign-tutoring-request.ts`
- `src/lib/public-intake/ay-tutoring-payment.ts`
- `src/lib/public-intake/ay-tutoring-payment-flow.ts`
- `src/lib/stripe/reconcile-payment.ts`
- `src/lib/stripe/collect-due-ay-installments.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/internal/billing/collect-due/route.ts`
- `scripts/collect-due-ay-installments.mts`
- `src/components/public-ay-tutoring-payment-panel.tsx`
- `src/lib/db/schema.ts`
- `drizzle/0024_ay_billing_phase2.sql`

## Verification reference

Verification evidence is maintained separately, in accordance with the project’s implementation/verification separation:

`docs/VERIFICATION-PHASE2-STRIPE-AND-PATH-A.md`
