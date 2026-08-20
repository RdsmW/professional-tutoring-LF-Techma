# Report — Same-App Billing Scheduler

## Decision

Keep one Professional Tutoring application, one public web deployment, one Stripe webhook endpoint, and one internal billing scheduler.

The smallest safe same-app approach is to change the existing web deployment from **Autoscale** to a **Reserved VM** and run the Next.js web server plus one supervised, loopback-only billing timer in that same deployment.

No deployment setting, collector behavior, registration form, or business model was changed while preparing this report.

## Current State

- The published app is a successful public Autoscale deployment.
- The current web run command starts the Next.js server on `$PORT`.
- Stripe uses one webhook endpoint in the web app.
- `payment_records` already has generic ownership and collection fields:
  - `related_entity_type` and `related_entity_id`
  - Stripe customer, payment method, PaymentIntent, and SetupIntent identifiers
  - due date, collection attempt, retry, and payment-setup fields
- The current Academic Year collector is intentionally narrow:
  - it selects `tutoring_request` records only;
  - it requires a billing schedule, completed card setup, pending status, and a due date;
  - it atomically claims records and uses a per-record Stripe idempotency key.
- Courses currently create `course_enrollment` payment records without a billing schedule or completed automatic-payment setup. They are therefore not eligible for the current scheduled collector.

## Smallest Reserved VM Setup

### Deployment

Use the existing Professional Tutoring deployment as a **Reserved VM web server**. Preserve the production build and Next.js server command:

```text
build: cd professional-tutoring-LF-Techma && npm run build
web server: cd professional-tutoring-LF-Techma && npm run start -- -H 0.0.0.0 -p $PORT
```

A Reserved VM remains running, allowing an internal timer to run without a separate published web app or a second Stripe webhook. Replit documents Scheduled Deployments as run-and-stop jobs for periodic work; that target must not replace the existing web deployment because it would not serve the public forms or webhook.

### Runtime Scheduler

Use one small Node supervisor as the Reserved VM run command. It:

1. Starts the existing Next.js server as its child process.
2. Waits for the local app health endpoint.
3. Calls `POST http://127.0.0.1:$PORT/api/internal/billing/collect-due` once at startup.
4. Repeats that loopback call on a fixed interval, initially hourly.
5. Sends the existing `x-billing-job-secret` header from the VM environment.
6. Prevents overlapping executions, logs result counts, and forwards shutdown signals to the Next.js child process.
7. Exits when the web server exits so Replit can restart the VM normally.

The internal HTTP call keeps the scheduler independent of TypeScript runtime loaders and uses the existing authorization boundary. The secret never leaves the VM, while the public route remains protected from external callers.

The scheduler name, interval setting, route contract, and logs are generic. The scheduler must call a neutral `collect-due` entrypoint rather than an Academic Year-named command.

## Reuse Plan Without a Broad Refactor

### Now

Keep `collectDueAcademicYearInstallments` unchanged. At scheduler adoption, add a minimal neutral dispatcher such as `collectDuePayments` that currently delegates to that collector. The internal route and scheduler call the dispatcher, not an Academic Year-specific function.

This adds one stable scheduling boundary while leaving the existing Academic Year collection logic, Stripe webhook handling, payment schedule construction, and pricing unchanged.

### When Another Form Needs Scheduled Card Collection

Evolve the dispatcher into a shared due-payment collector. The shared selection can use the existing generic payment-record fields:

- pending status;
- non-null billing schedule;
- completed payment setup;
- due date reached;
- retry time reached.

At that point, replace the current `tutoring_request` predicate with the generic eligibility criteria. Use source-neutral Stripe metadata and idempotency keys based on `payment_record_id`, while retaining source identifiers as metadata for auditability.

The existing atomic database claim and Stripe idempotency protections remain the common collection mechanism.

### Business-Model Separation

Tutoring and Courses remain separate:

- Tutoring records continue to point to `tutoring_requests` and may affect bookings.
- Course records continue to point to `course_enrollments` and may affect course enrollment state.
- The collector processes payment records only. It does not create tutoring bookings or course enrollments.
- Existing reconciliation already limits pending-booking confirmation to `tutoring_request` records. Other entity types receive payment-record reconciliation without tutoring side effects.

Future public forms can choose whether to create eligible scheduled payment records. Forms that do not create a schedule and card-setup state remain outside automated collection.

## Guardrails

- Run a single scheduler loop per Reserved VM deployment.
- Keep the existing atomic claim and Stripe per-record idempotency key.
- Run once on startup to collect work missed during downtime.
- Catch and log scheduler errors without terminating the web server.
- Keep `BILLING_JOB_SECRET`, Stripe keys, and the database connection as production secrets.
- Do not change the Stripe webhook architecture or add form-specific schedulers.

## Not Included

- No implementation of Summer Tutoring, SAT Master Class Summer, First Class, or The Express.
- No refactor of Academic Year billing.
- No change to Course enrollment or Tutoring booking business models.
- No second Replit deployment, artifact, webhook, or external scheduler.