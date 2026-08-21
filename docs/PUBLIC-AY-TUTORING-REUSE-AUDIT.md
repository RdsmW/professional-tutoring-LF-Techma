# Public Academic-Year Tutoring — reuse audit

**Scope:** inspect existing create/identify flows for Household, Guardian, Student, `tutoring_requests`, and bookings.  
**Repo:** `professional-tutoring-app`  
**Mode:** audit only (this file is documentation).  
**Date:** 2026-08-19

Verdict up front:

- People create/identify logic is **mostly inline in authenticated `route.ts` handlers**. A few **lib** helpers exist for listing, matching-adjacent billing, and Clerk bootstrap — not a shared “create family” service.
- **No function today inserts `tutoring_requests` without also inserting a `bookings` row and incrementing `availability_slots.booked_seats`.**
- **`POST /api/family/book-tutoring` always requires a real `slotId`, always books a seat, always writes a pending `payment_records` row.** Public AY registration must not call it unless the parent picked a live open slot *and* the household is already an authenticated, onboarded, payment-ready family.

---

## 1. Reusable functions vs route-only logic

### 1.1 Household — create or identify

| Need | File | Function | Kind |
| --- | --- | --- | --- |
| Create household + billing guardian (Clerk self-serve) | `src/lib/auth/roles.ts` | `ensureFamilyGuardian` | **Lib** — reusable as a function, **not** for public/unauthenticated forms |
| Create household + 1–2 guardians + optional students | `src/app/api/staff/families/route.ts` | `POST`, plus local `insertStudentFromDisplayName` | **Route only** |
| Identify existing household by email/phone | `src/app/api/staff/families/match/route.ts` | `runMatch` (called by `GET` and `POST`) | **Route only** (`runMatch` is not exported from `src/lib`) |
| List families | `src/lib/staff/families.ts` | `listStaffFamilies` | **Lib** — list/search, does not create |
| Merge two households | `src/app/api/staff/families/merge-queue/route.ts` `POST`; `src/app/api/staff/families/merge-queue/[id]/merge/route.ts` `POST` | queue + execute | **Route only** — moves people, does not create them |
| Identify household for a signed-in parent | `src/lib/family/session.ts` | `getFamilyContext` | **Lib** — Clerk session required |
| Auto household display name | `src/lib/staff/household-display-name.ts` | `buildHouseholdDisplayName`, `refreshHouseholdDisplayNameIfAuto` | **Lib** — post-create naming only |

**`ensureFamilyGuardian`** (`src/lib/auth/roles.ts`): looks up `guardians.clerk_user_id` only. If none, **always inserts a new** `households` (`status: "pending"`) and billing `guardians`. It does **not** match by email/phone to a staff-created family. Caller: `POST /api/bootstrap`.

**`POST /api/staff/families`**: all inserts live in the handler. Local helper `insertStudentFromDisplayName` splits a display name into first/last and inserts `students` with `lifecycle: "prospect"`. Uses `assertNotStaffAsGuardian` from lib. Does **not** call match; duplicate search is advisory in the wizard UI only.

**`runMatch`**: email exact (`lower(guardians.email)`) and phone digit match on guardian phone + household `primaryPhone`. Returns candidate household/guardian IDs. Create is not blocked by matches.

**Merge:** `POST .../merge-queue/[id]/merge` moves `guardians` and `students` to the target household and archives the source. **Does not move** `tutoring_requests`, `bookings`, or `payment_records`. Staff-only; not an identity “find or create.”

### 1.2 Guardian — create or identify

