# Phase 2 — Academic Year Tutoring Stripe Implementation Plan

## Purpose

Turn the public Academic Year Tutoring **Plan** step from billing preferences into a real, secure payment step while preserving the Phase 1 intake contract:

- a public submission creates or updates **one** `tutoring_requests` record;
- Path A remains self-service: a valid selected tutor/time is revalidated and booked on that same request after payment authorization/setup;
- Path B remains a request until Professional Tutoring assigns it;
- a payment must never create a second request, a duplicate booking, or an unrequested seat reservation.

This is a plan only. It does **not** change Zoho, Acuity, QuickBooks, or any related integration.

---

## What exists today

### Current public journey

The public form records:

- `full_year`, `semester`, or `monthly`;
- a standard or advanced rate package;
- `autoCharge` preference and, when it is `no`, an alternate payment preference;
- billing contact details.

It deliberately says “You will not be charged today,” then creates a request-only record. For Path A, the selected slot is stored as `preferred_slot_id`; no booking, payment record, booked seat, or held seat is created. For Path B, no slot or tutor is stored.

### Current Stripe capability that can be reused

| Existing capability | Reuse in Phase 2 |
| --- | --- |
| Stripe client/configuration checks | Reuse `getStripe`, `isStripeConfigured`, and the existing publishable-key pattern. |
| Stripe Customer creation | Extract the Customer creation/update logic from the family SetupIntent route into a shared server-only helper. The helper must create or reuse the household’s `stripeCustomerId`. |
| SetupIntent with `usage: "off_session"` | Reuse for a card-on-file-only case: a future payment is scheduled but nothing is due today. |
| Saved-card household fields | Continue using `stripeCustomerId`, `stripeDefaultPaymentMethodId`, card brand/last four, `cardOnFile`, consent timestamp, and consent version on `households`. |
| Card confirmation safeguards | Reuse the existing checks that a SetupIntent/payment method belongs to the correct Customer and household. |
| Card refresh | Reuse `refreshCardOnFile` for family/staff views after payment setup or a replacement card. |
| Payment method resolution | Refactor `resolveFamilyPaymentMethod` into a shared helper; retain its ownership checks and default-card behavior. |
| Card UI | Reuse the saved-card display and Stripe Elements loading/error patterns from `StripeCardSaver`. Do **not** reuse it unchanged for a charge: it confirms a `SetupIntent`, not a payment. |
| Internal ledger | Reuse `payment_records` for the application’s payment status, amount, related request, Stripe Customer, PaymentIntent, and paid timestamp. |
| Price snapshots | Reuse `buildQuote` and `insertPriceSnapshot` only after extending the quote to represent a real installment schedule. |

### What does not exist today

The current Stripe code creates Customers and SetupIntents, but it does **not** create:

- Stripe PaymentIntents;
- Stripe Products or Prices;
- Stripe Subscriptions or Subscription Schedules;
- Stripe webhook handling for successful, failed, or recurring payments;
- a recurring-payment schedule;
- a Stripe Price ID reference in the application price book.

Also, the existing family billing routes require an authenticated family context. The unauthenticated public registration page must **not** call them directly or accept an arbitrary household ID.

---

## Payment model

### Price basis and guardrails

The Academic Year rate-package labels are monthly amounts and the plan labels define a September-through-June term. Phase 2 should use the selected package’s active Academic Tutoring price-book amount as the monthly base amount, `M`.

The payment flow must require an explicit, priceable rate package before it starts. It must not silently use the current quote helper’s fallback package (`std_2h`) for a charge.

Hourly package selections do not include a quantity or a fixed term total. They remain staff/manual billing until a staff-set amount exists; the public payment flow must not invent a recurring amount for them.

### Full Year / Semester / Monthly mapping

| Form value | First payment | Later payments | Stripe representation |
| --- | --- | --- | --- |
| `full_year` | One payment of `10 × M`, less the existing 10% discount, due September 1 (or immediately when overdue). | None. | One-time PaymentIntent. |
| `semester` | Fall installment of `5 × M`, less the existing 5% discount, due September 1 (or immediately when overdue). | Spring installment of the same amount due February 1. | A two-cycle, five-month Stripe billing schedule or equivalent Stripe-managed scheduled collection. |
| `monthly` | One monthly amount, `M`, due on the first monthly due date (or immediately when overdue). | The same amount on the first of each remaining month through June. | A monthly Stripe subscription/schedule that ends after the Academic Year term. |

