# Public Academic-Year Tutoring intake — Option A vs B

**Repo:** `professional-tutoring-app`  
**Mode:** audit only (no application/schema/route implementation in this pass)  
**Date:** 2026-08-19  
**Related:** `docs/PUBLIC-AY-TUTORING-REUSE-AUDIT.md`, `docs/CURRENT-ARCHITECTURE-AUDIT.md`

## Verdict for this stage

**Recommend Option A — minimal isolated public intake.**

It is the smallest path to a demonstrable unauthenticated AY registration, does not rewrite working Staff/Family create or booking handlers, does not invent merge/attach rules beyond what staff already do, and is not a dead-end: the one new primitive (`createTutoringRequest` without a booking) is the same primitive Option B would extract later.

Do **not** start with Option B. Extracting people-create and booking pipelines first would touch every working create/book path for no demo gain.

---

## Confirmed desired flow (this document’s target)

```text
Unauthenticated parent
→ public Academic Year Tutoring registration
→ submit Family / Guardian(s) / Student / tutoring information
→ store in the app
→ reuse existing household/person only when safely identifiable
→ create a tutoring request
→ no seat claimed unless a real booking is being made
→ guardian invite(s) later
→ Zoho after this foundation
```

---

## Schema confirmation: request-only `tutoring_requests`

Table: `tutoringRequests` in `src/lib/db/schema.ts`.

| Column | Drizzle | Booking required? |
| --- | --- | --- |
| `household_id` | **NOT NULL** | No |
| `student_id` | **NOT NULL** | No |
| `subject_id` | **NOT NULL** | No |
| `requested_by_guardian_id` | nullable | No |
| `preferred_slot_id` | **nullable** | No |
| `status` | NOT NULL, default `draft` | No |
| `form_id`, `schedule_window_id`, `payment_plan_id`, `payload` | optional | No |

There is **no** `booking_id` on `tutoring_requests`.  
`bookings.tutoring_request_id` is **nullable** on the bookings table. A request row can exist with **zero** `bookings` rows.

Drizzle does **not** declare `.references()` on `householdId` / `studentId` / `subjectId` / `preferredSlotId`. Application writers still treat those IDs as real rows. Public insert **must** create or reuse a household, student, and `subjects` row first. `preferred_slot_id` may be `null`.

**Public request-only insert is schema-legal.** Seat/capacity live only on `availability_slots` via `bookings` writers.

Existing writers always couple request + booking + `booked_seats + 1`:

- `POST` `src/app/api/family/book-tutoring/route.ts` — `status: "submitted"` + `bookings` `pending_payment` + payment row
- `POST` `src/app/api/staff/scheduling/bookings/route.ts` — `status: "confirmed"` + `bookings` `confirmed`

Waitlist already expects the request-only shape: `queryWaitlistReport` (`src/lib/reports/queries/waitlist.ts`) lists `submitted` | `held` | `pending_staff_review` with **no confirmed booking**. Nothing currently writes that shape without also writing a `pending_payment` booking.

---

## Option A — Minimal isolated public intake

Create **new** public page + API + orchestration. Reuse low-level helpers. Leave working Staff/Family create and booking routes **as they are**.

### What A builds

1. Unauthenticated AY form (catalog fields already in `src/lib/forms/*`).
2. Orchestration service: validate → match → create people **or** hold for staff → `insert(tutoringRequests)` only.
3. Optional small extract of `runMatch` so public and staff share identity search (see Q3).
4. Set `guardians.invite_token` the same way `POST /api/staff/families` already does; later use existing `/invite/[token]`.

### Logic duplicated vs extracted

People-create is **already** duplicated today (staff families POST, staff students POST, family students POST, `ensureFamilyGuardian`). Option A adds a **fourth** insert path with **different** rules (no Clerk, no slot, no payment, household stays `pending`). That is similar to staff create, not a silent fork of booking rules.

**Meaningful maintenance risk:** low for this stage, if public never copies seat/payment logic from `book-tutoring`. High only if someone later “just calls” family book-tutoring from the public form.

**Do not duplicate:** `assertNotStaffAsGuardian`, `isValidOptionId` / catalog lists, `catalogSubjectToDbCode` + `subjects` lookup, `isValidEmail` / `isValidPhone`, `FORM_META.academic_year_tutoring`, waitlist (read-only).

### Option A does not

- Call `POST /api/family/book-tutoring` or `POST /api/staff/scheduling/bookings`
- Call `ensureFamilyGuardian` / `POST /api/bootstrap` during public submit
- Auto-run merge (`POST .../merge-queue/[id]/merge` does not move `tutoring_requests` / `bookings` / `payment_records`)
- Mark household `active` or collect Stripe