| Need | File | Function | Kind |
| --- | --- | --- | --- |
| Create + link to Clerk user | `src/lib/auth/roles.ts` | `ensureFamilyGuardian` | **Lib**, Clerk-bound |
| Create on new family | `src/app/api/staff/families/route.ts` | `POST` (inline `insert(guardians)`) | **Route only** |
| Add guardian to existing family | `src/app/api/staff/families/[id]/guardians/route.ts` | `POST` | **Route only** (uses lib helpers below) |
| Assign existing guardian onto a family | `src/app/api/staff/families/[id]/guardians/assign/route.ts` | `POST` | **Route only** — identify + move, not create |
| Block staff emails as guardians | `src/lib/staff/staff-guardian-guard.ts` | `assertNotStaffAsGuardian`, `isStaffIdentity` | **Lib** — reusable |
| Parent 1 / Parent 2 slots | `src/lib/staff/guardians.ts` | `nextAvailableRelationshipRole`, `assertUniqueRelationshipRole` | **Lib** — reusable |
| Set billing owner | `src/lib/staff/guardians.ts` | `setHouseholdBillingOwner`, `syncHouseholdBillingAddressFromGuardian` | **Lib** — reusable |
| After unassign | `src/lib/staff/household-display-name.ts` | `reassignBillingOwnerAfterGuardianRemoved` | **Lib** |
| Link Clerk to existing guardian | `src/app/api/invite/[token]/route.ts` | `POST` | **Route only** (public token, but requires signed-in Clerk user) |
| List guardians | `src/lib/staff/guardians.ts` | `listStaffGuardians`, `getStaffGuardianDetail` | **Lib** — list only |
| `GET /api/staff/guardians` | `src/app/api/staff/guardians/route.ts` | `GET` only | No create |

There is **no** `POST /api/staff/guardians` create-orphan endpoint. New guardians are created on a household (`families` POST or `families/[id]/guardians` POST) or via `ensureFamilyGuardian`.

### 1.3 Student — create or identify

| Need | File | Function | Kind |
| --- | --- | --- | --- |
| Name-only student on new family | `src/app/api/staff/families/route.ts` | `insertStudentFromDisplayName` + `POST` | **Route only** |
| Add student to existing household | `src/app/api/staff/students/route.ts` | `POST` | **Route only** |
| Family-portal add student (full profile) | `src/app/api/family/students/route.ts` | `POST` | **Route only** |
| List students in a household | `src/lib/family/session.ts` | `listHouseholdStudents(householdId)` | **Lib** — reusable (ID in, no auth inside) |
| List directory / filter by household | `src/app/api/staff/students/route.ts` | `GET` (`?householdId=`) | **Route only** query |
| Assign existing student onto a family | `src/app/api/staff/families/[id]/students/assign/route.ts` | `POST` | **Route only** — identify + move |
| Label helper | `src/lib/staff/students.ts` | `buildStudentListLabel` | **Lib** — display only |
| Notes CRUD | `src/lib/staff/students.ts` | `softDeleteStudentNote`, etc. | **Lib** — not create-student |

Staff `POST /api/staff/students` requires `householdId` + `displayName`, inserts `lifecycle: "prospect"`, then `refreshHouseholdDisplayNameIfAuto`.

Family `POST /api/family/students` requires first/last, school, grade, graduation year, gender, learning needs; household comes from `getFamilyContext()`.

**No shared `createStudent(...)` lib function.** The three insert sites duplicate Drizzle `insert(students)`.

### 1.4 Supporting lib (safe to call from a future public service)

These do **not** create people, but are already extracted and auth-agnostic (pass IDs, not Clerk):

- `assertNotStaffAsGuardian` — `src/lib/staff/staff-guardian-guard.ts`
- `nextAvailableRelationshipRole` / `assertUniqueRelationshipRole` / `setHouseholdBillingOwner` — `src/lib/staff/guardians.ts`
- `refreshHouseholdDisplayNameIfAuto` / `buildHouseholdDisplayName` / `MAX_GUARDIANS_PER_HOUSEHOLD` — `src/lib/staff/household-display-name.ts`
- `listHouseholdStudents` — `src/lib/family/session.ts`
- `catalogSubjectToDbCode` — `src/lib/booking/subject-map.ts`
- `isValidOptionId`, `FORM_META`, `formsForJourney` — `src/lib/forms/*`
- `buildQuote` — `src/lib/pricing/quote.ts`
- `insertPriceSnapshot` — `src/lib/pricing/snapshot.ts`

**Not reusable for public forms without refactor:**