The first payment is separate from later recurring payments:

1. **First payment:** use a PaymentIntent when an amount is currently due. It is confirmed in the browser so any required customer authentication can complete.
2. **Future payments:** use Stripe’s recurring/scheduled billing only when the family selected auto-charge and a saved card is available.
3. **Before a future due date:** collect and save the card with a SetupIntent, but do not charge early.
4. **After a due date:** create/confirm the overdue first PaymentIntent immediately rather than scheduling it in the past.

The existing quote function currently applies discounts to one base amount. Phase 2 must add an Academic Year installment-schedule calculation before creating a payment record, Price, PaymentIntent, or Subscription. It must snapshot:

- selected rate package and rate tier;
- base monthly amount;
- discount;
- each installment amount;
- due dates;
- number of installments; and
- the active price-book identifier.

### Stripe product and recurring Price setup

Stripe remains the source of truth for Stripe products, prices, customers, PaymentIntents, invoices, and subscriptions.

1. Add one app-level `stripe_price_id` reference to the appropriate active price-book line or a tightly scoped payment-plan mapping associated with that line.
2. Create/update the Stripe Products and Prices through a Stripe API script, never by inserting directly into a Stripe-owned table.
3. Create Prices that match the schedule above:
   - one-time Full Year amounts;
   - five-month Semester installments with exactly two collections;
   - monthly amounts with an Academic Year end date/collection count.
4. Keep the internal price book and the Stripe Price mapping aligned. A price-book change creates a new Stripe Price; it does not mutate a historical price.

---

## Card on file and auto-charge behavior

### Card on file

For a new public registration, collect card details through Stripe Elements and bind the resulting payment method only to the household created or safely matched by the registration workflow.

Because the public form is unauthenticated:

- do not expose or allow an anonymous visitor to select an existing saved card;
- do not call `/api/family/billing/setup-intent` or `/api/family/billing/confirm-method` directly;
- do not trust a client-supplied household ID or Stripe Customer ID.

Instead, after the public request is safely created or matched, issue a short-lived, single-purpose payment continuation token bound to:

- the tutoring request ID;
- household ID;
- amount/schedule snapshot;
- Stripe Customer ID; and
- expiration and one-time payment state.

Public payment endpoints accept only that token. They retrieve all household, request, and amount data server-side. The same server-side helpers used by the family routes perform Customer ownership checks and save card metadata.

The public payment UI should use a new PaymentIntent-based collector. It can share the existing Stripe Elements lifecycle and saved-card display code, but a real first charge needs a PaymentIntent client secret rather than `StripeCardSaver`’s SetupIntent confirmation.

### Auto-charge = Yes

1. Require a card for the payment step.
2. Save the payment method as the Stripe Customer’s default method.
3. Record renewed consent with a Phase 2 consent version whose text explicitly covers the selected schedule and off-session future charges.
4. Set `households.autoCharge = true`.
5. Confirm the currently due first payment, if any.
6. Create the applicable Stripe recurring/scheduled billing only after the first payment/card setup succeeds.

### Auto-charge = No

1. Do not create a Stripe Subscription or an off-session future charge.
2. Preserve the selected alternate payment method in the request/payment record.
3. Create the first and later internal payment records as manual/unpaid obligations at their plan due dates.
4. Staff records manual receipt, waiver, refund, or failure through the existing billing workflow; no automatic Stripe charge is attempted.
5. `households.autoCharge` remains false.

For Full Year, auto-charge has no later installment to collect. It may still save a card only when the family explicitly elects to keep one on file; it must not imply additional charges.

---

## Minimal request and payment lifecycle

### 1. Keep Phase 1 request creation intact

The public registration service remains the only creator of the Phase 1 request. It must continue to create:

- one household/student/request combination;
- `pending_staff_review` status;
- the Path A preferred slot or the Path B null slot;
- no booking at initial public submission;
- no seat increment or hold at initial public submission.

Do not replace this with the family booking endpoint. That endpoint always creates a booking, increments a seat, and writes a pending payment record, which violates the Phase 1 public-intake boundary.

### 2. Create a payment continuation after request creation

At the final public review submission:

1. Validate the complete registration and calculate the installment schedule.
2. Create/reuse the household, student, and one tutoring request exactly as Phase 1 does.
3. Create a price snapshot and the first internal `payment_records` row related to `tutoring_request`.
4. Create/reuse the Stripe Customer server-side.
5. Return a short-lived payment continuation token and either:
   - a PaymentIntent client secret when an amount is due now; or
   - a SetupIntent client secret when a card must be stored for a future due date.
6. Keep the user in the registration journey on a “Plan & payment” completion state until payment setup/collection completes.

The request may exist while payment is incomplete, but it must not be bookable or eligible for staff assignment until its required first payment state is satisfied.

### 3. Finalize only from Stripe-verified state

Add a finalization endpoint that:

1. accepts the one-time continuation token and the Stripe object ID;
2. retrieves the PaymentIntent or SetupIntent from Stripe;
3. verifies Customer/household/request metadata server-side;
4. updates the related `payment_records` row;
5. saves default-card/consent fields when appropriate;
6. creates the recurring schedule/subscription only when auto-charge is `yes`; and
7. is idempotent, so refreshes and retries cannot create duplicate payment records, subscriptions, or charges.

For real payment finality and future payments, add a minimal verified Stripe webhook route. It must reconcile:

- PaymentIntent success/failure;
- invoice paid/payment failed; and
- subscription cancellation/end.

Webhook processing updates internal payment records. It does not create bookings or reserve seats.

### 4. Atomic booking and payment safety

The existing `assignTutoringRequest` transaction is the smallest safe booking primitive available. It already:

- updates `booked_seats` only when the slot still has capacity;
- inserts one booking for the existing request; and
- rejects the operation when the selected slot is no longer open.

Extend that primitive with a self-service Path A mode rather than creating another reservation or hold system. The self-service mode must:

- read the tutor and slot stored by Path A;
- verify the request is Path A and has no occupying booking;
- verify the tutor/slot/subject relationship and current schedule window;
- use the existing atomic open-seat predicate;
- update the same request and insert exactly one booking; and
- omit staff assignment metadata because no staff assignment occurred.

For a card payment that is due now, use Stripe authorization before the database booking and capture only after the booking transaction succeeds:

1. Create a PaymentIntent with manual capture and confirm it in the browser.
2. If the selected slot is no longer open, cancel the uncaptured PaymentIntent and return a retryable “choose another time” response. No successful charge occurs.
3. If the slot is open, run the self-service assignment transaction. For the short interval before capture, use the existing `pending_payment` booking state and its existing booked-seat accounting; do not add `held_seats`, a hold table, or a new reservation model.
4. Capture the PaymentIntent only after the transaction has created the booking and consumed one seat.
5. On capture success, mark the payment paid and finalize the booking/request. On capture failure, use a compensating transaction to cancel the temporary booking, release the one seat, mark the payment failed, and leave the request retryable.

For a future-due card, a successful SetupIntent has no charge to protect. After setup, run the same self-service assignment transaction and create the future schedule. For a manual/alternate payment method, no Stripe charge occurs; use the existing internal payment state and manual-payment workflow.

This is not a new reservation/hold system. It reuses the existing `pending_payment` booking status only as a narrowly scoped, temporary state between the atomic booking transaction and Stripe capture. If the current writer cannot support this safely without introducing a separate hold mechanism, stop implementation and report that blocker before adding one.

---

## Path A: family selects tutor and time

Path A is self-service from selection through confirmation. Staff must not assign the tutor/time again.

1. The family selects the tutor/time preference and a payment plan.
2. Registration creates the request, price snapshot, payment record, and payment continuation.
3. The family completes the required first payment authorization or card-on-file setup according to the selected plan and due date.
4. The server revalidates the stored tutor, slot, subject compatibility, schedule window, and available capacity.
5. If the slot is still open, the server updates that same request, creates the booking, and consumes exactly one seat atomically.
6. For a due-now card, Stripe captures only after step 5 succeeds. A capture failure compensates the booking/seat state and leaves the request retryable.
7. The family sees confirmation only after the booking and required payment state are finalized.

If revalidation fails, the family is not successfully charged for that slot. The request remains available for choosing another tutor/time or for the separate Path A retry flow; no staff assignment is required for a valid Path A selection.

---

## Path B: one unresolved business rule

**The only unresolved business rule is when Path B payment occurs.**

Path B has no tutor or slot at public submission. Professional Tutoring must choose those later. Choose exactly one policy before implementation:

### Option B1 — payment before Professional Tutoring assigns

