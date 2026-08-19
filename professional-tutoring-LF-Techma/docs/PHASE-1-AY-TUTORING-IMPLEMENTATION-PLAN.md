# Phase 1 — Academic Year Tutoring implementation plan

**Status:** Plan only. Do not implement until this document is explicitly approved.  
**Date:** 2026-08-19  
**Repo:** `professional-tutoring-app`  
**Sources:** `PROFESSIONAL-TUTORING-FLOW-SOURCE-OF-TRUTH.md`, `docs/CURRENT-ARCHITECTURE-AUDIT.md`, `docs/PUBLIC-AY-TUTORING-REUSE-AUDIT.md`, `docs/AY-TUTORING-PUBLIC-INTAKE-OPTIONS.md`, plus live inspection of routes/schema listed below.

**Recommended architecture:** Option A — isolated public intake (new page + API + orchestration). Do not start Option B (extract/re-wire staff/family create and booking routes).

---

## Verdict (read this first)

Phase 1 can be built **without** calling `POST /api/family/book-tutoring` or `POST /api/staff/scheduling/bookings`.

Those two handlers are the **only** `insert(tutoringRequests)` sites today. Both always also `insert(bookings)`, increment `availability_slots.booked_seats`, and (family only) insert `payment_records` after requiring a Stripe payment method.

**Path A (family selects tutor + slot) in Phase 1 is a stored preference, not a booking.** Persist `tutoring_requests.preferred_slot_id` plus a `payload` snapshot. Do **not** increment `booked_seats`. Do **not** increment `held_seats` (column exists, never written; using it would invent a hold). Do **not** write `bookings` or `payment_records`.

**Path B (Let Professional Tutoring choose)** is a request-only row: `preferred_slot_id = null`. Staff later assigns using a **new** isolated endpoint that updates **that same request** and then creates the booking. Do **not** call staff scheduling POST (it always inserts a **second** `tutoring_requests` row).

No schema migration is required.

---

## 1. Current components Phase 1 will reuse

Legend: **Unchanged** = do not edit. **Modify** = listed in §11. **Call from new code** = reuse as a library or HTTP contract without changing the file (unless noted).

### 1.1 Routes

