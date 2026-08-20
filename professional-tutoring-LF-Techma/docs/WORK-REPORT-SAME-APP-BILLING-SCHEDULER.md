# Work Report — Same-App Billing Scheduler

## Implemented

- Added `collectDuePayments` as the neutral due-payment dispatcher.
  - It currently delegates only to `collectDueAcademicYearInstallments`.
  - Academic Year collection eligibility, Stripe metadata, idempotency keys, atomic claims, and retry behavior remain unchanged.
- Updated the protected internal collector route to call the neutral dispatcher.
- Made the existing billing-secret-protected route available to the same-app loopback scheduler without Clerk session authentication.
- Added a production Node supervisor that:
  - starts the existing Next.js web server;
  - waits for its local health endpoint;
  - invokes the protected collector once after startup;
  - invokes it on an hourly default interval;
  - prevents overlapping collection runs;
  - logs collector outcomes and failures without terminating the web server;
  - forwards shutdown signals to the web process.
- Prepared the deployment configuration for a Reserved VM web deployment.

## Reserved VM Run Command

```text
cd professional-tutoring-LF-Techma && node scripts/start-production-with-billing-scheduler.mjs
```

The supervisor starts the unchanged Next.js production server internally with:

```text
npm run start -- -H 0.0.0.0 -p $PORT
```

## Preserved Boundaries

- One Professional Tutoring app, one public web deployment, one Stripe webhook, and one internal scheduler.
- Tutoring remains attached to `tutoring_requests` and bookings.
- Courses remain attached to `course_enrollments` and course offerings.
- No Summer Tutoring, SAT Master Class Summer, First Class, The Express, Zoho, QuickBooks, or Acuity work was added.
- No broad payment-record or billing-model refactor was performed.

## Manual Publishing Step

The current live deployment remains Autoscale until the next publish. In the Replit Publishing tool:

1. Open **Adjust settings** for the Professional Tutoring deployment.
2. Select **Reserved VM** as the deployment type and retain it as a web server.
3. Confirm the build command and Reserved VM run command from `.replit`.
4. Publish the deployment.

The Reserved VM uses the existing production secrets, including `BILLING_JOB_SECRET`, Stripe credentials, and the database connection.