- `getFamilyContext` / `getStaffContext` — Clerk `auth()`
- `ensureFamilyGuardian` — Clerk `safeCurrentUser()`, always new household if no `clerkUserId`
- `resolveFamilyPaymentMethod` — `src/lib/family/resolve-payment-method.ts` — requires `FamilyContext` + Stripe customer/PM

---

## 2. Is the logic reusable outside authenticated API routes?

**Mostly no.** Create/identify for Household / Guardian / Student is **embedded in route handlers** that first call `getStaffContext()` or `getFamilyContext()`.

| Path | Auth gate | Business logic location |
| --- | --- | --- |
| `POST /api/staff/families` | `getStaffContext()` | Entire create in `route.ts` |
| `GET/POST /api/staff/families/match` | `getStaffContext()` | `runMatch` in same file — **would be easy to lift** (already a standalone async function; auth is only around the call) |
| `POST /api/staff/students` | `getStaffContext()` | Entire create in `route.ts` |
| `POST /api/staff/families/[id]/guardians` | `getStaffContext()` | Insert in `route.ts`; uniqueness/billing helpers in lib |
| `POST /api/family/students` | `getFamilyContext()` + `canManageStudents` | Entire create in `route.ts` |
| `POST /api/bootstrap` | Clerk `auth()` | Delegates to `ensureFamilyGuardian` |
| Merge queue / merge execute | `getStaffContext()` | Entirely in route files |
| `POST /api/family/book-tutoring` | `getFamilyContext()` + household `active` + `canRequestServices` | Entire booking pipeline in `route.ts` |
| `POST /api/staff/scheduling/bookings` | `getStaffContext()` | Entire booking pipeline in `route.ts` |

Lib functions that **can** run outside routes today: `ensureFamilyGuardian` (still needs a Clerk user in-process), match-adjacent helpers listed in §1.4, and `listHouseholdStudents(householdId)`.

There is **no** unauthenticated “create family + tutoring request” service. Public surfaces today: Clerk sign-up/sign-in, and `GET/POST /api/invite/[token]` (token lookup is public; accept still requires Clerk).

---

## 3. Academic-Year Tutoring: create `tutoring_request` without a confirmed booking?

**Repo-wide search:** the only `.insert(tutoringRequests)` call sites are:

1. `src/app/api/family/book-tutoring/route.ts` — `POST`
2. `src/app/api/staff/scheduling/bookings/route.ts` — `POST`

There is **no** insert of `tutoring_requests` alone.

### `POST /api/family/book-tutoring`

Creates, in one handler, **in this order**:

1. `tutoring_requests` with `status: "submitted"`, `formId` (`academic_year_tutoring` or `summer_tutoring`), `preferredSlotId: slotId`
2. `bookings` with `status: "pending_payment"` (not `confirmed`)
3. `availability_slots.booked_seats + 1`
4. `payment_records` with `status: "pending"`

So: **no confirmed booking**, but **yes an immediate booking + seat claim + pending payment**. Not a waitlist-only request.

### `POST /api/staff/scheduling/bookings`

Creates:

1. `tutoring_requests` with `status: "confirmed"` (no `formId`; payload `source: "staff_scheduling"`)
2. `bookings` with `status: "confirmed"`
3. `availability_slots.booked_seats + 1`

**No** `payment_records`. **Always** a confirmed booking.

### Schema vs writers

`tutoring_requests.status` allows `draft` | `submitted` | `held` | `pending_staff_review` | `confirmed` | `cancelled` | `failed`.  
`preferred_slot_id` is **nullable**.

The waitlist report (`src/lib/reports/queries/waitlist.ts` `queryWaitlistReport`) **reads** open requests (`submitted` / `held` / `pending_staff_review`) that have no `confirmed` booking. **Nothing currently writes that shape** except family book (which still has a `pending_payment` booking and a claimed seat).

**Answer:** no existing function can create an Academic-Year `tutoring_request` without immediately creating a booking and incrementing `booked_seats`. Family book is the closest (unconfirmed booking); staff book always confirms.

