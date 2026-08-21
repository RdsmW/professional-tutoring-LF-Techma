# Verification — Same-App Billing Scheduler

## Static and Regression Checks

- Node syntax validation completed for `scripts/start-production-with-billing-scheduler.mjs`.
- TypeScript completed successfully.
- The Next.js production build completed successfully.
- Focused Academic Year suite completed with 11 passed and 1 conditional availability test skipped.

## Controlled Stripe Test-Mode Collection

- The collector route rejected a request without its billing secret.
- A fresh Path B monthly registration completed card setup without creating a booking.
- A controlled eligible due installment was collected successfully.
- A controlled future-due installment remained pending and did not receive a PaymentIntent.
- A controlled retryable Stripe lookup failure remained pending and received a future retry time.
- Two concurrent collector requests claimed and collected one installment once.
- A signed Stripe webhook event reconciled successfully, and replaying the same event remained deduplicated.

## Supervisor Runtime Checks

- The production supervisor started the Next.js web server and reached the local health endpoint.
- The supervisor completed one startup collection call and multiple shortened-interval collection calls.
- The Stripe webhook route was reachable through the supervised web server and returned the expected invalid-request status without a signature.
- Controlled collector 500 responses during startup and interval execution did not stop the supervised web server; its health endpoint continued returning HTTP 200.

## Existing Warnings

- Next.js reports the existing middleware-to-proxy deprecation warning.
- The production build reports the existing Clerk dynamic server usage warning for the Staff route during static generation.