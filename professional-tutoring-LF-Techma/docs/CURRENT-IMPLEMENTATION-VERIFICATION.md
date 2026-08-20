# Current implementation verification

**Date:** 2026-08-20  
**Scope:** Read-only verification of the current codebase against:

- `docs/PHASE-1-GUIDANCE.md`
- `docs/PHASE-2-STRIPE-IMPLEMENTATION-PLAN.md`
- the approved Path B policy, **Option B1** (payment or card setup before staff assignment)

## Verification method and limits

No application code, schema, migration, configuration, Stripe object, or database
record was changed for this verification. This report is the only file created.

### Checks run

| Check | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Passed | Static TypeScript check completed without output. |
| Targeted ESLint on the public payment, schedule, booking, public payment routes, and public registration E2E file | Passed | Completed without output. |
| Read-only Playwright checks for public page load, client validation display, and family portal protection | Blocked | Playwright timed out waiting 120 seconds for its configured `webServer` before executing the tests. No application scenario ran and no test data was created. |
| Source scan for payment routes, Stripe lifecycle APIs, webhooks, Products, Prices, Subscriptions, Schedules, Zoho, Acuity, and QuickBooks calls | Completed | Evidence recorded below. |

### Important verification limits

- No live Stripe PaymentIntent, SetupIntent, capture, webhook, Product, Price,
  Subscription, or Schedule operation was performed.
- No database migration was applied or inspected through a database connection.
- No API acceptance scenario that creates a household, request, payment record,
  booking, or seat claim was run. This avoids changing project data while the
  instruction to stop implementation is in effect.
- Therefore, a source-level implementation can be classified as implemented,
  but it is not classified as behaviorally verified unless a safe test or direct
  source scan proves the requested invariant.

## Phase 2 verification matrix

