# Tutor Availability and Assignment UX Verification

**Type:** Verification only  
**Date:** 2026-08-20
**Scope:** Public Academic Year Path A tutor availability, Path A finalization,
Staff Path B assignment, and the current Staff navigation
**Code changes:** None

## Verification method and limit

This report is based on source inspection of the current application. The
public and Staff browser views were not rerun with dedicated controlled fixtures
for this verification. In particular, authenticated Staff browser coverage
requires Clerk E2E credentials that are not configured.

The existing runtime verification of the Stripe, Path A, and B1 payment flows
remains in `docs/CURRENT-IMPLEMENTATION-VERIFICATION.md`. It is not duplicated
here.

## Already correct

### Parent Path A — availability candidates

The public endpoint is
`GET /api/public/ay-tutoring-availability`. Its handler is
`src/app/api/public/ay-tutoring-availability/route.ts`.

For the selected primary subject and schedule window, the handler uses
`listOpenTutorsForSubjectWindow` in
`src/lib/booking/open-slots-for-subject-window.ts`.

That helper requires all of the following before returning a tutor:

- the tutor is active;
- the tutor is linked to the selected subject through `tutorSubjects`;
- the tutor has an active slot for the selected schedule window;
- the slot satisfies
  `booked_seats + held_seats < capacity_seats`.

The helper adds a tutor to its result only after finding at least one eligible
slot. The subsequent slot query uses the same active-window-open-capacity
conditions. The public form renders only the API `tutors` and `slots` results
in `src/components/public-ay-tutoring-registration-form.tsx`.

Therefore, by current source behavior, a tutor with no matching subject, no
active slot in the selected window, or no remaining eligible slot is excluded
from the public Path A choices.

### Path A finalization and booking

The public payment panel finalizes through
`POST /api/public/ay-tutoring-payment/finalize`, which delegates to
`finalizeAyPublicPayment` in
`src/lib/public-intake/ay-tutoring-payment-flow.ts`.

For a family-selected Path A slot, finalization:

- reuses the existing tutoring request;
- checks for an existing occupying booking before creating another;
- atomically claims the selected slot only when the selected tutor owns it,
  the slot is active, and capacity remains;
- creates one booking and increments one seat;
- handles payment-specific confirmation or release of a temporary booking.

The assignment transaction in
`src/lib/booking/assign-tutoring-request.ts` rejects stale/full slots with
`slot_unavailable`. The prior runtime report also confirmed same-request,
single-booking, single-seat behavior for its controlled Path A scenario.

### Staff Path B assignment screen

The existing assignment page is:

- list: `/staff/tutoring-requests`;
- detail: `/staff/tutoring-requests/[id]`.

The detail page renders
`StaffTutoringRequestAssignClient` from
`src/components/staff-tutoring-request-assign-client.tsx`. It loads
`GET /api/staff/tutoring-requests/[id]`.

That API derives the request subject and relevant preferred windows, then calls
the same open-tutor and open-slot helpers for every window. The Staff UI shows:

- student;
- family;
- primary subject;
- parent schedule notes, when provided;
- the requested scheduling path;
- compatible tutors grouped by preferred window;
- each compatible slot and its remaining seats.

No new Staff navigation module is needed. The Dashboard Priority Queue already
links work requiring assignment to `/staff/tutoring-requests`, and the existing
detail page is the smallest appropriate place to perform the assignment.

### Current Staff navigation

The current sidebar navigation is defined in `src/lib/constants.ts` and renders
through `src/components/staff-shell.tsx`. Its primary entries are:

- Dashboard;
- Families;
- Guardians;
- Students;
- Tutors;
- Sessions;
- Billing;
- Reports;
- Settings.

The existing tutor-assignment routes are reached from the Dashboard priority
queue rather than being a new top-level navigation item. This matches the
current product structure: Dashboard surfaces work needing attention and the
existing assignment detail performs the work.

## Incorrect

### Path A final assignment revalidation is incomplete

The transactional assignment guard verifies that:

- the request exists and is not cancelled;
- the requested tutor owns the slot;
- the slot is active;
- capacity remains;
- the request has no occupying booking.

It does **not** explicitly revalidate that:

- the selected tutor is currently active;
- the selected tutor still teaches the request subject;
- the selected slot still belongs to the schedule window originally selected by
  the family.

The selected slot's schedule window is written back to the request instead.
This prevents a stale/full claim but does not fully enforce the requested
tutor-subject-window relationship at finalization time.

Relevant code:

- `src/lib/public-intake/ay-tutoring-payment-flow.ts`;
- `src/lib/booking/assign-tutoring-request.ts`.

## Not verified

- A controlled browser Path A matrix proving that inactive, full, wrong-subject,
  and wrong-window records are absent from the rendered public UI.
- An authenticated Clerk browser test of the Staff assignment list and detail
  screen.
- Runtime evidence that all displayed Staff request context fields are present
  for a representative Path B request.
- A controlled finalization attempt where tutor activity, subject assignment, or
  schedule-window alignment changes after the parent makes the public
  selection.

## Smallest changes required

No implementation change is made by this report.

To close the finalization gap, extend the transactional Path A assignment guard
to validate, in the same transaction:

- active tutor status;
- tutor-to-request-subject relationship;
- selected slot schedule window against the request's original selected window.

Keep the existing atomic active/capacity slot claim and the current assignment
routes. No new Staff navigation module is required.

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Public tutor eligibility source | Verified | Shared open-tutor helper filters active tutor, matching subject, active window slot, and remaining capacity. |
| Public slot eligibility source | Verified | Shared open-slot helper filters active matching-window slots with remaining capacity. |
| Path A finalization source | Partially verified | Atomic slot ownership, active status, and capacity checks exist; tutor activity, subject, and original-window checks are not explicit. |
| Staff compatible choices source | Verified | Staff detail API uses the same open-tutor/open-slot helpers. |
| Staff browser runtime | Not verified | Clerk E2E Staff credentials are unavailable. |
| Path A controlled browser matrix | Not verified | No dedicated fixture run was performed for this report. |

## Verified working

- Public Path A candidate queries exclude inactive tutors, unrelated tutors,
  inactive slots, and slots without remaining capacity.
- Staff Path B compatible choices use the same eligibility rules.
- Existing routes provide an assignment workflow without a new top-level module.
- Atomic assignment protects against a full or inactive selected slot at booking
  time.

## Verified broken

- Final assignment does not explicitly revalidate active tutor status,
  tutor-subject eligibility, or original schedule-window alignment.

## Still unverified

- Controlled browser rendering for all exclusion scenarios.
- Authenticated Staff UI behavior under real Clerk credentials.

## Minimum next implementation work

- Add the missing finalization revalidation checks.
- Add controlled public and authenticated Staff tests for subject, active,
  window, and capacity eligibility.