---

## Option B — Shared business-service refactor first

Extract household/guardian/student create **and** tutoring request/booking into lib services, then rewire existing routes **and** public intake onto those services.

### Routes that would have to change

| Route | Why |
| --- | --- |
| `POST /api/staff/families` | Inline household + 1–2 guardians + name-only students + invite tokens |
| `POST /api/staff/families/[id]/guardians` | Second-guardian insert, max-2, billing owner |
| `POST /api/staff/students` | Prospect student |
| `POST /api/family/students` | Full-profile student + catalog validation |
| `GET/POST /api/staff/families/match` | Wrap extracted `runMatch` |
| `POST /api/family/book-tutoring` | Split request vs claim-seat vs payment |
| `POST /api/staff/scheduling/bookings` | Same split, confirmed path |
| Possibly `ensureFamilyGuardian` | Only if “find by email” is folded into shared create |

### Cost of B at this stage

- **Regression:** every working create and both booking pipelines.
- **Code affected:** those handlers plus `staff-new-family-wizard.tsx`, family students UI, book-tutoring wizard, staff scheduling client, e2e that hits families/booking.
- **Migrations:** none required for the extract itself (same tables).
- **Testing:** staff new-family wizard, family add-student, family book (slot + Stripe), staff scheduling book, then public — before any public demo.
- **Advantage over A:** one people-create and one request writer long-term; booking extract can wrap seat increment in a transaction (today request → booking → seat are sequential, no transaction).

That advantage is real **after** public intake exists. It is not required to store a public AY request.

---

## Comparison (priorities for this stage)

| Priority | Option A | Option B |
| --- | --- | --- |
| 1. Lowest regression | **Wins.** Working create/book handlers stay inline. | Rewires all of them. |
| 2. Fastest E2E public demo | **Wins.** New path only. | Demo blocked on refactor + regression tests. |
| 3. Minimum cost | **Wins.** | Large, unpaid by demo. |
| 4. No invented business rules | **Wins if match policy copies staff** (advisory; no auto-merge). Shared services tempt new “canonical” attach/merge behavior. | Same rules *if* extracts stay faithful; easy to “improve” while moving. |
| 5. Not a dead-end | **OK.** Later extract `createTutoringRequest` / people-create / `runMatch`; public service becomes a caller. | Cleaner now; slower and riskier now. |

---

## Questions 1–10

### 1. Can we implement a dedicated public registration service without modifying `POST /api/staff/families`, `POST /api/family/students`, or the current booking routes?

**Yes.** Those four handlers (`staff/families` POST, `family/students` POST, `family/book-tutoring` POST, `staff/scheduling/bookings` POST) can stay untouched.

A public service would be a **new** caller of Drizzle + existing lib helpers. It must **not** HTTP-call those routes (staff auth, family auth, active household, slot, Stripe).

The only existing file that **must** change for a public URL to work is `src/middleware.ts` (Clerk `isPublicRoute`). That is not one of the routes listed above.

Optional, not required: thin-wrap `src/app/api/staff/families/match/route.ts` after lifting `runMatch`.

---

### 2. If yes, which existing helpers can that service reuse, and what small pieces would be duplicated?

**Reuse as-is (lib, no route rewrite):**

| Helper | File |
| --- | --- |
| `assertNotStaffAsGuardian` / `isStaffIdentity` | `src/lib/staff/staff-guardian-guard.ts` |
| `isValidEmail`, `isValidPhone` | `src/lib/validation/contact.ts` |
| `isValidOptionId`, `ACADEMIC_SUBJECTS`, windows, plans, referral, test-prep | `src/lib/forms/options.ts` |
| `FORM_META.academic_year_tutoring` | `src/lib/forms/form-profiles.ts` |
| `catalogSubjectToDbCode` | `src/lib/booking/subject-map.ts` then lookup `subjects` |
| `nextAvailableRelationshipRole`, `assertUniqueRelationshipRole`, `setHouseholdBillingOwner` | `src/lib/staff/guardians.ts` |
| `MAX_GUARDIANS_PER_HOUSEHOLD` (2), `buildHouseholdDisplayName`, `refreshHouseholdDisplayNameIfAuto` | `src/lib/staff/household-display-name.ts` |
| `randomBytes` invite token pattern | same as `POST /api/staff/families` and `POST /api/staff/families/[id]/invite` |

**Do not reuse for public submit:**