| Expected item | Current status | Evidence: current implementation | Match to approved plan | Test evidence, limitations, and risks |
| --- | --- | --- | --- | --- |
| Stripe Customer creation and reuse | **Implemented but not verified** | `src/lib/public-intake/ay-tutoring-payment-flow.ts` reuses `households.stripeCustomerId`; otherwise it creates a Stripe Customer from the request billing data and persists the ID. It also retrieves the submitted PaymentMethod, checks that it belongs to that Customer, sets it as default, and stores card metadata on the household. | Matches the plan’s shared Customer reuse and payment-method ownership requirements. | No Stripe mock, concurrency test, or live Stripe verification exists. Two simultaneous first-time continuations could both observe no customer ID and create separate Customers. |
| Public payment continuation and security | **Partially implemented** | `src/lib/public-intake/ay-tutoring-payment.ts` creates a random 32-byte token, stores only its SHA-256 hash, and gives it a 30-minute expiry. The lookup is hash- and expiry-based. `src/lib/public-intake/ay-tutoring-payment-flow.ts` loads the related request and household server-side and verifies their relationship. | Largely follows the plan’s rule that public endpoints use a scoped continuation rather than client-supplied household or Customer IDs. | The token is not atomically consumed or marked one-time. There is no explicit server-side replay claim. The amount, schedule, and Customer association are read from server-side records rather than cryptographically bound in a signed token. No expiry, tampering, or replay security test exists. |
| PaymentIntent behavior for an amount due now | **Implemented but not verified** | `src/lib/public-intake/ay-tutoring-payment-flow.ts` creates/reuses a Stripe PaymentIntent with the payment record amount, Customer, `capture_method: "manual"`, `setup_future_usage: "off_session"`, metadata, and a Stripe idempotency key. Finalization retrieves the PaymentIntent server-side, checks its ID, metadata, amount, and `requires_capture` state before capture. | Strong source-level match for authorization before booking and capture after the booking transaction. | No live Stripe/browser confirmation or 3-D Secure test was run. No test proves a capture result from Stripe. |
| SetupIntent and card-on-file behavior | **Implemented but not verified** | The same flow creates/reuses a `SetupIntent` with `usage: "off_session"` for a future-due card. Finalization verifies the exact SetupIntent, succeeded status, metadata, Customer, and PaymentMethod before saving the default card. | Matches the required card-on-file path. | No Stripe integration test proves the SetupIntent lifecycle or persistence of the resulting card details. |
| Full Year calculation | **Partially implemented** | `src/lib/pricing/academic-year-payment-schedule.ts` calculates one installment of `10 × monthly amount`, with a 10% discount and a September 1 due date. `src/lib/public-intake/ay-tutoring-payment.ts` snapshots the computed installment in a price snapshot and payment record. | The calculation itself matches the approved mapping. | No one-time Stripe Product/Price is created or linked. No automated calculation test or proof that no later charge is created exists. |
| Semester calculation | **Partially implemented** | The schedule helper creates two equal installments of `5 × monthly amount`, with a 5% discount, due September 1 and February 1. The schedule is stored in payment-record notes and the price snapshot. | The calculation matches the approved two-installment amounts and due dates. | No Stripe two-cycle schedule, Subscription Schedule, recurring Price, or separate future payment obligation rows are created. No calculation test exists. |
| Monthly calculation | **Partially implemented** | The schedule helper creates ten monthly installments from September through June. | The internal installment calculation matches the approved term length. | No Stripe monthly Subscription/Schedule, end-of-term collection limit, or future `payment_records` rows are created. No calculation test exists. |
| Auto-charge = Yes | **Partially implemented** | A card is required for this path. The Customer default PaymentMethod, `cardOnFile`, `autoCharge`, and payment-method consent fields are stored in `ay-tutoring-payment-flow.ts`. The first currently due payment uses PaymentIntent flow; a future-due payment uses SetupIntent flow. | Matches the first-payment/card-on-file portion of the plan. | The plan also requires creating the applicable recurring or scheduled billing only after successful first payment/setup. No Product, Price, Subscription, Schedule, or later automatic collection creation is implemented. The exact Phase 2 consent copy/version is not demonstrated by tests. |
| Auto-charge = No / manual payment | **Partially implemented** | Continuation creation stores an unpaid payment record and alternate method. Finalization marks setup complete; for Path A it creates a `pending_payment` booking, and for Path B it leaves the request unbooked. No PaymentIntent or off-session collection is created in the manual finalization branch. | The no-automatic-charge intent matches the plan. | `prepareAyPublicPayment` checks `isStripeConfigured()` before returning the manual result, so a manual-payment journey is currently unavailable when Stripe is not configured even though it does not require a Stripe charge. No later manual obligation rows are created for Semester or Monthly. No manual billing workflow acceptance test was run. |
| Path A: payment/setup → revalidation → same request → one booking → one seat | **Implemented but not verified** | The registration retains the selected preferred slot. `ay-tutoring-payment-flow.ts` calls `assignTutoringRequest` for that same request. `src/lib/booking/assign-tutoring-request.ts` performs an atomic slot-capacity update, updates the existing request, inserts one booking, and increments one booked seat. PaymentIntent flow creates a temporary `pending_payment` booking before capture, then confirms it after successful capture. | This is the intended Phase 2 Path A design and does not introduce a new hold/reservation system. | Existing E2E source covers only the manual path, not real Stripe authorization/capture. The assignment primitive checks slot ID, tutor ID, active status, and capacity, but does not visibly re-check the request subject against the slot/tutor relationship or a schedule-window compatibility rule. |
| Path A: payment or booking failure handling | **Partially implemented** | If assignment fails after authorization, the code cancels the PaymentIntent. If capture fails, it deletes the temporary booking, decrements `bookedSeats`, restores the request to `pending_staff_review`, marks the payment record failed, and cancels the intent. | The intended compensation pattern is present. | No failure-injection, Stripe cancellation, revalidation failure, or capture-failure test exists. The resulting request status is `pending_staff_review`, which should be confirmed against the desired Path A retry experience. |
| Path B, Option B1: payment/payment setup before staff assignment | **Implemented but not verified** | The public registration creates a payment continuation for Path B. Payment/SetupIntent finalization for `pt_chooses` completes payment or card setup without creating a booking. `assignTutoringRequest` blocks a staff assignment when the related payment is neither paid nor setup-complete. | Matches approved Option B1: payment-cleared but unbooked before staff chooses tutor and slot. | No authenticated staff end-to-end test proves the gate, no-booking state before assignment, or post-assignment seat result. |
| Path B staff assignment updates the same request and creates only one booking | **Implemented but not verified** | `src/app/api/staff/tutoring-requests/[id]/assign/route.ts` uses `assignTutoringRequest`. That helper updates the original request ID and inserts the booking with that request ID. It rejects an existing occupying booking. | Matches the same-request / exactly-one-booking requirement in source. | No database uniqueness constraint or concurrency/replay test proves the invariant under simultaneous requests. The Phase 1 Scenario C acceptance test has not been run. |
| Stripe webhooks | **Not implemented** | No Stripe webhook route was found under `src/app/api`, and no code references signature verification, `constructEvent`, `payment_intent` events, `invoice.paid`, failed invoice/payment events, or subscription end/cancellation reconciliation. | Does not match the approved plan. | This is a functional gap: synchronous browser finalization is not a substitute for verified webhook reconciliation. |
| Webhook and payment idempotency | **Partially implemented** | Stripe creation requests use idempotency keys. The finalize function returns existing completion state for some repeated manual or confirmed-booking requests. The public E2E source includes one manual Path A replay assertion. | Only partial match. | There is no atomic one-time continuation claim, no idempotency key on capture, no webhook idempotency, no deduplication guarantee for first payment records, and no duplicate Subscription protection because subscriptions are absent. |
| `payment_records` behavior | **Implemented but not verified** | `src/lib/db/schema.ts` includes amount, status, related entity, Stripe PaymentIntent/SetupIntent/Subscription/Customer IDs, due date, payment setup completion, token hash/expiry, and paid timestamp. Continuation creation creates the first row and records the schedule snapshot in notes. | Covers the initial payment-record model from the plan. | No future payment-record rows are generated for Semester/Monthly. No webhook reconciliation exists. No DB-level uniqueness proof for a single first payment record was found. |
| Database migrations/schema changes | **Implemented but not verified** | `drizzle/0022_academic_year_payment_schedule.sql` adds due date, SetupIntent ID, Subscription ID, and setup-completion fields. `drizzle/0023_public_payment_continuations.sql` adds continuation token hash/expiry and an index. `src/lib/db/schema.ts` maps these fields. | Covers part of the approved minimal database changes. | No `stripe_price_id` mapping exists on an Academic Tutoring price-book line. No migration application/status was verified against a live database. |
| Stripe Products, Prices, Subscriptions, and Schedules | **Not implemented** | No code references `stripe.products.create`, `stripe.prices.create`, `stripe.subscriptions`, `subscriptionSchedules`, or a `stripe_price_id` mapping. A `stripeSubscriptionId` column exists but no lifecycle uses it. | Does not match the approved plan for Full Year Price mapping, Semester schedule, or Monthly recurring term. | This prevents Phase 2 recurring billing acceptance. |
| Phase 1 public request creation and selected-slot behavior | **Implemented differently from the original Phase 1 boundary** | `src/lib/public-intake/ay-tutoring-registration.ts` remains the public request creator. The existing E2E source asserts Path B has no preferred slot and Path A returns the selected preferred slot. Phase 2 then creates a payment continuation and first payment record after request creation. | This is an intentional Phase 2 extension of the Phase 1 request-only submission boundary, not a new unrelated flow. | Original Phase 1 acceptance expected no payment record at public submission. Phase 2 explicitly requires an initial payment record/continuation, so this requirement is intentionally superseded. The initial request/no-seat/no-booking state was not re-verified through a live database query. |
| Phase 1 A/B/C acceptance evidence and safeguards | **Partially implemented** | `e2e/public-ay-registration.spec.ts` covers page load, client-side required-field display, a Path B manual continuation with no booking, and a Path A manual continuation with replay behavior. The payload includes an explicit primary subject. | Some code and test coverage remain aligned with Phase 1. | The E2E scenarios do not report database record counts, before/after booked and held seat counts, payment-record counts, or staff Path B Scenario C. They can skip when a database, tutor, or slot is unavailable; they were not executed in this verification because Playwright could not start its configured web server. |
| Zoho, Acuity, and QuickBooks remain untouched by Phase 2 | **Implemented and verified** | Source scans found only pre-existing local Zoho ID/URL fields and integration-placeholder UI. No Zoho API client, Acuity client, QuickBooks client, webhook, environment variable, or outbound integration call was found in the Phase 2 payment code. | Matches the explicit Phase 1 and Phase 2 non-goals. | This is source-level verification only; it does not compare against external system logs or historical commits. |