---

## 4. Does `POST /api/family/book-tutoring` always require a slot, booking, seat increment, and pending payment?

**Yes. Always.** There is no optional/waitlist branch.

Required body fields (empty string fails): `studentId`, `formId`, `subjectCode`, `windowId`, `tutorId`, **`slotId`**, `paymentPlanId`.

Also required:

- Authenticated family via `getFamilyContext()`
- `household.status === "active"` (onboarding complete)
- `guardian.canRequestServices`
- `policyAck === true`
- Valid catalog IDs (`ACADEMIC_SUBJECTS`, `ACADEMIC_SCHEDULE_WINDOWS`, `ACADEMIC_PAYMENT_PLANS` for AY)
- Student belongs to household
- Tutor active + linked to mapped subject
- **Specific** `availability_slots` row: `id = slotId`, same `tutorId`, `active`, `scheduleWindowId = windowId`, and `booked_seats + held_seats < capacity_seats` — else **409** `"Selected slot is no longer available."`
- Stripe payment method via `resolveFamilyPaymentMethod` (fails if Stripe unset or no PM)

Side effects that always run after validations:

- `insert(tutoringRequests)`
- `insert(bookings)` `pending_payment`, `seatsClaimed: 1`, `slotId`
- `update(availabilitySlots)` `booked_seats + 1`
- `insert(paymentRecords)` `status: "pending"`, `relatedEntityType: "booking"`

**Public registration should not call this endpoint** unless:

1. The parent selected a **real, currently open** `availability_slots.id`
2. Household already exists, is **active**, and the caller is the **signed-in** guardian
3. A Stripe payment method is already confirmed for that household

A public Gravity/website form that only collects “preferred window / notes / TBD tutor” **must not** hit this route. Doing so would 400 on missing `slotId`/`tutorId`/payment, or worse, claim a seat and create a pending ledger if those IDs were faked or leftover.

---

## 5. Smallest safe refactor (recommend only)

Goal: authenticated family book **and** a future public AY form share people + request rules, without teaching the public form to claim seats.

### Do not

- Call `POST /api/family/book-tutoring` from public registration.
- Call `POST /api/staff/scheduling/bookings` from public registration.
- Reuse `ensureFamilyGuardian` for public intake (Clerk-only; creates a **duplicate household** when email already exists from staff/Gravity).
- Auto-run merge. Match is advisory; merge is a staff ops action and does not move bookings/payments.

### Do (smallest lift)

**A. Extract match (low risk, already isolated)**  
Move `runMatch` from `src/app/api/staff/families/match/route.ts` → e.g. `src/lib/staff/family-match.ts` as `findHouseholdMatchCandidates({ email, phone })`. Keep the route as auth + JSON wrapper. Public intake can call the same function **without** HTTP/staff session.

**B. Extract “create household + guardian + student” (medium, copy-paste today)**  
New `src/lib/family/create-household.ts` (name as you like) that takes **plain fields**, not Clerk:

- `assertNotStaffAsGuardian`
- insert `households` (`pending`, timezone, address)
- insert billing `guardians` (`parent_1`, invite token optional)
- insert `students` (`prospect`) — one shared insert helper replacing `insertStudentFromDisplayName`, staff `POST /api/staff/students`, and the core of family `POST /api/family/students` (family route keeps extra field validation)
- `refreshHouseholdDisplayNameIfAuto` / `setHouseholdBillingOwner`

Staff `POST /api/staff/families` and a future public handler both call this. `ensureFamilyGuardian` stays Clerk-only for portal first login.

Public identify policy: **match first**; if candidates exist, **attach student + request to the existing household** (or queue staff review) — do not insert a second household. Do not invoke merge from the form.

**C. Split tutoring write into two lib functions (this is the AY-critical piece)**

Today both booking routes couple request + booking + seats.

Extract:

1. `createTutoringRequest(input)` — insert `tutoring_requests` only. Allow `preferredSlotId: null`, `status: "submitted" | "pending_staff_review"`, `formId: "academic_year_tutoring"`, payload (window, notes, referral, test-prep). **No** booking, **no** seat increment, **no** payment. Use `catalogSubjectToDbCode` + subject lookup already in the family route.
2. `claimSlotAndCreateBooking(input)` — current family/staff tail: capacity check, `insert(bookings)`, `booked_seats + 1`, optional `insertPriceSnapshot` + `payment_records`.

Then:

- `POST /api/family/book-tutoring` = validate auth/onboarding/payment/slot → `createTutoringRequest` + `claimSlotAndCreateBooking` (behavior unchanged).
- Public AY form = match/create people → `createTutoringRequest` only, unless the parent actually selected an open slot **and** payment/onboarding rules are satisfied — only then call `claimSlotAndCreateBooking`.

Staff scheduling keeps calling (2) with `status: "confirmed"` and no payment.

**D. Leave payment on the authenticated path**  
Do not reuse `resolveFamilyPaymentMethod` until a public household has a Stripe customer. Public AY without a slot should not create `payment_records`.

### Suggested call order for public AY (after refactor)

1. `findHouseholdMatchCandidates(email, phone)`
2. If none: `createHouseholdWithGuardianAndStudent(...)`; if match: reuse IDs (add student if new child)
3. `createTutoringRequest({ formId: "academic_year_tutoring", preferredSlotId: slotId ?? null, ... })`
4. **If and only if** a live open slot was chosen **and** payment rules pass: `claimSlotAndCreateBooking(...)`

Routes stay thin (auth + HTTP). Shared rules live in `src/lib`, callable from staff, family, or a future public/webhook handler without Clerk.

### Risk notes

- Family book currently requires household `active`. Public create from staff families uses `pending`. Do not mark public households `active` just to reuse book-tutoring.
- Seat increment without a transaction today (request then booking then update). Extracting (2) is a good time to wrap in one DB transaction; out of scope unless you touch that code.
- Merge does not move tutoring rows — attaching a public request to a matched household is safer than creating a duplicate HH and merging later.

---

## Citation index (create / identify)

```
src/lib/auth/roles.ts                          ensureFamilyGuardian
src/lib/family/session.ts                      getFamilyContext, listHouseholdStudents
src/lib/staff/staff-guardian-guard.ts          assertNotStaffAsGuardian, isStaffIdentity
src/lib/staff/guardians.ts                     nextAvailableRelationshipRole, assertUniqueRelationshipRole,
                                               setHouseholdBillingOwner
src/lib/staff/household-display-name.ts        refreshHouseholdDisplayNameIfAuto, buildHouseholdDisplayName
src/lib/staff/families.ts                      listStaffFamilies                    (list only)
src/lib/booking/subject-map.ts                 catalogSubjectToDbCode
src/lib/pricing/quote.ts                       buildQuote
src/lib/pricing/snapshot.ts                    insertPriceSnapshot
src/lib/family/resolve-payment-method.ts       resolveFamilyPaymentMethod           (Clerk family + Stripe)

src/app/api/staff/families/route.ts            POST, insertStudentFromDisplayName
src/app/api/staff/families/match/route.ts      runMatch, GET, POST
src/app/api/staff/families/merge-queue/route.ts                 POST (queue)
src/app/api/staff/families/merge-queue/[id]/merge/route.ts      POST (execute)
src/app/api/staff/families/[id]/guardians/route.ts              POST
src/app/api/staff/families/[id]/guardians/assign/route.ts       POST
src/app/api/staff/families/[id]/students/assign/route.ts        POST
src/app/api/staff/students/route.ts            GET (?householdId=), POST
src/app/api/family/students/route.ts           POST
src/app/api/bootstrap/route.ts                 POST → ensureFamilyGuardian
src/app/api/invite/[token]/route.ts            POST (link Clerk)

src/app/api/family/book-tutoring/route.ts      POST  (request + pending_payment booking + seats + payment)
src/app/api/staff/scheduling/bookings/route.ts POST  (request + confirmed booking + seats)

No other insert(tutoringRequests) in the repo.
```
