# Work Report — Phase 2 Operational Closeout

## Completed during operational closeout

- Confirmed the prior Phase 2 implementation and verification reports remain present in the current project state.
- Confirmed the webhook implementation handles only:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `setup_intent.succeeded`
- Configured the main web application for an autoscaling production deployment:
  - build: `cd professional-tutoring-LF-Techma && npm run build`
  - run: `cd professional-tutoring-LF-Techma && npm run start -- -H 0.0.0.0 -p $PORT`
- Corrected one concrete Path A replay race found during final smoke testing. A concurrent finalization that sees the slot become full now safely reuses an active booking only when that booking belongs to the same tutoring request.
- Preserved the existing collector, webhook, payment model, and integration boundaries. No new Stripe feature or external integration was added.

## Webhook status

There is currently no published Replit deployment. As a result, there is no production webhook URL to provide or register with Stripe.

Once the web app is published with public visibility, the exact Stripe test-mode endpoint is:

`<published Replit primary URL>/api/stripe/webhook`

Configure Stripe test mode to send only the four event types listed above. Copy the endpoint’s signing secret into the **Production** Replit secret named `STRIPE_WEBHOOK_SECRET`. The secret value is not stored in this repository or this report.

The endpoint rejects requests without a valid Stripe signature and records each Stripe event id once, so a repeat delivery does not apply payment state twice.

## Scheduled collector status

The existing protected HTTP execution path is:

`POST <published Replit primary URL>/api/internal/billing/collect-due`

It requires the request header:

`x-billing-job-secret: <BILLING_JOB_SECRET>`

The collector only considers Academic Year tutoring-payment records that are:

- part of a billing schedule;
- pending;
- due;
- payment-method authorized; and
- not deferred until a later retry time.

It atomically claims a record before collection and creates a PaymentIntent with a stable per-installment idempotency key. Concurrent calls therefore cannot successfully collect the same installment twice.

The main app must remain an autoscaling web deployment to serve public traffic and Stripe webhooks. Replit’s Scheduled deployment target is for a run-and-stop job and does not expose a web app, so it must not replace this application’s web deployment.

To use Replit scheduling, a separate scheduled runner must invoke the protected collector or run the existing collector script with the required production database and Stripe secrets. A suitable scheduled command is:

`cd professional-tutoring-LF-Techma && npx tsx scripts/collect-due-ay-installments.mts`

The scheduled runner must use the same production billing data and secrets as the web application. This cross-deployment setup cannot be activated safely until the production deployment and its secrets exist.

## Human-only operational actions

1. Publish the configured web deployment with **public** visibility. Stripe webhooks cannot reach an unpublished, private, or password-protected deployment.
2. Use the resulting primary URL to create the Stripe **test-mode** webhook endpoint at `/api/stripe/webhook`.
3. Save the Stripe endpoint signing secret as the `STRIPE_WEBHOOK_SECRET` Production secret.
4. Create and save a strong `BILLING_JOB_SECRET` Production secret.
5. Provision a separate Replit Scheduled deployment or another trusted scheduler to run the collector without replacing the main web deployment.
6. After those settings exist, send one Stripe test-mode event and replay the same event to complete the live signature, reconciliation, and deduplication check.

## Related documents

- `docs/WORK-REPORT-PHASE2-STRIPE-AND-PATH-A.md`
- `docs/VERIFICATION-PHASE2-STRIPE-AND-PATH-A.md`
- `docs/VERIFICATION-PHASE2-OPERATIONAL-CLOSEOUT.md`