| Function | Why |
| --- | --- |
| `ensureFamilyGuardian` | Clerk-only; lookup is `guardians.clerk_user_id` only; else **always new household** |
| `getFamilyContext` / `getStaffContext` | Clerk session |
| `resolveFamilyPaymentMethod` | Stripe + family context |
| Family/staff booking `POST` bodies | Always slot + `booked_seats` |

**Duplicate (small, already duplicated in the repo):**

- Household insert (`status: "pending"`, timezone, address) — parallel to `POST /api/staff/families`
- Guardian insert (`parent_1` / `parent_2`, `inviteToken`, `clerkUserId: null`) — same
- Student insert (`lifecycle: "prospect"`) — closer to family students (first/last/school/grade/year/gender/needs) than staff name-only `insertStudentFromDisplayName`
- Subject resolve + `insert(tutoringRequests)` **without** booking — **new**; not a copy of booking tails

Match SQL (~80 lines in `runMatch`) should be **extracted or called**, not copied, if identity reuse is in v1.

---

### 3. What is the **minimum extraction that is unavoidable**?

**Nothing in the working booking or people-create routes is unavoidable.**

Unavoidable **new** work (not an extract):

- A writer that inserts `tutoring_requests` with `preferred_slot_id` null and **no** `bookings` / seat / payment row.

**Strongly recommended, still tiny:** lift `runMatch` from `src/app/api/staff/families/match/route.ts` to e.g. `src/lib/staff/family-match.ts` (`findHouseholdMatchCandidates`). Auth stays in the staff route. Public orchestration calls the same function. That is the only extract that avoids two copies of email/phone matching.

Leave `POST /api/staff/families` and both booking routes inline until a later cleanup PR.

---

### 4. Can `createTutoringRequest()` be added as a new reusable operation while leaving family/staff booking routes untouched initially?

**Yes.** Add `src/lib/booking/create-tutoring-request.ts` (name flexible). Public intake calls it. Family and staff booking routes **keep their current inline** `insert(tutoringRequests)` until a later PR switches them to the helper.

No behavior change on existing book paths if they are not edited.

---

### 5. If booking routes stay untouched, is there a technical or data-consistency problem with a public request-only path writing `tutoring_requests`?

**No schema or FK problem.** Request-only is allowed. Booking routes do not assume they are the only writers.

**Consistency notes (not blockers):**

- Waitlist will start listing public rows (`submitted` / `held` / `pending_staff_review` without a **confirmed** booking). Family book rows with `pending_payment` bookings also appear until confirmed — that is existing waitlist logic, not new.
- Staff scheduling UI that lists **bookings** will not show request-only rows. Staff families/students directories **will** show the new people. Waitlist report is the existing operational list for unplaced tutoring.
- `subject_id` must be a real `subjects.id`. Unknown catalog IDs must fail validation. Do not rely on `catalogSubjectToDbCode`’s fallback `"math"` for garbage input.
- Do not set `preferred_slot_id` to a live slot **and** skip booking: that would look like a preference only; it does not claim a seat. Prefer `null` unless a later phase truly books.
- Two writers (public request-only vs family book) can both insert requests for the same student. That is the same as staff creating a family then the family booking later. No unique constraint prevents it.

---

### 6. For a completely new family submitted publicly, safest create order (no Clerk yet)?

Mirror **staff** create, then add a request-only tutoring row. Do **not** use `ensureFamilyGuardian`.

1. `assertNotStaffAsGuardian` on guardian email(s).
2. Insert `households`: `status: "pending"`, US address/timezone as staff does. Do **not** set `active`. Do **not** set Stripe fields.
3. Insert guardian 1: `relationshipRole: "parent_1"`, billing owner per existing “one owner” pattern, `clerkUserId: null`, `inviteToken: randomBytes(24).toString("hex")` (same as `POST /api/staff/families`).
4. Optional guardian 2: `parent_2`, own `inviteToken`, `MAX_GUARDIANS_PER_HOUSEHOLD === 2`. Same staff-email block.
5. Point `households.billing_owner_guardian_id` at the billing guardian (`setHouseholdBillingOwner` or the same two-step update staff uses).
6. Insert student `lifecycle: "prospect"` with public form fields (not name-only unless the form only collected a display name).
7. `refreshHouseholdDisplayNameIfAuto` if `displayNameManual` is false; or set a manual name like staff wizard.
8. Resolve `subjects.id` from catalog subject via `catalogSubjectToDbCode` + DB lookup.
9. `createTutoringRequest`: `formId: "academic_year_tutoring"`, `householdId`, `studentId`, `subjectId`, `requestedByGuardianId` = guardian 1, `preferredSlotId: null`, window/plan/notes/referral/test-prep in columns + `payload`. **No** `bookings`, **no** `booked_seats`, **no** `payment_records`.
10. Return invite paths (`/invite/{token}`) to staff UI later; public confirmation page does not need Clerk.

