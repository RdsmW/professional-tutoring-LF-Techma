# Academic Year Tutoring — Verification Report

## Scope

This report covers verification of the current Academic Year Tutoring registration flow only. No policy, payment-term, invitation-email, Zoho, Acuity, or QuickBooks behavior was changed as part of this verification.

## Passed checks

- `npx tsc --noEmit`
- `npm run lint` (previously completed with existing warnings only; no lint errors)
- `npm run build` (previously completed successfully)
- `npx playwright test e2e/ay-billing-schedule.spec.ts e2e/public-ay-registration.spec.ts`
  - 9 passed; 1 skipped because no open production-like tutor slot existed for the opportunistic public Path A check.
  - Path B creates a request without a booking.
  - Standard + Advanced subject selections defer payment to Staff.
  - Full Year stores one $3,933.00 installment: 9.5 months with the 10% discount.
  - Semester stores $2,185.00 then $1,966.50: 5 months plus 4.5 months, each with the 5% discount.
  - Monthly stores nine $460.00 installments plus a $230.00 June half-month installment.
  - A card-collected $460.00 installment stores a $16.56 (3.6%) service fee and charges $476.56.
- `npx playwright test e2e/path-a-finalization-safety.spec.ts`
  - 4 passed.
  - Path A rejects a tutor deactivated after selection.
  - Path A reuses one booking under concurrent finalization.
  - Path A rejects a tutor that no longer teaches the chosen subject.
  - Path A rejects a slot moved outside the original schedule window.

## Test-environment correction

Playwright now applies the public-form migration and creates a published Academic Year form fixture before its suite. Tests issue a valid signed form-version token from that fixture, rather than relying on the development page’s empty hidden token. This does not change production registration validation or payment behavior.

## Invitation and confirmation verification

- Successful registrations continue to generate and preserve family-portal invitation URLs.
- The confirmation page displays the verified payment status and the available invitation links without claiming an email was sent.
- The repository has no outbound-email provider, queue, mail transport, or delivery call for invitations. No email-send behavior was added or connected.
- The current Agreement remains displayed and acknowledgement-gated in the public flow. The current card setup/payment behavior, Stripe return/finalization flow, and invitation-link retention remain in place.

## Contractual-text blocker

The approved Academic Year policy, payment terms, agreement/release, billing, cancellation, appointment-booking, and accepted-payment-method source text was not present in the accessible workspace. A request for the exact source was declined. Therefore:

- No contractual wording was added, rephrased, or invented.
- Exact source-vs-application conflicts cannot be evaluated or reported.
- Existing placeholder notices remain unchanged until the approved text is supplied.

## Files changed for this verification

- `e2e/global-setup.ts`
- `e2e/public-form-token.ts`
- `playwright.config.ts`
- `e2e/ay-billing-schedule.spec.ts`
- `e2e/public-ay-registration.spec.ts`
- `e2e/path-a-finalization-safety.spec.ts`
- `docs/VERIFICATION-ACADEMIC-YEAR-TUTORING.md`