| Path | File | What it does today | Phase 1 reuse | Change? |
| --- | --- | --- | --- | --- |
| `POST /api/staff/families` | `src/app/api/staff/families/route.ts` | Staff-auth create: `households` `pending` + 1–2 `guardians` (`parent_1`/`parent_2`, `inviteToken: randomBytes(24).toString("hex")`) + optional name-only `students` `prospect`. Local `insertStudentFromDisplayName`. | Pattern only (address, timezone `America/New_York`, country US, invite token shape). Public must **not** HTTP-call this (staff auth). | Unchanged |
| `GET/POST /api/staff/families/match` | `src/app/api/staff/families/match/route.ts` | `getStaffContext()` then `runMatch` (email `lower(guardians.email)` exact; phone digit `LIKE` on guardian phone + `households.primaryPhone`). Advisory; create is not blocked. | Extract `runMatch` → `findHouseholdMatchCandidates` and keep this route as auth + JSON wrapper. Public orchestration calls the lib, not this HTTP. | Modify only if extract |
| `POST /api/staff/students` | `src/app/api/staff/students/route.ts` | Staff add prospect student to household | Pattern only | Unchanged |
| `POST /api/family/students` | `src/app/api/family/students/route.ts` | Authenticated full student profile (`firstName`/`lastName`/`schoolName`/`gradeLabel`/`graduationYear`/`gender`/`learningNeeds`); subjects written as **text** in `learning_needs`, not `student_subjects` | Field validation pattern for public student insert | Unchanged |
| `GET /api/family/book-tutoring/options` | `src/app/api/family/book-tutoring/options/route.ts` | Family-auth: subject+window → active tutors with `tutor_subjects` + open slots (`booked_seats + held_seats < capacity_seats` and `schedule_window_id = windowId`); tutor → slot list with `openSeats` | **Copy the SQL into a public helper.** Do not call this route (requires `getFamilyContext()`). | Unchanged |
| `POST /api/family/book-tutoring` | `src/app/api/family/book-tutoring/route.ts` | Requires active household, `canRequestServices`, `slotId`, Stripe PM via `resolveFamilyPaymentMethod`. Inserts request `submitted` + booking `pending_payment` + `booked_seats + 1` + `payment_records` `pending`. | **Do not call.** Proof it cannot book without inventing payment: it always requires `resolveFamilyPaymentMethod` and always writes a pending ledger. | Unchanged |
| `POST /api/staff/scheduling/bookings` | `src/app/api/staff/scheduling/bookings/route.ts` | Inserts **new** request `confirmed` + booking `confirmed` + `booked_seats + 1`. No payment. Always a new request. | **Do not call for Path B assignment** (duplicate request). Leave as staff calendar book. | Unchanged |
| `GET/POST /api/staff/tutors/[id]/availability` | `src/app/api/staff/tutors/[id]/availability/route.ts` | Staff CRUD weekly slots; `buildSlotSeats` occupancy from bookings in `held`/`pending_payment`/`pending_staff_review`/`confirmed` | Staff assignment UI can reuse occupancy math (`openSeats = capacity - booked - held`) | Unchanged |
| `PATCH .../availability/[slotId]` | `src/app/api/staff/tutors/[id]/availability/[slotId]/route.ts` | Patch slot | Unchanged | Unchanged |
| `GET/POST /api/invite/[token]` | `src/app/api/invite/[token]/route.ts` | Public GET by token; POST requires Clerk, sets `clerk_user_id`, clears `invite_token` | Reuse as-is after public mint | Unchanged |
| `POST /api/staff/families/[id]/invite` | `src/app/api/staff/families/[id]/invite/route.ts` | Rotate token, return `invitePath` | Staff resend | Unchanged |
| `POST /api/bootstrap` | `src/app/api/bootstrap/route.ts` | Calls `ensureFamilyGuardian` | Do **not** call from public submit | Unchanged |
| `GET /api/staff/exceptions` | `src/app/api/staff/exceptions/route.ts` | `change_requests` queue | **Wrong object.** Do not put tutoring assignment here. | Unchanged |
| `GET /api/staff/reports/[id]` waitlist | `src/lib/reports/queries/waitlist.ts` via reports API | Open `tutoring_requests` in `submitted`/`held`/`pending_staff_review` **with no confirmed booking** | Will start listing Phase 1 rows automatically. Href today: `/staff/students/{studentId}` | Optional href tweak |
| `/sign-in`, `/sign-up` | `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk widgets with **`forceRedirectUrl="/post-login"`** | Invite journey needs `redirect_url=/invite/{token}` to win | **Modify** (see §8) |
| `/post-login` | `src/app/post-login/page.tsx` | Hard nav to `/family` or `/staff` | Causes bootstrap duplicate if invite skipped | Unchanged except sign-in no longer forces this when invite redirect present |
| `/invite/[token]` | `src/app/invite/[token]/page.tsx` | Public; no `BootstrapSession`; sign-in with `redirect_url` | Reuse | Unchanged |
| `src/middleware.ts` | Clerk `isPublicRoute`: `/sign-in`, `/sign-up`, `/api/health`, `/invite`, `/api/invite` | Must allow public register URL + public APIs | **Modify** |

### 1.2 Pages / components

| File | Today | Phase 1 |
| --- | --- | --- |
| `src/components/book-tutoring-wizard.tsx` | Authenticated 7-step book: Student → Service → Plan → Tutor → Slot → Policy → Review; **submits book-tutoring + Stripe card** | **Do not mount on public form.** Reuse UX ideas (tutor/slot lists, catalog options) in a **new** public wizard without StripeCardSaver / book POST |
| `src/components/staff-new-family-wizard.tsx` | Match → household → guardians → students | Match policy copy; do not reuse as public UI |
| `src/components/add-student-wizard.tsx` | Family student fields | Field set reference |
| `src/app/staff/page.tsx` | Home “priority” queue is **payment_records** attention; if empty, **`previewQueueRows()` mock** (`PREVIEW_REQUEST_TOTAL = 12`) | Add a **real** “Needs tutor assignment” list from tutoring requests (do not keep showing mock once live assignment rows exist) |
| `src/app/staff/requests/[id]/page.tsx` | Exceptions (`change_requests`) via `StaffRequestReviewClient` | Unchanged; new assignment page elsewhere |
| `src/app/staff/reports/[id]/page.tsx` | Waitlist report UI | Unchanged except optional waitlist href |
| `src/components/family-shell.tsx` | Mounts `BootstrapSession` → `POST /api/bootstrap` | Unchanged; invite must complete **before** `/family` |

### 1.3 DB tables (no new tables)

| Table | Role in Phase 1 |
| --- | --- |
| `households` | Family. Insert `status: pending`. Never `active`. No Stripe columns. |
| `guardians` | Parent 1 / Parent 2. `clerk_user_id` null. `invite_token` set. |
| `students` | `lifecycle: prospect`. Profile columns already exist (school, grade, gender, `learning_needs`, `hours_rate_package`, `payment_plan`, etc.). |
| `subjects` | Required FK-in-practice for `tutoring_requests.subject_id`. Resolve via `catalogSubjectToDbCode` then `subjects.code`. Reject if no row (do **not** use the function’s `"math"` fallback for invalid input). |
| `tutor_subjects` + `tutors` | Path A compatibility |
| `availability_slots` | Path A display + Path B assignment capacity. Columns: `capacity_seats`, `booked_seats`, `held_seats`, `schedule_window_id`, `active`, `day_of_week`, times |
| `tutoring_requests` | **The Phase 1 write.** See §4–§6. |
| `bookings` | Path B **after staff assign only**. Never on public submit. Never Path A in Phase 1. |
| `payment_records` | **Not written** in Phase 1 public or Path A |
| `course_enrollments` / `course_offerings` | Out of scope |
| `identity_merge_requests` | Do not auto-queue from public unless you later choose to; Phase 1 flags in `payload` only |

### 1.4 Helpers / validation

| Function | File | Reuse |
| --- | --- | --- |
| `assertNotStaffAsGuardian` / `isStaffIdentity` | `src/lib/staff/staff-guardian-guard.ts` | Public emails |
| `isValidEmail` / `isValidPhone` | `src/lib/validation/contact.ts` | Contacts |
| `isValidOptionId` | `src/lib/forms/options.ts` | Catalog IDs |
| `ACADEMIC_SUBJECTS`, `ACADEMIC_SCHEDULE_WINDOWS`, `ACADEMIC_PAYMENT_PLANS`, `ACADEMIC_RATE_PACKAGES`, `ACADEMIC_ADVANCED_RATE_PACKAGES`, `REFERRAL_SOURCE`, `TEST_PREP_INTERESTS`, `GENDER`, `GRADE_LABELS`, `GRADUATION_YEARS`, `US_STATES`, `YES_NO`, `ALT_PAYMENT_METHODS` | `src/lib/forms/options.ts` | Form options |
| `FORM_META.academic_year_tutoring` | `src/lib/forms/form-profiles.ts` | `form_id`, title; `journey: "book_tutoring"` (do not use `enroll_courses`) |
| `fieldsForForm("academic_year_tutoring")` | `src/lib/forms/field-catalog.ts` | Field inventory §3 |
| `catalogSubjectToDbCode` | `src/lib/booking/subject-map.ts` | After `isValidOptionId("ACADEMIC_SUBJECTS", …)` |
| `nextAvailableRelationshipRole` / `assertUniqueRelationshipRole` / `setHouseholdBillingOwner` | `src/lib/staff/guardians.ts` | Parent 2 / billing owner |
| `MAX_GUARDIANS_PER_HOUSEHOLD` (= 2), `buildHouseholdDisplayName`, `refreshHouseholdDisplayNameIfAuto`, `HOUSEHOLD_COUNTRY_US` | `src/lib/staff/household-display-name.ts` | Naming |
| `queryWaitlistReport` | `src/lib/reports/queries/waitlist.ts` | Auto-lists new requests |
| `buildStaffSessionRows` | `src/lib/staff/sessions-list.ts` | Sessions UI is **bookings-derived**; request-only rows **will not** appear there until Path B assign. Correct. |

**Do not reuse**

| Function | Why |
| --- | --- |
| `ensureFamilyGuardian` | `src/lib/auth/roles.ts` — looks up **only** `guardians.clerk_user_id`; else **always new** `households` `pending` |
| `getFamilyContext` / `getStaffContext` | Clerk |
| `resolveFamilyPaymentMethod` | Stripe + family context |
| `buildQuote` / `insertPriceSnapshot` | Used by family book to price a **booking**; Phase 1 has no booking. Optional later display-only quote is Phase 2. |
| `courseCodeForFormId` / `src/lib/enrollment/course-map.ts` | SAT/ACT only (`FIRST-CLASS-2026` etc.) |

### 1.5 Tests

| File | Today | Phase 1 |
| --- | --- | --- |
| `e2e/smoke.spec.ts` | Unauth `/family` → sign-in; family/staff Clerk smokes | Regression: middleware must not break `/family` protect |
| `e2e/gravity-api.spec.ts` | Gravity-related | Unchanged; no Gravity webhook in Phase 1 |
| New `e2e/public-ay-registration.spec.ts` | — | Unauthenticated Path A/B submit |

---

## 2. Exact proposed family UX

Public URL: `/register/academic-year-tutoring`  
Family-facing labels only. Never show `tutoring_request`, `booking`, `availability_slot`, `household`, `payload`.

**Persistence rule:** wizard state is **client-only** until final Submit. One `POST /api/public/ay-tutoring-registration`. Back/Continue never writes DB.

### Step 0 — Landing

- **Sees:** Academic Year Tutoring intro (from `FORM_META.academic_year_tutoring.title`; do not dump the WordPress URL as the primary CTA).
- **Enters:** nothing.
- **Catalog:** none.
- **Validate:** none.
- **Persist:** none.
- **Continue:** Start registration.

### Step 1 — Student

- **Sees:** Student information.
- **Enters:** first name, last name, school, grade, graduation year, gender. Optional: student cell, student email (columns exist; catalog `required: "pending"` — collect if on the current AY form, store on `students`).
- **Catalog:** `GRADE_LABELS`, `GRADUATION_YEARS`, `GENDER`.
- **Validate:** required names/school/grade/year/gender via `isValidOptionId` where listed.
- **Do not collect in Phase 1 UI:** birthdate / 504 / IEP (`owner: "restricted"`, `required: "pending"`).
- **Back/Continue:** client draft.

### Step 2 — Parent(s) and billing contact

- **Sees:** Parent 1 (required), Parent 2 (optional), “Who should we bill?”, household address.
- **Enters:** names, emails, phones; address line/city/state/ZIP; billing owner = Parent 1 or Parent 2 (exactly one).
- **Catalog:** `US_STATES`.
- **Validate:** `isValidEmail`, `isValidPhone` when phone present; `assertNotStaffAsGuardian` on submit for both emails.
- **Persist:** none until submit.
- **Copy:** do not say “guardian.”

### Step 3 — Tutoring needs

- **Sees:** subjects, notes, test-prep interests, “How did you hear about us?”
- **Enters:** at least one subject (checkboxes from `ACADEMIC_SUBJECTS`); optional notes; optional `TEST_PREP_INTERESTS`; required `REFERRAL_SOURCE` (catalog `required: true`).
- **Matching subject:** the **first selected subject** is the one used to load tutors (same constraint as family book: one `subject_id` on the request). Extra subjects go in `payload.additionalSubjectCodes` and `students.learning_needs` text (same pattern as `POST /api/family/students`).
- **Validate:** `isValidOptionId("ACADEMIC_SUBJECTS" | "REFERRAL_SOURCE" | "TEST_PREP_INTERESTS")`.

### Step 4 — Schedule (branch)

**Sees two equal choices (plain language):**

1. **Choose a tutor and time** (Path A)
2. **Let Professional Tutoring choose my tutor** (Path B)

#### Path A — after choosing (1)

- **Sees:** preferred day/time window (`ACADEMIC_SCHEDULE_WINDOWS`, one window at a time to match slot `schedule_window_id`); then tutors who teach that subject **and** have at least one open seat in that window; then times for the selected tutor with remaining seats. Full slots labeled **Full** and not selectable (query already omits `openSeats < 1`; if we also list full slots for honesty, disable them).
- **Enters:** one window, one tutor, one slot.
- **Loads:** `GET /api/public/ay-tutoring-availability?subjectCode=&windowId=&tutorId=` (new; same filters as family options).
- **Validate client:** slot selected. Server re-checks capacity at submit **without claiming**.
- **Copy:** “We’ll save your preferred time. Your place is confirmed after payment in a later step.” Do **not** say “booked.”
- **If no tutors/slots:** explain and offer Path B.

#### Path B — after choosing (2)

- **Sees:** preferred windows (catalog is `checkbox_group` — allow multiple) + optional schedule notes.
- **Enters:** ≥1 window id and/or notes.
- **No tutor/slot widgets.**
- **Copy:** “We’ll match a tutor and time. You’ll hear from Professional Tutoring.”

### Step 5 — Plan and billing preferences (not payment)

- **Sees:** standard hours/rates, advanced hours/rates, payment plan, optional auto-charge yes/no, optional alternate payment method.
- **Catalog:** `ACADEMIC_RATE_PACKAGES`, `ACADEMIC_ADVANCED_RATE_PACKAGES`, `ACADEMIC_PAYMENT_PLANS`, `YES_NO`, `ALT_PAYMENT_METHODS`.
- **Required:** `ACADEMIC_PAYMENT_PLANS` (catalog `required: true`). Rate packages are catalog `pending` — collect if present on the live AY form; store in payload + `students.hours_rate_package` / `advanced_hours_rate_package` when provided.
- **Does not:** collect card numbers, mount `StripeCardSaver`, call SetupIntent, or say they have been charged.

### Step 6 — Policy and agreement

- **Sees:** policy acknowledgement + agreement (catalog `policy_ack`, `consent_agreement`).
- **Enters:** both must be checked.
- **Validate:** `policyAck === true` and `agreementAck === true` on submit.
- **Persist on submit:** `tutoring_requests.agreement_accepted_at = now()`; `policy_version_id` if an active `cancellation_policy_versions` row exists (same optional pattern as bookings; if none, leave null — do not invent a version).

### Step 7 — Review and submit

- **Sees:** student, parents, subject, Path A preferred tutor/time **or** Path B “PT will choose”, plan labels, “not charged today.”
- **Submit:** single POST.
- **Success:** confirmation page with household-facing “we received your registration,” Path A/B summary, and **invite link(s)** (`/invite/{token}`) plus instruction to sign in **on that page** to join the family portal. Staff also see the same path on family detail (`invitePath` already returned by staff family GET).
- **Failure:** inline errors; keep wizard state. 409 Path A slot full: stay on schedule step.

### What differs Path A vs B (family)

| | Path A | Path B |
| --- | --- | --- |
| Tutor/slot UI | Yes | No |
| Stored slot | `preferred_slot_id` + payload | null |
| Seat | Not claimed | Not claimed until staff assign |
| Staff next action | Not “pick a tutor” unless identity review | Assign tutor + time |

---

## 3. Public form fields vs app model

Source: `src/lib/forms/field-catalog.ts` filtered by `academic_year_tutoring`, plus `students` / `guardians` / `households` / `tutoring_requests` columns in `src/lib/db/schema.ts`.

### Already supported and reusable (wire into public form)

| Catalog / need | Store on |
| --- | --- |
| Student first/last (`student_name`) | `students.first_name`, `last_name`, `display_name` |
| School, grade, graduation year, gender | `students.school_name`, `grade_label`, `graduation_year`, `gender` |
| Household address + state | `households.address_line1/2`, `city`, `state`, `postal_code`, `country` |
| Parent 1 / Parent 2 | `guardians` `parent_1` / `parent_2` |
| Billing owner | `guardians.is_billing_owner` + `households.billing_owner_guardian_id` |
| Referral | `tutoring_requests.referral_source` |
| Subject (primary) | `tutoring_requests.subject_id` + `payload.catalogSubjectCode` |
| Subject notes | `tutoring_requests.subject_notes` |
| Test prep | `payload.testPrepInterests` (family book already uses this JSON shape) |
| Schedule window (column is singular) | `tutoring_requests.schedule_window_id` + `payload.preferredWindowIds` |
| Schedule notes | `tutoring_requests.schedule_notes` |
| Payment plan | `tutoring_requests.payment_plan_id`, `package_label`, `students.payment_plan` |
| Rate packages | `students.hours_rate_package`, `advanced_hours_rate_package`, payload |
| Policy/agreement timestamps | `agreement_accepted_at` |
| `form_id` | `"academic_year_tutoring"` |
| Auto-charge preference | `households.auto_charge` boolean **only as stored preference**; do not run a charge job (column exists, unwired) |

### Supported but needs UI/wiring (no migration)

| Item | Gap | Phase 1 wiring |
| --- | --- | --- |
| Live tutor/slot pick | Public site has no availability UI; family wizard is authenticated + books | New public availability GET + Path A UI |
| “Let PT choose” | No writer of request-without-booking | New `createTutoringRequest` |
| Multiple Gravity subject checkboxes vs one `subject_id` | Family book is single `subjectCode` | Primary for matching; extras in payload + `learning_needs` |
| Multiple preferred windows vs one `schedule_window_id` | Family book single `windowId` | Path A: the window of the selected slot. Path B: first window in column, all in payload |
| Invite after public create | Tokens exist; **no email sender** in repo | Confirmation + staff copy of `/invite/{token}` (same as staff family create) |
| Staff assignment of **existing** request | Staff book always inserts a new request | New assign endpoint |
| Staff home queue | Payment mock when empty | Live assignment rows |
| Clerk invite redirect | `forceRedirectUrl="/post-login"` | Honor invite `redirect_url` |

### Genuinely missing / do not invent in Phase 1

| Item | Why |
| --- | --- |
| Birthdate, 504/IEP, restricted accommodation dumps | Catalog `restricted` / `pending`; do not add a new privacy model |
| Stripe charge, PaymentIntent, subscriptions | Phase 2; Path B charge timing unresolved in source of truth |
| Zoho / Acuity / QuickBooks | Later phases |
| Gravity webhook ingest | Not in this app |
| Outbound invite email | No mailer/env in repo |
| `held_seats` reservation | Never incremented; would consume capacity without a booking |
| `student_subjects` rows | Family add-student also skips this; do not silently start writing unless we also fix family path (out of Phase 1 scope) |
| Dated session occurrences / `sessions` table | Must not add |
| Unique student identity matcher | Does not exist; staff reviews possible duplicate students |

---

## 4. Exact Path A design

Flow: **subject (primary) → window → compatible tutors with open seats → slot with remaining seats → store preference on the request → stop.**

### Tutor compatibility (existing query)

From `src/app/api/family/book-tutoring/options/route.ts` (to be extracted to e.g. `src/lib/booking/open-slots-for-subject-window.ts`, callable without Clerk):

1. `catalogSubjectToDbCode(subjectCode)` → `subjects` row by `code`.
2. `tutors` `active = true` inner join `tutor_subjects` on that `subject_id`.
3. For each tutor, `availability_slots` where `tutor_id`, `active`, `schedule_window_id = windowId`, and  
   `booked_seats + held_seats < capacity_seats`.
4. Tutors with `openSlotRows.length > 0` are listed (`openSlots` count).
5. For selected `tutorId`, return slots with  
   `openSeats = capacity_seats - booked_seats - held_seats`.

Staff availability `buildSlotSeats` is occupancy display only; public Path A does not need numbered seats.

### Capacity

- **Live remaining:** `capacity_seats - booked_seats - held_seats`.
- **Full:** `openSeats <= 0` → not selectable. Family book returns **409** `"Selected slot is no longer available."` when the same SQL finds no row.
- **`held_seats`:** always 0 in writers today; still include it in the inequality so we stay consistent with family/staff book.

### Availability change while filling the form

- Options GET is live on each window/tutor change.
- On final POST, **re-run the open-slot predicate**. If the chosen `slotId` fails:
  - **Do not** write `bookings` / seats / payments.
  - **Do not** fail the whole registration if people were not yet inserted: validate slot **before** inserts when Path A.
  - Return **409** with a family-safe message (“That time is no longer open. Please choose another.”). Keep client draft.
- If people+request already need to be saved (only if we insert people first): fall back to Path B shape (`preferred_slot_id` null, `payload.familySelectionLost: true`). Prefer **validate slot → insert people → insert request** in **one DB transaction** so we never create a household without a request on 409.

### Where the selection is stored (Phase 1) — decided from schema

| Place | Use? | Why |
| --- | --- | --- |
| `tutoring_requests.preferred_slot_id` | **Yes** | Nullable UUID; already used by family book to point at `availability_slots.id`. Does **not** claim a seat. |
| `tutoring_requests.payload` | **Yes** | Snapshot: `schedulingPath: "family_selected"`, `tutorId`, `slotId`, `windowId`, `tutorDisplayName`, `dayOfWeek`, `startTimeLocal`, `endTimeLocal`, `openSeatsAtSubmit`. Survives if the slot row is later deactivated. |
| `tutoring_requests.schedule_window_id` | **Yes** | The window of the selected slot. |
| `bookings` | **No** | Would consume a seat via current writers (`seats_claimed` + `booked_seats + 1`). |
| `availability_slots.booked_seats` | **No** | Seat claim. |
| `availability_slots.held_seats` | **No** | Unused; incrementing it would block others without a booking — a new hold product. |
| `payment_records` | **No** | Family book always creates `pending` after Stripe PM. |

**Why this is safe:** schema allows a request with `preferred_slot_id` set and **zero** bookings (`bookings.tutoring_request_id` is nullable; no `booking_id` on requests). Waitlist already treats open request statuses without a **confirmed** booking as waitlist. Staff sessions list will **not** show the student as occupying the slot until a booking exists — which is what we want.

**Stale preference risk:** another family can still book that slot via authenticated `book-tutoring` or staff scheduling. Phase 1 accepts that (no hold). Staff assignment UI for Path B and Phase 2 Path A book must re-check capacity. Payload snapshot still shows what the family asked for.

**Do not call `POST /api/family/book-tutoring`:** it cannot “book without inventing payment.” Required body includes `slotId` **and** it always calls `resolveFamilyPaymentMethod` then inserts `payment_records`. Household must be `active`. Public households are `pending`.

---

## 5. Exact Path B design

Family copy: **Let Professional Tutoring choose my tutor.**

### Request row on public submit

| Field | Value |
| --- | --- |
| `household_id` | created or reused |
| `student_id` | created |
| `subject_id` | resolved primary subject |
| `requested_by_guardian_id` | Parent 1 |
| `status` | `pending_staff_review` (enum already exists; unused by current writers; included in waitlist `OPEN_REQUEST_STATUSES`) |
| `preferred_slot_id` | **null** |
| `form_id` | `academic_year_tutoring` |
| `schedule_window_id` | first preferred window id, or null if only notes |
| `payment_plan_id` | catalog id |
| `package_label` | same plan id (family book does this) |
| `schedule_notes` / `subject_notes` / `referral_source` | as entered |
| `payload.schedulingPath` | `"pt_chooses"` |
| `payload.preferredWindowIds` | array |
| `payload.source` | `"public_ay_tutoring"` |
| Booking / seats / payment | **none** |

Do **not** use `confirmed` (that is staff book after a real seat). Do **not** use family-book `submitted` plus a fake slot.

### Where Staff sees it

1. **Primary (new):** Staff Home section **Needs attention — tutor assignment** (not the payment mock queue). Rows: `form_id = academic_year_tutoring`, `status = pending_staff_review`, `preferred_slot_id IS NULL`, no `bookings` row (or no booking in occupying statuses).
2. **Existing:** Reports → Waitlist (`queryWaitlistReport`) — both Path A and B appear (`pending_staff_review`, no confirmed booking).
3. **Not:** `/staff/requests/[id]` (exceptions / `change_requests`).
4. **Not:** Sessions week (`buildStaffSessionRows`) until a booking exists.

### Distinguished from Path A / completed

| Case | How |
| --- | --- |
| Path B | `payload.schedulingPath === "pt_chooses"` AND `preferred_slot_id` null |
| Path A saved selection | `payload.schedulingPath === "family_selected"` AND `preferred_slot_id` set, still no booking |
| Identity needs review | `payload.identityReview` in `phone_only` \| `ambiguous` \| `second_guardian_conflict` |
| Completed placement | `tutoring_requests.status = confirmed` **and** a `bookings` row (Path B after assign). Path A stays unbooked until Phase 2 |

Path A does **not** use the Assign tutor action (source of truth: do not make staff re-pick). Staff can open the family/student record. If the preferred slot is now full, staff uses the **same assign UI** as Path B (re-pick) — that is a human decision.

### Assignment action (Path B)

1. Staff opens `/staff/tutoring-requests/[id]` (new).
2. UI shows student name, subject, preferred windows/notes, compatible tutors/slots using the **same open-slot helper** as Path A (subject + each preferred window). Show remaining seats; label Full.
3. Staff selects tutor + slot.
4. `POST /api/staff/tutoring-requests/[id]/assign` (new, `getStaffContext()`):
   - Load request by id; abort if cancelled or already has an occupying booking.
   - Re-validate slot: active, same tutor, `booked + held < capacity` (same SQL as staff scheduling POST, plus optional window match if `schedule_window_id` set).
   - **Update** this `tutoring_requests` row: `preferred_slot_id = slotId`, `status = confirmed`, payload `assignedByStaffId`, `assignedAt`.
   - **Insert one** `bookings` row: `tutoring_request_id = request.id`, `status = confirmed`, `seats_claimed = 1`, `tutor_id`, `slot_id`, `confirmed_by_staff_id`, `confirmed_at`.
   - `booked_seats + 1` on that slot.
   - **No** `payment_records` (matches current `POST /api/staff/scheduling/bookings`).
5. Request leaves the assignment queue (status no longer `pending_staff_review`; waitlist skips **confirmed** bookings).

**Explicit: this does not insert a second `tutoring_requests` row.** That is why we cannot use `POST /api/staff/scheduling/bookings`.

---

## 6. Booking and seat-capacity semantics

### Current writers (do not change in Phase 1)

**Family `POST /api/family/book-tutoring`** order, **no transaction**:

1. `insert(tutoring_requests)` `status: submitted`, `preferred_slot_id: slotId`
2. `insert(bookings)` `status: pending_payment`, `seats_claimed: 1`
3. `update availability_slots set booked_seats = booked_seats + 1`
4. `insert(payment_records)` `pending`, `related_entity_type: booking`

Capacity check is a **read** (`booked + held < capacity`) then later increment — **not atomic**. Concurrent family books can theoretically overbook.

**Staff `POST /api/staff/scheduling/bookings`:** same seat increment, request `confirmed`, booking `confirmed`, no payment, **new** request every time. Also not transactional.

Occupying booking statuses used by staff availability grid: `held`, `pending_payment`, `pending_staff_review`, `confirmed` (`OCCUPIED_BOOKING_STATUSES`).

### What Phase 1 will not change

- Family book-tutoring pipeline
- Staff scheduling book pipeline
- `held_seats` behavior (still unused)
- Course `enrolled_count`

### What Phase 1 adds (isolated)

| Operation | Seat? | Atomicity |
| --- | --- | --- |
| Public `createTutoringRequest` Path A/B | No | Wrap **people + request** in one transaction |
| Staff `assign` to existing request | Yes, `booked_seats + 1` | Wrap **update request + insert booking + increment** in one transaction (new code only; do not retrofit old routes) |

### Concurrent Path A selections

Two families can store the **same** `preferred_slot_id`. That is acceptable: it is not a reservation. First **booking** writer to pass the capacity SQL + increment wins. The other 409s at book/assign time.

### Overbooking prevention in Phase 1

- Public: none (no increment).
- Staff assign: same predicate as existing staff book, plus a transaction on the new path.
- Do not refactor family/staff book “for cleanliness.”

### Slot full before Path A submit

409; no request/people if transaction rolls back; user picks another slot or Path B.

---

## 7. Family / Guardian / Student creation and reuse

Public orchestration: `src/lib/public-intake/ay-tutoring-registration.ts`. Never `ensureFamilyGuardian`. Never merge execute.

Match: extracted `findHouseholdMatchCandidates({ email, phone })` from current `runMatch`.

| Case | Automatic | Staff review |
| --- | --- | --- |
| **New family** — no match | Insert household `pending`; Parent 1 (+ optional Parent 2); billing owner; student `prospect`; request; invite tokens | No |
| **Exact one email match** (`matchOn` includes `email`), household not `archived` | Reuse `householdId` + matched `guardian.id` as requester; **insert new** prospect student; insert request; **do not** second household; **do not** merge | Confirm student is not a duplicate (no student matcher). `payload.identityReview: "student_unverified"` |
| **Phone-only match** | **Do not** reuse. **Do not** create a throwaway household either if that would duplicate a likely same family — **hold submit**: return `needsStaffIdentityReview` with candidate ids, **or** store nothing and tell the parent staff will contact them. **Safer for demo:** reject auto-create with 409 `ambiguous_identity` and write **no** rows; staff uses existing family wizard. Flag is not a DB row if we write nothing. | Yes — staff creates/links in existing UI |
| **Multiple candidates / email on two households** | Same as phone-only: **do not** insert | Staff pick household in existing family UI, then add student + request manually or via a later staff tool |
| **Staff email** | `assertNotStaffAsGuardian` → 400 | No |
| **Parent 2 present, new family** | Insert `parent_2` with own invite token | — |
| **Parent 2 email matches a different household** | Do not attach as `parent_2`. Create Parent 1 household + request; `payload.identityReview: "second_guardian_conflict"`; omit Parent 2 insert | Staff add/assign guardian later (`POST .../guardians` / assign) |
| **Matched household already has 2 guardians** | Do not insert a third (`MAX_GUARDIANS_PER_HOUSEHOLD`). Reuse household + add student + request using matched guardian | Staff unassign/assign if needed |
| **Potential duplicate student** (same household, similar name) | Still insert (no matcher). Payload note | Staff archive/merge people only (merge **does not** move tutoring_requests — another reason not to create a duplicate household) |

**Demo E2E** is the no-match new-family path.

---

## 8. Guardian invitation / Clerk flow

### Intended lifecycle

1. Public POST inserts `guardians.invite_token` (same `randomBytes(24).toString("hex")` as `POST /api/staff/families`), `clerk_user_id` null, `invite_accepted_at` null.
2. Confirmation page shows `/invite/{token}` (and Parent 2’s token if created).
3. Parent opens `/invite/[token]` (`src/app/invite/[token]/page.tsx`) — **public**, **no** `BootstrapSession`.
4. If signed out, page does `router.push(/sign-in?redirect_url=/invite/{token})`.
5. After sign-in, `POST /api/invite/{token}` sets `clerk_user_id`, copies Clerk name/email, sets `invite_accepted_at`, clears token.
6. Then parent may go `/family`. `ensureFamilyGuardian` finds `clerk_user_id` → **no new household**.

Staff can rotate via existing `POST /api/staff/families/[id]/invite`.

There is **no transactional email**. Phase 1 invitation = token + URL, same as staff create today.

### Duplicate-household risk (already in production)

`ensureFamilyGuardian` (`src/lib/auth/roles.ts`) does **not** match by email. If a Clerk user hits `/family` (via `family-shell` → `BootstrapSession` → `POST /api/bootstrap`) **before** invite POST, it inserts a **second** `pending` household.

**Amplifying bug (live code):** both SignIn and SignUp set **`forceRedirectUrl="/post-login"`**, and `ClerkProvider` uses `signInFallbackRedirectUrl="/post-login"`. `/post-login` always sends family users to `/family`. That **overrides** the invite page’s `redirect_url` query. So the “operational rule” in the intake-options audit (return to `/invite/{token}`) **does not work today**.

### Phase 1 prevention (smallest Clerk change — not a redesign)

1. Remove `forceRedirectUrl="/post-login"` from `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx`. Keep `fallbackRedirectUrl="/post-login"` so normal logins still work.
2. Confirmation copy: “Open your invite link and finish joining **before** opening the family portal.”
3. Do **not** change `ensureFamilyGuardian` email matching in Phase 1 (that would affect all first logins).
4. Do not send invited parents to `/` (`src/app/page.tsx` also redirects to `/post-login`).

Optional hardening later (out of Phase 1): `ensureFamilyGuardian` email match to unlinked guardian.

---

## 9. Staff UX

Goal: Staff mainly see **human work**.

### Assignment queue (Path B + identity flags)

| | |
| --- | --- |
| **Where** | Staff Home (`src/app/staff/page.tsx`) new block **Needs attention**, plus list page `/staff/tutoring-requests` |
| **Reuse waitlist?** | Waitlist report already lists these rows but is a report (age buckets, href to student). Keep it. Do **not** treat it as the assignment UI. |
| **Do not reuse** | Payment priority queue (`paymentAttentionRows`); `previewQueueRows()` mock; `/staff/requests/[id]` exceptions |
| **Columns** | Student name, family name, subject, Path B vs identity flag, preferred windows (humanized via `ACADEMIC_SCHEDULE_WINDOWS`), age, status `pending_staff_review` |
| **Statuses shown** | `pending_staff_review` without occupying booking |
| **Action** | **Assign tutor** → `/staff/tutoring-requests/[id]` |
| **Assignment UI** | Compatible tutors / slots / remaining seats / Full (source-of-truth sketch). Confirm → new assign POST |
| **Leaves queue** | After assign: request `confirmed` + booking `confirmed` |

### Path A on staff side

- Appears on **Waitlist** until a confirmed booking exists.
- Home assignment queue: **exclude** `payload.schedulingPath === "family_selected"` with a still-open `preferred_slot_id`, unless `identityReview` is set or the preferred slot is now full (`openSeats <= 0`) — then show **Preferred time is full — choose another**.
- No payment queue row (no `payment_records`).

### What already exists vs new

| Exists | New |
| --- | --- |
| Waitlist report read model | Home assignment list from live `tutoring_requests` |
| Tutor/slot SQL in family options | Staff assign page + POST |
| Staff scheduling book (new request) | Must not be the Path B action |
| Mock home queue when no payment issues | Stop using mock when assignment rows exist (if both empty, mock may still show — prefer hiding mock when we have a live tutoring query even if length 0, so staff are not trained on fake names) |

---

## 10. Payment / billing boundary for Phase 1

### Collect and persist now (choices only)

- `ACADEMIC_PAYMENT_PLANS` → `tutoring_requests.payment_plan_id` / `package_label` / `students.payment_plan`
- Rate package ids → student columns + payload
- `households.auto_charge` from yes/no **preference** only
- `payload.altPaymentMethod` if collected
- Billing contact = billing owner guardian (name/email/phone/address)

### Reuse Stripe now?

**No.** `StripeCardSaver` / `POST /api/family/billing/setup-intent` require an authenticated family household with Stripe customer creation. Public household is `pending`, no Clerk. Source of truth: do not invent charging. Do not mount card collection on the public form.

### Must wait for Phase 2

- PaymentIntent / charges / webhooks / receipts
- Subscriptions / monthly auto-charge **execution**
- Whether Path A selection becomes a booking at payment time
- Whether Path B charges before or after assignment (source of truth §16 / known open decision #1)
- `resolveFamilyPaymentMethod` / family book-tutoring
- `payment_records` from public intake
- Price snapshots at public submit (optional display of catalog labels is enough)

### Where Phase 1 stops

```text
Public submit
  → people + tutoring_requests (+ preferred_slot_id on Path A)
  → invite URL
  → Staff assign Path B → bookings + booked_seats