**Status for the request (existing enum, not a new rule):** use `pending_staff_review` for unauthenticated, unplaced public intake (enum already unused by writers; waitlist already includes it). Do not use `confirmed`. Do not use family-book `submitted` plus a fake slot.

Household stays `pending` until existing family onboarding (`/family/onboarding`) after invite — same as staff-created families.

---

### 7. How does `invite_token` prevent `ensureFamilyGuardian` from creating a duplicate household?

**Mechanism already in production for staff-created guardians.**

1. Public (or staff) insert writes `guardians.invite_token`, leaves `clerk_user_id` null, `invite_accepted_at` null.
2. Staff can rotate a token via `POST /api/staff/families/[id]/invite` (`src/app/api/staff/families/[id]/invite/route.ts`).
3. Parent opens `/invite/[token]` (`src/app/invite/[token]/page.tsx`). Page is public (`middleware.ts`). It does **not** mount `BootstrapSession`.
4. If signed out, UI sends them to `/sign-in?redirect_url=/invite/{token}`.
5. `POST /api/invite/[token]` (`src/app/api/invite/[token]/route.ts`) requires Clerk, loads guardian **by token**, sets `clerk_user_id = session.userId`, copies Clerk name/email, sets `invite_accepted_at`, clears `invite_token`.
6. Later `ensureFamilyGuardian` (`src/lib/auth/roles.ts`), called from `POST /api/bootstrap` on family/staff shells, selects `guardians` **where `clerk_user_id` equals the Clerk user**. Hit → update name/email only. **No new household.**

**Duplicate happens if bootstrap runs first:** `ensureFamilyGuardian` does **not** match by email. If the parent hits `/family` (or Clerk `signInFallbackRedirectUrl` `/post-login` → `/family`) **before** invite POST, bootstrap inserts a second `pending` household.

**Operational rule for this stage (no bootstrap code change):** Clerk redirect after sign-in from invite **must** return to `/invite/[token]`; accept **before** `/family`. Invite page already prefers `redirect_url`. Do not send invited parents through `/post-login` until token is accepted.

Optional later hardening (Option A does **not** require it): `ensureFamilyGuardian` email match to an unlinked guardian — that **would** touch first-login for all family users.

---

### 8. Public submit matches an existing guardian email/phone — auto vs staff review?

Copy **current staff policy**: `runMatch` is **advisory**. `POST /api/staff/families` does **not** block on matches. Merge is a **separate staff action** and **does not move** tutoring/bookings/payments.

**Do not invent:** auto-merge, auto-assign guardian onto another household, phone-only identity, or silent student-name matching.

| Situation | Auto | Staff review |
| --- | --- | --- |
| No `runMatch` candidates | Create household + guardian(s) + student + request-only tutoring row | No |
| Email/phone hits `staff_profiles` | Reject (`assertNotStaffAsGuardian`) | No (hard block, existing rule) |
| **Exactly one** candidate, `matchOn` includes **`email`** (exact `lower(email)`), household not `archived` | Reuse that `householdId` + `guardian.id`; insert a **new** `prospect` student; insert request `pending_staff_review`; **do not** create a second household | Staff confirm student is not a duplicate (no student identity matcher exists) |
| Phone-only match (`runMatch` uses digit `LIKE`) | **Do not** treat as the same person | Queue / flag; do not auto-reuse |
| Multiple candidates, or email match on two households | **Do not** create a second household (merge will not move the tutoring row) | Staff pick household in existing family UI; then add student + request |
| Second guardian email matches a **different** household | Do not attach that person as `parent_2` | Same as wizard copy: “Second guardian matches another household” (`staff-new-family-wizard.tsx`) |
| Matched household already has 2 guardians | Do not insert a third (`MAX_GUARDIANS_PER_HOUSEHOLD`) | Staff unassign/assign |
| Any reuse path | Never increment `booked_seats`, never `payment_records`, never `ensureFamilyGuardian` | Place slot later via existing staff scheduling |

**Demo E2E** is the **no-match** new-family path. Match/reuse can be a staff-visible flag on the request `payload` (`matchOn`, candidate ids) without auto-merge.

If a match cannot be applied safely, **still store the intent** only after a household+student exist — so either reuse the single email match, or do not insert a duplicate HH. Do not create a throwaway household “to have a request” expecting merge to fix it.

