# Mockup → build backlog

Source of truth for UX: `../professional-tutoring-mockup` + `PROTOTYPE-COVERAGE.md`.

## Stage 1 — Foundation (this release)

- [x] App scaffold (Next.js + Clerk + Drizzle)
- [x] Mockup CSS tokens + Staff/Family themes
- [x] Exact Staff nav shells
- [x] Exact Family nav shells
- [x] Scheduling Week/Courses nested mode
- [x] Sessions Sessions/Exceptions nested mode
- [x] Map existing Supabase tables in Drizzle
- [x] Docs: README, Replit notes, this backlog
- [x] Non-blocking first-login bootstrap (`POST /api/bootstrap` + `BootstrapSession`)
- [x] Postgres `connect_timeout` so login never hangs on DB
- [x] Staff Dashboard mockup layout with live metrics where data exists
- [x] Family portal polish (family-mode theme, sidebar naming, pending onboarding cue)
- [x] Family Home/Students UI parity (metrics, live students/bookings, need chips, edit footer)

## Stage 2 — Family journeys (next)

- [x] Slice 1: Family onboarding unlock (`pending` → `active`) + household profile form
- [x] Slice 1: Add Student multi-step wizard + real student cards
- [x] Five-form field catalog + structured controls (`src/lib/forms`, wired into onboarding/Add Student)
- [x] Book Tutoring (trimmed wizard + seeded tutors/slots + consent-gated Stripe card-on-file)
- [x] Enroll in Courses (First Class / Express / Summer Master Class)
- [x] Calendar & Changes request flow
- [x] Calendar change UX: booking-first CTA (list banner softened; Messages bridges to Calendar)
- [x] Payments/Receipts detail + receipt download (saved card brand/last4 already shown)
- [x] Payments detail UX polish (friendly status, 3-card summary, plain-language receipt)
- [x] Messages/Support → Staff inbox loop
- [x] Profile + Account & Security simulations replaced with real Clerk-backed edits where appropriate
- [x] Five Gravity Form field groups end-to-end (wizards consume catalog)

## Stage 3 — Staff depth

- [x] Family Detail core (hero, guardians/invites, notes, student links, service activity) — New Family wizard/merge queue still open
- [ ] New Family multi-step wizard + identity match/merge queue
- [x] Student Detail + filters + notes (Best Fit still deferred)
- [x] Tutor Detail + Add Tutor + workload (subject assign / archive still deferred)
- [x] Scheduling Week board + recent bookings (staff create booking still open)
- [x] Course list + roster read (manage enrollment / archive still open)
- [x] Sessions list (bookings-as-sessions) + Exception queue status actions — Session Detail / attendance / full policy traces still open
- [ ] Session Detail + attendance
- [ ] Exception queue with policy traces
- [x] Billing Detail + controlled actions (manual ledger status/notes; no Stripe charges)
- [ ] Reports filters/export + school suggestion admin + controlled merge

### QA note — Playwright auth smoke

Authenticated suites in `e2e/smoke.spec.ts` run only when these are set in `.env.local`:

- `E2E_CLERK_FAMILY_EMAIL` / `E2E_CLERK_FAMILY_PASSWORD`
- `E2E_CLERK_STAFF_EMAIL` / `E2E_CLERK_STAFF_PASSWORD`

Unauthenticated smoke always runs. No product code change required for auth smoke.

## Stage 4 — Money & integrations (gated)

- [x] Stripe card-on-file (SetupIntent + consent) for Book Tutoring
- [ ] Stripe charge / receipt capture for pending payment bookings

- [ ] QuickBooks
- [ ] Acuity
- [ ] Zoho sync
- [ ] Idempotent outbox + reconciliation

## Stage 5 — Replit cutover

- [ ] Deploy on Replit
- [ ] Switch `DATABASE_URL` to Replit DB
- [ ] Keep Clerk
- [ ] Website link cutover

## Do not invent yet (open client decisions)

- Best Fit weights / auto-assign vs offer
- Express class-time preference (not verified on live form)
- Final price/discount/surcharge matrix legality
- Summer Master Class agreement link inconsistency
- Multi-tutor half-seat combinations
