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

## Stage 2 — Family journeys (next)

- [ ] Family account creation / onboarding unlock
- [ ] Add Student multi-step wizard
- [ ] Book Tutoring end-to-end (parent chooses suitable available tutor)
- [ ] Enroll in Courses (First Class / Express / Summer Master Class)
- [ ] Calendar & Changes request flow
- [ ] Payments/Receipts safe detail (still no raw cards)
- [ ] Messages/Support → Staff inbox loop
- [ ] Profile + Account & Security simulations replaced with real Clerk-backed edits where appropriate
- [ ] Five Gravity Form field groups per `FORM-TO-APP-FIELD-MAPPING.md`

## Stage 3 — Staff depth

- [ ] Family Detail + New Family + guardian invites/merge
- [ ] Student Detail + filters + notes + Best Fit assist
- [ ] Tutor Detail + Add Tutor + workload
- [ ] Staff booking on weekly calendar
- [ ] Course roster / enrollment management
- [ ] Session Detail + attendance
- [ ] Exception queue with policy traces
- [ ] Billing Detail + controlled actions
- [ ] Reports filters/export + school suggestion admin + controlled merge

## Stage 4 — Money & integrations (gated)

- [ ] Stripe hosted payment
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