---

### 9. Regression surface — Option A vs Option B

**Option A (recommended)**

| Surface | Risk |
| --- | --- |
| `POST /api/staff/families` + `staff-new-family-wizard.tsx` | **None** if untouched |
| `POST /api/family/students` + family students UI | **None** if untouched |
| `POST /api/family/book-tutoring` + book wizard | **None** if untouched (public must not call it) |
| `POST /api/staff/scheduling/bookings` + scheduling UI | **None** if untouched |
| `ensureFamilyGuardian` / `POST /api/bootstrap` / family shell | **None** if untouched; duplicate HH only if invited users skip `/invite/[token]` (existing invite hazard) |
| `GET/POST /api/invite/[token]`, `/invite/[token]` | **None** if only reused; public must mint the same token shape |
| `GET/POST /api/staff/families/match` | **Low** only if `runMatch` is extracted and the route becomes a wrapper |
| `src/middleware.ts` | **Low** — add public register + API paths; mistake could open other routes |
| Waitlist report | **Low/intended** — new rows appear |
| Staff family/student directories | **Low/intended** — new `pending` households and `prospect` students |
| e2e `e2e/smoke.spec.ts` | **None** unless middleware breaks `/family` redirect / staff auth |
| Stripe / onboarding / enroll-courses | **None** |

**Option B**

Everything in Option A **plus**:

- Staff new family (billing owner flags, second guardian, invite paths)
- Staff add guardian / add student / assign student
- Family add student validation
- Family book: slot capacity, pending payment, Stripe PM
- Staff confirmed book
- Any test covering those journeys
- Possible display-name / billing-owner drift if extract is not byte-faithful

---

### 10. File-level change list — **Option A only**

Proposed names; exact paths can shift. **No schema migration** if `subjects` already has rows for mapped codes (`math`, `english`, `science`, `sat`, `act`, etc.).

#### Added

- `src/lib/booking/create-tutoring-request.ts` — request-only insert (`preferredSlotId` null, no booking)
- `src/lib/public-intake/ay-tutoring-registration.ts` — validate, match, create or reuse people, call request writer, mint invite tokens
- `src/app/api/public/ay-tutoring-registration/route.ts` — unauthenticated POST (rate-limit/spam later; not a new business rule)
- `src/app/register/academic-year-tutoring/page.tsx` — public form UI
- `src/components/public-ay-tutoring-registration-form.tsx` — client form using catalog options
- Optional: `src/lib/staff/family-match.ts` — extracted `findHouseholdMatchCandidates`
- Optional: `e2e/public-ay-registration.spec.ts` — unauthenticated submit (new family)

#### Modified

- `src/middleware.ts` — `isPublicRoute` includes `/register/academic-year-tutoring(.*)` and `/api/public/ay-tutoring-registration(.*)`
- `src/app/api/staff/families/match/route.ts` — **only if** match is extracted (auth + JSON wrapper). **Skip this file if** public duplicates match SQL (not preferred)

#### Schema / migrations

- **None** for request-only + people inserts on existing tables.
- `household_id`, `student_id`, `subject_id` already required; `preferred_slot_id` already nullable; booking optional.
- Do not add new status enums; use `pending_staff_review`.

#### Existing routes that remain untouched

- `POST /api/staff/families`
- `POST /api/staff/students`
- `POST /api/staff/families/[id]/guardians`
- `POST /api/family/students`
- `POST /api/family/book-tutoring`
- `POST /api/staff/scheduling/bookings`
- `POST /api/bootstrap` and `ensureFamilyGuardian`
- `GET/POST /api/invite/[token]` and `/invite/[token]` (reuse)
- `POST /api/staff/families/[id]/invite` (reuse to resend)
- Merge queue GET/POST and `.../merge` / `.../dismiss`
- Family onboarding, billing, enroll-courses

---

## Why A for this project right now

Working Staff create, Family students, Family book (slot + payment), and Staff scheduling book already ship. Public AY needs **storage of people + an unplaced request**, which those routes cannot do without the wrong side effects.

Option A adds that writer and a public door. Option B spends the same demo budget rewriting four working handlers. After the public E2E works, extracting people-create and switching booking routes onto `createTutoringRequest` + `claimSlotAndCreateBooking` is a clean follow-up — A does not block it.

---

## Out of scope (do not invent in v1)

- Zoho
- Gravity webhook parity beyond using the same catalog/`form_id`
- Auto-merge
- Public Stripe / `active` household / seat claim
- Changing `ensureFamilyGuardian` email matching (invite-first is enough if redirect is correct)
