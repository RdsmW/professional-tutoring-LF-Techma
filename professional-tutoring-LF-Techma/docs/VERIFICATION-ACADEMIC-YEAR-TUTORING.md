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
- After the complete contractual source was integrated:
  - `npm run build` completed successfully.
  - `npx tsc --noEmit` passed.
  - `npm run lint` completed with 7 existing project warnings and no errors.
  - The Review schedule calculation was checked against the 2026–27 source schedule and card surcharge: Full Year $4,074.59, Semester $2,263.66 then $2,037.29, and Monthly $476.56 through May plus $238.28 in June.
- After the final public-payment and hourly-review correction:
  - `npx tsc --noEmit` and targeted lint passed.
  - `npm run build` completed successfully.
  - `npx playwright test e2e/ay-billing-schedule.spec.ts e2e/public-ay-registration.spec.ts e2e/path-a-finalization-safety.spec.ts` completed with 13 passed and 1 skipped.
  - The Path B API test rejects `autoCharge: "no"` plus an alternative payment method, creates a card-backed continuation for compliant registrations, and confirms an hourly package becomes `paymentDeferred` with no payment continuation.
  - Billing schedule tests assert the card-fee-inclusive finite installment amounts, and the existing Path A safety tests still cover deactivated tutors, subject mismatch, changed windows, and concurrent finalization.

## Test-environment correction

Playwright now applies the public-form migration and creates a published Academic Year form fixture before its suite. Tests issue a valid signed form-version token from that fixture, rather than relying on the development page’s empty hidden token. This does not change production registration validation or payment behavior.

## Invitation and confirmation verification

- Successful registrations continue to generate and preserve family-portal invitation URLs.
- The confirmation page displays the verified payment status and the available invitation links without claiming an email was sent.
- The repository has no outbound-email provider, queue, mail transport, or delivery call for invitations. No email-send behavior was added or connected.
- The current Agreement remains displayed and acknowledgement-gated in the public flow. The current card setup/payment behavior, Stripe return/finalization flow, and invitation-link retention remain in place.

## Supplied source content

The complete supplied Academic Year Tutoring Policy, Payment Terms, and Acknowledgements and Release are now accessible in the applicable Plan and Agreement stages without replacing them with headings, links, or paraphrased clauses.

## Source/application differences requiring Masdouk/client approval

- **Card authorization:** “Professional Tutoring will only charge this card without explicit authorization in the case of late payment or nonpayment.” The app’s scheduled Stripe installment collection after card setup is different. The clause is visible unchanged alongside an explicit approval notice.
- **Tutoring appointments:** “Under no circumstances are appointments to be made directly with tutors.” The app allows the approved in-app Path A tutor/slot flow and Path B preferred-window flow. The clause is visible unchanged alongside an explicit approval notice.
- **Mixed Standard + Advanced pricing:** The source does not define a combined formula. The app continues to defer price confirmation and payment to Staff rather than inventing an amount.
- **Hourly requests:** The source limits hourly pricing to no-full-time-spot and short trial situations. The app routes hourly requests to Staff for a staff-set amount before payment rather than automatically charging a family-selected hourly rate.

## Files changed for this verification

- `e2e/global-setup.ts`
- `e2e/public-form-token.ts`
- `playwright.config.ts`
- `e2e/ay-billing-schedule.spec.ts`
- `e2e/public-ay-registration.spec.ts`
- `e2e/path-a-finalization-safety.spec.ts`
- `src/lib/forms/options.ts`
- `src/components/public-ay-tutoring-registration-form.tsx`
- `src/lib/academic-year/source-content.ts`
- `src/lib/academic-year/client-review-quote.ts`
- `src/app/globals.css`
- `src/lib/public-intake/ay-tutoring-registration.ts`
- `src/lib/public-intake/ay-tutoring-payment.ts`
- `e2e/ay-billing-schedule.spec.ts`
- `e2e/public-ay-registration.spec.ts`
- `e2e/path-a-finalization-safety.spec.ts`
- `docs/WORK-ACADEMIC-YEAR-TUTORING.md`
- `docs/VERIFICATION-ACADEMIC-YEAR-TUTORING.md`