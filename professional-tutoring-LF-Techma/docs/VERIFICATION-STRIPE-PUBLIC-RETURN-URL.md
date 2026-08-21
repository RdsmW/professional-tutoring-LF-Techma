# Verification — Public Academic Year Stripe Return URL

## Scope

Academic Year public payment confirmation for both future-due SetupIntents and payment-due PaymentIntents.

## Results

- The public Stripe.js `confirmSetup` and `confirmPayment` calls provide a return URL based on the active browser origin and retain `redirect: "if_required"`.
- Stripe test mode reproduced the original SetupIntent rejection when confirmation omitted a return URL.
- Stripe test mode successfully confirmed the same type of future-due SetupIntent when a return URL was supplied.
- The successful SetupIntent persisted the household's default payment method and marked the card as on file.
- The Path B registration remained without a booking, and repeated finalization was idempotent.
- Stripe test mode confirmed a manual-capture PaymentIntent with a return URL. Its status was `requires_capture`; the test intent was cancelled after verification.
- TypeScript completed successfully.
- The production build completed successfully.
- Targeted Academic Year tests completed with 11 passed and 1 conditional availability test skipped.

## Existing Build Warnings

- Next.js reports the existing middleware-to-proxy deprecation warning.
- The build logs the existing Clerk dynamic server usage warning for the Staff route during static generation.