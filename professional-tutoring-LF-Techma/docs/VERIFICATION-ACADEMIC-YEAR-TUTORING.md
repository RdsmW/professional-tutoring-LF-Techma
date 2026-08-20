# Academic Year Tutoring — Verification Report

## Scope

This report covers the current Academic Year Tutoring registration flow. No Zoho, Acuity, QuickBooks, or invitation-email behavior was changed.

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
- After the latest Plan/Agreement content updates:
  - `npx tsc --noEmit`
  - `npx eslint src/components/public-ay-tutoring-registration-form.tsx src/lib/forms/options.ts`
  - `npx playwright test e2e/ay-billing-schedule.spec.ts e2e/public-ay-registration.spec.ts e2e/path-a-finalization-safety.spec.ts`
  - 13 passed; 1 skipped only because no open public tutor slot was available for the opportunistic Path A page-level scenario.

## Test-environment correction

Playwright now applies the public-form migration and creates a published Academic Year form fixture before its suite. Tests issue a valid signed form-version token from that fixture, rather than relying on the development page’s empty hidden token. This does not change production registration validation or payment behavior.

## Invitation and confirmation verification

- Successful registrations continue to generate and preserve family-portal invitation URLs.
- The confirmation page displays the verified payment status and the available invitation links without claiming an email was sent.
- The repository has no outbound-email provider, queue, mail transport, or delivery call for invitations. No email-send behavior was added or connected.
- The current Agreement remains displayed and acknowledgement-gated in the public flow. The current card setup/payment behavior, Stripe return/finalization flow, and invitation-link retention remain in place.

## Supplied source and contractual-text blocker

The later attached source supplied exact rate amounts, payment-plan dates, the two-hour-session explanation, the PT-staff confirmation note, and acknowledgement/signature labels. Those items are now reflected in the public flow.

However, despite describing itself as complete, the file does not include the body text for:

- the Academic Year Tutoring Policy;
- Payment Terms and accepted-payment-method language;
- card-on-file guarantee and authorization-to-charge wording; or
- Acknowledgements and Release.

No missing clause was invented or paraphrased. The previous unsourced cancellation and payment-term summaries were removed, and the visible placeholders now state that the approved wording was not supplied.

## Source/application differences requiring approved wording

- The source says the hourly rate is available only when no full-time tutoring spot is open or for a short one- to two-week trial. The current app sends hourly requests to Staff for a staff-set amount before payment instead of automatically charging a family-selected hourly rate.
- The source requires accepted-payment-method, card-on-file, and authorization-to-charge wording. The app preserves its existing Stripe PaymentIntent/SetupIntent and scheduled card-collection behavior, but the supplied file does not contain the approved contractual text needed to compare that behavior to the agreement.
- The supplied Full Year and Semester dates are 2026–27, while the installment engine determines the applicable academic year from the current date. They align for the current 2026–27 registration year; a future-year legal copy must be supplied before those visible dates are reused after that year.

## Files changed for this verification

- `e2e/global-setup.ts`
- `e2e/public-form-token.ts`
- `playwright.config.ts`
- `e2e/ay-billing-schedule.spec.ts`
- `e2e/public-ay-registration.spec.ts`
- `e2e/path-a-finalization-safety.spec.ts`
- `src/lib/forms/options.ts`
- `src/components/public-ay-tutoring-registration-form.tsx`
- `docs/WORK-ACADEMIC-YEAR-TUTORING.md`
- `docs/VERIFICATION-ACADEMIC-YEAR-TUTORING.md`