- Public registration follows the same Plan & payment flow as Path A.
- The family pays or places a card on file based on the selected plan before assignment.
- Staff later assigns the tutor/slot only after the payment gate is satisfied.
- The request remains payment-cleared but unbooked until staff assignment.

### Option B2 — payment after Professional Tutoring assigns

- Public registration records plan and payment preferences only.
- No public card collection, PaymentIntent, subscription, or payment record is created at registration.
- Staff assigns the same request, creating the one booking and consuming the seat.
- The family then completes payment through an authenticated family payment continuation before the booking is treated as fully paid/settled.

No other billing rule should be reopened as part of this decision. The Full Year, Semester, Monthly, card-on-file, and auto-charge behaviors above apply once the Path B timing policy is selected.

---

## Smallest required data and API changes

### Database

Use existing application tables; do not create duplicate Stripe-owned product/customer/subscription tables.

Minimal additions:

- a Stripe Price reference for the active Academic Tutoring price-book line/mapping;
- `due_at` and an optional Stripe subscription/invoice reference on `payment_records`, so each future obligation can be reconciled;
- a small, app-owned payment-continuation/session record **only if** a signed one-time token plus the existing payment record cannot provide replay protection and expiration safely.

Existing `payment_records.stripePaymentIntentId` and `payment_records.stripeCustomerId` are reused. Stripe remains the source of truth for Stripe object details.

### APIs and server helpers

Add narrowly scoped Academic Year payment operations:

- prepare a public payment continuation for a newly created tutoring request;
- create/retrieve the Stripe PaymentIntent or SetupIntent for that continuation;
- finalize a Stripe-verified payment result;
- receive verified Stripe payment/subscription webhooks; and
- list/reconcile payment status for staff/family views.

Extract shared Customer, payment-method ownership, and household-card persistence logic from the existing authenticated family billing routes. Keep family endpoints authenticated; public endpoints are token-scoped to one request and cannot access arbitrary household billing data.

### UI

- Rename the public step to **Plan & payment**.
- Retain payment-plan, rate-package, auto-charge, and alternate-method selection.
- Replace “You will not be charged today” with due-date-aware copy.
- Show the exact first amount/due date and later schedule before card confirmation.
- Use a PaymentIntent-based payment element for a due-now card payment.
- Use a SetupIntent-only card flow when a card must be saved before a future due date.
- Show an explicit pending-manual-payment state when auto-charge is `no`.

---

## Acceptance criteria

### Common

- A payment retry is idempotent: one request, one first-payment record, and at most one Stripe charge/subscription for the same continuation.
- Stripe success/failure is confirmed server-side and by webhook, never trusted from the browser alone.
- Card numbers never reach the application server or database.
- A real charge never uses the quote helper’s fallback package.
- Existing household card data is never shown to an unauthenticated public visitor.
- No Zoho, Acuity, or QuickBooks call is introduced or changed.

### Path A

- A due-now card is authorized but not captured until the selected slot has passed server-side revalidation.
- A slot that fails revalidation produces no successful charge, no booking, and no seat change.
- A valid Path A selection updates the existing request, creates exactly one booking, and consumes exactly one seat without staff assignment.
- A capture failure compensates the temporary booking/seat state and leaves the request retryable.
- The selected tutor and slot are not assigned a second time by Staff.

### Path B

- The chosen B1 or B2 timing policy is enforced consistently.
- Before staff assignment, there is no booking, no seat change, and no duplicate request.
- Staff assignment updates the same request and creates exactly one booking.

### Plan mapping

- Full Year produces one discounted annual charge and no recurring charge.
- Semester produces two discounted five-month installments on September 1 and February 1.
- Monthly produces the first monthly charge plus recurring monthly billing through the end of the Academic Year.
- Auto-charge `yes` requires a saved card and supports only the defined scheduled charges.
- Auto-charge `no` creates no off-session Stripe charge or subscription.

---

## Explicit non-goals

- No Zoho CRM changes.
- No Acuity changes.
- No QuickBooks changes.
- No change to the Phase 1 tutor/slot preference behavior.
- No automatic booking for Path B before the selected Path B payment-timing policy allows it.
- No new seat-hold or reservation system unless implementation proves the existing atomic writer and Stripe authorization/capture sequence cannot satisfy the safety requirements; report that blocker before adding one.
- No redesign of unrelated family, staff, billing, or scheduling flows.