STOP. No Stripe. No Acuity. No Zoho. No QBO.
```

---

## 11. Exact file-level implementation plan

### New files

| File | Exact change | Why | Risk |
| --- | --- | --- | --- |
| `src/lib/booking/create-tutoring-request.ts` | Insert `tutoring_requests` only; allow `preferredSlotId` null or set; never booking/seats/payment | Shared primitive | Low |
| `src/lib/booking/open-slots-for-subject-window.ts` | Move/copy family options SQL (tutors + open slots) | Public + staff assign | Low if predicate copied faithfully |
| `src/lib/staff/family-match.ts` | `findHouseholdMatchCandidates` from `runMatch` | One match implementation | Low |
| `src/lib/public-intake/ay-tutoring-registration.ts` | Validate, match policy, create/reuse people, mint tokens, call `createTutoringRequest` | Option A orchestration | Medium (identity rules) |
| `src/lib/booking/assign-tutoring-request.ts` | Update existing request + insert booking + increment seats in one transaction | Path B without duplicate request | Medium (capacity) |
| `src/app/api/public/ay-tutoring-registration/route.ts` | Unauthenticated POST | Public door | Spam (rate-limit later, not a business rule) |
| `src/app/api/public/ay-tutoring-availability/route.ts` | Unauthenticated GET subject/window/tutor | Path A UI | Low (exposes open hours, not PII) |
| `src/app/api/staff/tutoring-requests/route.ts` | GET assignment queue | Staff home/list | Low |
| `src/app/api/staff/tutoring-requests/[id]/route.ts` | GET detail | Assign page | Low |
| `src/app/api/staff/tutoring-requests/[id]/assign/route.ts` | POST assign | Path B book | Medium |
| `src/app/register/academic-year-tutoring/page.tsx` | Public page | UX | Low |
| `src/app/register/academic-year-tutoring/confirmation/page.tsx` | Success + invite URLs (token in query or POST response rendered client-side) | Invitation | Low (token in URL like staff invitePath) |
| `src/components/public-ay-tutoring-registration-form.tsx` | Wizard §2 | UX | Medium |
| `src/app/staff/tutoring-requests/page.tsx` | List | Staff | Low |
| `src/app/staff/tutoring-requests/[id]/page.tsx` | Assign UI | Staff | Low |
| `src/components/staff-tutoring-request-assign-client.tsx` | Client assign | Staff | Low |
| `e2e/public-ay-registration.spec.ts` | Unauth Path B (and Path A if seed slots exist) | Acceptance | Env/DB dependent |

### Modified files

| File | Exact change | Why | Risk |
| --- | --- | --- | --- |
| `src/middleware.ts` | Add `/register/academic-year-tutoring(.*)`, `/api/public/ay-tutoring-registration(.*)`, `/api/public/ay-tutoring-availability(.*)` to `isPublicRoute` | Unauth access | **High if matcher too broad** — use those prefixes only |
| `src/app/api/staff/families/match/route.ts` | Import extracted match; keep staff auth | DRY | Low |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Remove `forceRedirectUrl` | Invite redirect | Medium — confirm normal login still hits `/post-login` via fallback |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Same | Invite + new Clerk user | Medium |
| `src/app/staff/page.tsx` | Live assignment queue; do not prefer mock over live tutoring needs | Staff sees Path B | Medium (dashboard is large) |
| `src/lib/reports/queries/waitlist.ts` | Optional: href → `/staff/tutoring-requests/{id}` for tutoring rows | Faster assign | Low |

### Existing files reused unchanged (important)

Do **not** edit:

- `src/app/api/staff/families/route.ts` (`POST`)
- `src/app/api/staff/students/route.ts`
- `src/app/api/staff/families/[id]/guardians/route.ts`
- `src/app/api/family/students/route.ts`
- `src/app/api/family/book-tutoring/route.ts`
- `src/app/api/family/book-tutoring/options/route.ts` (logic copied out, file stays)
- `src/app/api/staff/scheduling/bookings/route.ts`
- `src/app/api/bootstrap/route.ts`
- `src/lib/auth/roles.ts` (`ensureFamilyGuardian`)
- `src/app/api/invite/[token]/route.ts`
- `src/app/invite/[token]/page.tsx`
- `src/app/api/staff/families/[id]/invite/route.ts`
- Merge queue / merge / dismiss routes
- Family onboarding, billing, enroll-courses
- `src/lib/enrollment/course-map.ts`
- `src/lib/db/schema.ts` (no migration)
- `src/components/book-tutoring-wizard.tsx`

### Schema / migrations

**None.**

---

## 12. Schema impact

**No schema change. No migration.**

| Need | Already on `tutoring_requests` |
| --- | --- |
| Request without booking | No `booking_id`; bookings optional |
| Path A selection without seat | `preferred_slot_id` nullable |
| Path A/B discriminator + extras | `payload` jsonb |
| Windows / plan / form | `schedule_window_id`, `payment_plan_id`, `form_id` |
| Status for staff queue | `pending_staff_review` already in `tutoring_request_status` enum |

Previous audits said request-only is schema-legal. Live `schema.ts` confirms. Path A **does** set `preferred_slot_id` in Phase 1 (user correction). That is still not a booking.

Do **not** add columns for “hold,” “selection,” or sessions.

---

## 13. Implementation sequence

Each step leaves current Staff/Family book/create working.

### Step 1 — Public middleware + empty page

- **Files:** `src/middleware.ts`, `src/app/register/academic-year-tutoring/page.tsx` (placeholder)
- **Test:** Unauth GET page 200; `/family` still redirects to sign-in (`e2e/smoke.spec.ts`)
- **Depends on:** nothing

### Step 2 — Extract match + open-slot helper (behavior-preserving)

- **Files:** `src/lib/staff/family-match.ts`, match route wrapper; `src/lib/booking/open-slots-for-subject-window.ts` (family options can stay duplicated until a later cleanup — **do not** rewire family options in this step unless the extract is byte-faithful)
- **Test:** Staff match GET still returns candidates; helper unit/manual: subject+window returns same tutor ids as family options for a seeded tutor
- **Depends on:** Step 1 not required

### Step 3 — `createTutoringRequest` + public POST people+request (Path B only in UI)

- **Files:** `create-tutoring-request.ts`, `ay-tutoring-registration.ts`, public POST route, public form Steps 1–3, 4 Path B, 5–7
- **Test:** Scenario B (new family, PT chooses): DB has household `pending`, guardians+token, student `prospect`, one request `pending_staff_review`, `preferred_slot_id` null, **zero** bookings, **unchanged** `booked_seats`
- **Depends on:** Step 2 match

### Step 4 — Invite redirect fix

- **Files:** sign-in / sign-up pages
- **Test:** Open `/sign-in?redirect_url=/invite/dummy` after login lands on invite URL (or 404 invite), **not** immediately `/family` bootstrap
- **Depends on:** Step 3 tokens

### Step 5 — Path A availability GET + wizard branch

- **Files:** public availability route, form Path A steps
- **Test:** Scenario A: submit stores `preferred_slot_id` + payload; seats unchanged
- **Test:** Scenario F: fill slot via staff book in another session, Path A 409, no extra household if transaction rolls back
- **Depends on:** Step 3

### Step 6 — Staff queue + assign (Path B → booking)

- **Files:** staff APIs, assign lib, staff pages, staff home
- **Test:** Scenario C: assign updates **same** request id, one booking, `booked_seats + 1`, waitlist drops it
- **Depends on:** Step 3

### Step 7 — Identity cases + e2e/regression

- **Files:** orchestration flags; `e2e/public-ay-registration.spec.ts`
- **Test:** Scenarios D–E; smoke staff family / family students / family book / staff book / courses / invite / onboarding
- **Depends on:** Steps 3–6

Stop after Step 3 and the app still works; public Path B demo exists. Stop after Step 6 and Path B is operationally usable.

---

## 14. Testing plan

### Scenario A — New family, parent chooses tutor/slot

1. Unauth open `/register/academic-year-tutoring`.
2. Complete student, Parent 1, subject, Path A, window with a seeded open slot, tutor, slot, payment plan, acks.
3. Submit 200.
4. Assert: 1 household `pending`; 1 guardian `invite_token` set, `clerk_user_id` null; 1 student `prospect`; 1 `tutoring_requests` `form_id=academic_year_tutoring`, `status=pending_staff_review`, `preferred_slot_id=<that slot>`, `payload.schedulingPath=family_selected`; **0** `bookings`; slot `booked_seats` unchanged; **0** `payment_records`.
5. Confirmation shows invite path.

### Scenario B — New family, Let PT choose

Same people asserts; `preferred_slot_id` null; `payload.schedulingPath=pt_chooses`; `payload.preferredWindowIds` length ≥ 1; 0 bookings; seats unchanged.

### Scenario C — Staff assigns Scenario B

1. Staff opens assignment queue; row visible.
2. Assign open tutor/slot.
3. Assert: **same** `tutoring_requests.id`; `status=confirmed`; `preferred_slot_id` set; **one** `bookings` row `tutoring_request_id` that id, `status=confirmed`; `booked_seats` +1; queue empty for that id; waitlist excludes it (`confirmed` booking filter).
4. Assert staff scheduling POST was **not** required; request count for that student is still 1.

### Scenario D — Existing safe email match

1. Seed household + guardian email `exact@example.com`.
2. Public submit same email, new student name.
3. Assert: household count unchanged; new student on **that** household; new request; no second household; `payload` records matchOn email.

### Scenario E — Ambiguous duplicate

1. Two households sharing phone or two email matches.
2. Public submit that identity.
3. Assert: **no** new household, **no** new request (409 `ambiguous_identity` or equivalent); staff still uses existing family UI.

### Scenario F — Selected slot becomes full

1. Path A choose slot with 1 remaining seat.
2. Another actor staff-books that slot (`POST /api/staff/scheduling/bookings`).
3. Public submit Path A.
4. Assert: 409; if using a transaction, no new household from that attempt; `booked_seats` not incremented by public path.

### Regression

| Flow | How |
| --- | --- |
| Staff new family | Existing wizard + `POST /api/staff/families` still 200 |
| Family add student | `POST /api/family/students` unchanged |
| Family tutoring book | Authenticated book-tutoring still claims seat + pending payment (do not break Stripe requirement) |
| Staff tutoring book | Scheduling POST still creates **new** request+confirmed booking |
| Tutor availability | Staff tutor hours CRUD + seat grid |
| Courses | `POST /api/family/enroll-courses` / staff enroll untouched |
| Invitations | Existing staff invitePath + `/invite/[token]` after forceRedirectUrl fix |
| Onboarding | `/family/onboarding` still sets household `active` |
| Middleware | Unauth `/family` → sign-in; unauth register allowed |

---

## 15. Risks

| Risk | Likelihood | Impact | Prevention | Detection |
| --- | --- | --- | --- | --- |
| Someone wires public submit to `book-tutoring` | Med if rushed | Pending payments, seats claimed, 400/401 on pending households | Code review: public service never imports that route; this plan forbids it | Assert 0 bookings on public POST tests |
| Staff uses scheduling POST for Path B | Med (habit) | Duplicate `tutoring_requests` | Assign UI only calls new assign endpoint; copy on old scheduling: “new placement,” not “this request” | Scenario C request count = 1 |
| Invite still hits `/post-login` → duplicate household | **High** today | Two families for one parent | Step 4 remove `forceRedirectUrl` | After invite sign-in, one `guardians.clerk_user_id`; household count |
| Middleware `isPublicRoute` too wide (`/api/public(.*)`) | Low | Unprotects future APIs | List exact paths | Grep middleware; smoke `/family` |
| Path A `preferred_slot_id` mistaken for occupancy | Med | Staff think seat is taken; sessions empty | Staff copy “preferred — not booked”; sessions still booking-based | Sessions list vs waitlist |
| `catalogSubjectToDbCode` fallback `"math"` | Med | Wrong subject_id | Require `isValidOptionId` + subjects row exists | Invalid subject 400 |
| Email match attaches to archived household | Low | Bad reuse | Skip `archived` in auto-reuse | Scenario D variant |
| Phone-only auto-reuse | Low if we follow §7 | Wrong family | Never auto on phone-only | Scenario E |
| Public availability leaks tutor names/hours | Med | Intentional for Path A | No student names on public GET | Review JSON |
| Dashboard still shows **Maya Chen** mock when assignment queue empty | Med | Staff distrust | Prefer live tutoring query; hide preview when Phase 1 ships | Visual |
| Concurrent staff assign same slot | Low | Overbook | Transaction + predicate on new assign only | Two parallel assign tests |
| Merge later does not move `tutoring_requests` | Known | Orphan requests if someone creates duplicate HH | Never create HH on ambiguous match | Scenario E |

---

## 16. Decisions Required Before Implementation

No product decision in the source of truth or audits **blocks** Option A Phase 1 as specified (request-only public write, Path A preference via `preferred_slot_id` + payload, Path B staff assign on the **same** row, no Stripe/Zoho/Acuity/QBO).

Do **not** wait on:

- Path B charge-before-vs-after assignment (Phase 2)
- Acuity recurring representation (Phase 4)
- Zoho field API names (Phase 3)
- QBO item mapping (Phase 5)
- Whether Path A should consume a seat at selection (already answered: **no** in Phase 1)

**Not a blocker:** outbound invite email. Staff create already only mints URLs. Phase 1 matches that. If you later require email, that is new infrastructure.

If you reject Option A and want Option B (extract all create/book routes first), that **would** block this sequence — say so before implementation.

---

## 17. Final recommendation

**Implement Option A isolated public Academic Year intake.**

It is the smallest safe path because:

- Working `POST /api/staff/families`, `POST /api/family/students`, `POST /api/family/book-tutoring`, and `POST /api/staff/scheduling/bookings` stay inline and uncalled by public registration.
- Schema already allows request-only rows and a non-claiming `preferred_slot_id`.
- Path A will not invent payment or seats; Path B gets a dedicated assign writer so staff do not duplicate requests.
- The one unavoidable new primitive (`createTutoringRequest`) is what Option B would extract later.

**Untouched working functionality:** staff family wizard, family add-student, family book (slot + Stripe PM + pending ledger), staff calendar book, course enrollments, merge, bootstrap (except invite redirect fix so bootstrap is not hit first).

**After you approve this document, implementation can start at Step 1.** Do not implement until that approval.

---

## Appendix — `tutoring_requests` columns (live `src/lib/db/schema.ts`)

`id`, `household_id` (NOT NULL), `student_id` (NOT NULL), `subject_id` (NOT NULL), `requested_by_guardian_id` (nullable), `status` (`draft` \| `submitted` \| `held` \| `pending_staff_review` \| `confirmed` \| `cancelled` \| `failed`, default `draft`), `preferred_slot_id` (nullable), `schedule_notes`, `subject_notes`, `referral_source`, `package_label`, `policy_version_id`, `agreement_accepted_at`, `form_id`, `schedule_window_id`, `payment_plan_id`, `payload` jsonb, `created_at`, `updated_at`.

No `.references()` on household/student/subject/slot in Drizzle; application must insert real ids.
