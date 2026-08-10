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

- [x] Slice 1: Family onboarding unlock (`pending` → `active`) + household profile form
- [x] Slice 1: Add Student multi-step wizard + real student cards
- [x] Five-form field catalog + structured controls (`src/lib/forms`, wired into onboarding/Add Student)
- [ ] Book Tutoring end-to-end (parent chooses suitable available tutor)
- [ ] Enroll in Courses (First Class / Express / Summer Master Class)
- [ ] Calendar & Changes request flow
- [ ] Payments/Receipts safe detail (still no raw cards)
- [ ] Messages/Support → Staff inbox loop
- [ ] Profile + Account & Security simulations replaced with real Clerk-backed edits where appropriate
- [ ] Five Gravity Form field groups end-to-end (wizards consume catalog)

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