## What is actually complete

- Public Academic Year payment continuation records, expiry handling, and
  server-side request/household lookup exist.
- Stripe Customer creation/reuse, PaymentMethod ownership checking, manual-capture
  PaymentIntent creation, and SetupIntent creation exist in source.
- Internal Full Year, Semester, and Monthly installment calculations exist and
  are placed in a price snapshot/payment-record context.
- The payment gate for Path B Option B1 exists in the common assignment primitive.
- Path A uses the existing atomic booking primitive and includes source-level
  cancellation/compensation logic around a PaymentIntent capture failure.
- Required schema and migration files for the continuation and several payment
  fields exist.
- No Phase 2 code introduces Zoho, Acuity, or QuickBooks calls.

## What is still missing

- Verified Stripe webhook endpoint and reconciliation for payment success/failure,
  invoices, and subscription end/cancellation.
- Stripe Product and Price creation/mapping for Academic Year rate lines.
- Full Year one-time Price handling and verified no-recurring behavior.
- Semester scheduled collection and Monthly recurring collection that stop at the
  end of the Academic Year.
- Future payment-record obligations and reconciliation for later Semester/Monthly
  installments.
- Atomic one-time consumption/replay protection for the public continuation.
- Acceptance tests for Customer reuse/ownership, PaymentIntent confirmation and
  capture, SetupIntent, failure compensation, webhook processing, pricing
  mappings, and recurring collection.
