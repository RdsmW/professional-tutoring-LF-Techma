# Current implementation verification

**Date:** 2026-08-20  
**Scope:** Verification of the current implementation against Phase 1,
Phase 2 Stripe, and the approved Path B **Option B1** policy: payment or
card setup must happen before staff assignment.

## Safety and method

- No application payment, booking, pricing, scheduling, or business behavior
  was changed.
- Playwright was corrected only to use the existing Replit app on port `5000`
  and its direct health page at `/sign-in`; it no longer attempts to start a
  duplicate server.
- The development database was reachable and contains the required booking and
  payment tables.
- Isolated development test registrations, tutors, and slots were created to
  make the existing scenarios executable. Stripe operations ran only after the
  configured account was confirmed to be in test mode.
- The Stripe verification created only test Customers, PaymentMethods,
  SetupIntents, and PaymentIntents. It did not create Products, Prices,
  Subscriptions, Subscription Schedules, or webhooks.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Full Playwright suite | Passed | 6 passed and 11 explicitly skipped. The skipped tests require E2E Clerk family or staff credentials, which are not configured. |
| Existing Path A Playwright scenario | Passed | With a controlled open Math/Algebra slot, the existing test completed its selected-slot manual flow, produced one booking on the same request, and returned the same booking for a replay. |
| Path B B1 runtime gate | Passed | A real test request was rejected with `payment_not_ready` before manual-payment finalization; it created no booking. After payment setup it was assigned once, on the same request; a second attempt returned `already_assigned`. |
| SetupIntent runtime flow | Passed | A future-due Path B test continuation created a SetupIntent, accepted a test card, persisted setup completion, and finalized with no booking. |
| Manual-capture PaymentIntent runtime flow | Passed | A due-now Path A test continuation created a manual-capture PaymentIntent, reached `requires_capture`, captured through application finalization, produced a paid record and one confirmed booking, and returned the same booking on replay. |
| Declined-card behavior | Passed | Stripe rejected the controlled declined card before authorization. The application returned `409 authorization_incomplete`; no booking was created for that request and no seat was claimed. |
| `npx tsc --noEmit` | Passed | Completed without output. |
| `npm run lint` | Passed with warnings | 0 errors; 7 pre-existing warnings outside this verification scope. |
| Source scan for prohibited Stripe lifecycle APIs and external systems | Passed | No Product, Price, Subscription, Subscription Schedule, or webhook lifecycle is present. No Phase 2 Zoho, Acuity, or QuickBooks client or outbound call was found. |

## Phase 1 regression evidence

- The unauthenticated Academic Year page loads.
- Required-field feedback remains visible on the Student step.
- The family portal remains protected by sign-in.
- Path B registration creates the request and payment continuation but no booking.
- Path A still updates the original request, claims one seat through the
  existing assignment primitive, creates one booking, and returns the same
  booking on an immediate finalization retry.

## Phase 2 implementation evidence

- Stripe Customers, PaymentMethods, SetupIntents, PaymentIntents, card-on-file
  storage, manual capture, and payment-record transitions are operational in
  Stripe test mode.
- Path A card payment was verified in runtime order: authorization, temporary
  assignment, capture, booking confirmation, and retry response.
- Path B B1 was verified in runtime order: no staff assignment before payment
  setup; no booking on setup completion; one staff assignment only after the
  gate is satisfied.
- Atomic capacity enforcement was observed during verification: an attempted
  assignment against a slot already consumed by controlled tests returned
  `slot_unavailable` rather than overselling the seat.
- Manual payment retries and card-payment finalization retries return existing
  completion state rather than adding a second booking.

## Known limits of this verification

- The B1 gate was exercised through the shared assignment primitive with an
  active staff profile. An authenticated Clerk browser/API test of the staff
  route remains unavailable because no E2E staff credentials are configured.
- The declined-card test validates pre-authorization failure. The separate
  post-assignment capture-failure compensation branch was not fault-injected.
- Customer-reuse concurrency, token-expiry handling, token tampering, and
  concurrent assignment races were not tested.
- The staff-facing manual payment workflow itself was not tested beyond the
  payment-ready gate and shared assignment primitive.

## Verified working

- Playwright reliably connects to the running Replit app.
- Phase 1 public protections and request flows covered by the existing suite.
- Path A selected-slot manual flow and retry behavior.
- Test-mode SetupIntent and Path A manual-capture PaymentIntent success flows.
- Path B B1 payment gate, same-request assignment, single-booking behavior,
  and assignment replay rejection.
- Declined-card rejection without a booking or seat claim.
- No new Stripe catalog, recurring-billing, webhook, Zoho, Acuity, or
  QuickBooks operation was introduced.

## Verified broken

- Stripe webhook reconciliation is not implemented.
- Full Year, Semester, and Monthly recurring/scheduled Stripe billing are not
  implemented: there are no Product/Price mappings, Subscriptions, or
  Subscription Schedules.
- Public continuation tokens are hashed and expiring but are not atomically
  consumed as one-time capabilities.
- Manual payment preparation still requires Stripe configuration even though
  the manual branch does not call Stripe.

## Still unverified

- Authenticated staff route behavior under Clerk credentials.
- Capture-failure compensation after a temporary Path A booking exists.
- Concurrent Customer creation, continuation replay, slot claims, and
  database-level uniqueness behavior.
- Customer reuse across multiple registrations for one household.
- Expiry/tampering protections for public payment continuations.
- Any webhook, invoice, recurring collection, refund, or cancellation path.

## Minimum next implementation work

- Add the approved Stripe Product/Price and term-limited recurring collection
  model for Full Year, Semester, and Monthly plans.
- Add verified, idempotent Stripe webhook reconciliation.
- Make public continuations one-time atomically and add concurrency coverage.
- Add authenticated staff B1 E2E coverage and failure-injection coverage for
  capture compensation.