- An authenticated staff Scenario C test proving that Path B B1 updates the
  original request and consumes one seat only after its payment gate is met.
- Database-backed evidence for migration application, booking counts, payment
  counts, and seat counts.

## Deviations from the approved plan

1. **Recurring Stripe billing is absent.** The current schedule helper computes
   Full Year, Semester, and Monthly installments internally, but it does not
   create or reference Stripe Products, Prices, Subscriptions, or Schedules.
2. **Webhook reconciliation is absent.** Final payment state is based on the
   synchronous finalization route; the approved plan requires verified webhooks
   for durable Stripe truth and future billing.
3. **Continuation replay protection is incomplete.** The token is secret,
   hashed, and expired, but not consumed atomically as a one-time capability.
4. **Manual payment unnecessarily depends on Stripe configuration at prepare
   time.** The manual branch itself does not call Stripe, but the pre-branch
   `isStripeConfigured()` check prevents it from being prepared if Stripe is
   unavailable.
5. **The original Phase 1 “no payment record on initial submission” condition is
   intentionally changed by Phase 2.** The current public submission creates
   the first payment record and continuation as required by the Phase 2 plan.

## Regressions or risks found

- **High:** Without webhooks and recurring lifecycle code, successful, failed,
  later, or externally changed Stripe payments cannot be reconciled reliably.
- **High:** Semester and Monthly plans do not create future Stripe collections,
  so their advertised schedule is only a stored internal snapshot.
- **Medium:** A continuation token can be replayed until expiry. Existing state
  checks reduce some duplicate effects, but they are not a universal atomic
  one-time guard.
- **Medium:** Customer creation/reuse is not protected against concurrent
  first-time continuations for the same household.
- **Medium:** The booking assignment primitive’s atomic capacity check is clear,
  but source inspection did not establish a full request-subject/tutor/slot and
  schedule-window compatibility revalidation at final Path A assignment.
- **Medium:** The manual payment route is gated by Stripe configuration before
  it returns its manual result.
- **Verification risk:** The current Playwright configuration timed out while
  waiting for its own web server, so the included browser checks did not run.
  No live Stripe or database scenario result should be inferred from this report.

## Recommended next action

Do **not** mark Phase 2 as complete. Resolve the verification blockers before
adding unrelated work:

1. Decide and implement the missing Stripe recurring model (Price mapping,
   Semester schedule, Monthly term-limited collection).
2. Add verified Stripe webhooks and idempotent reconciliation.
3. Make the continuation one-time and add end-to-end tests for retries,
   captures, compensation, and Path B staff assignment.
4. Restore a reliable non-mutating Playwright execution path, then run the
   approved database-backed A/B/C acceptance evidence in a controlled test
   environment.

**Stop point:** This report makes no implementation changes or fixes.