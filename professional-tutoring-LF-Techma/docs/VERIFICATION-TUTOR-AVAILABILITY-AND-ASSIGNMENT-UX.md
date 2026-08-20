# Tutor Availability and Assignment UX Verification

**Type:** Verification only  
**Status:** To be executed  
**Scope:** Current public Academic Year tutor availability, Path A final
behavior, Path B staff assignment, and Staff navigation

## Separation rule

This file documents only the verification request for tutor availability and
assignment UX.

It does not contain implementation requirements for the Dashboard or Settings
pages. Dashboard and Settings changes are separate action requests and must be
implemented in the application task, not mixed into a verification report.

The existing Stripe and Phase 1/Phase 2 verification remains separate in:

- `docs/CURRENT-IMPLEMENTATION-VERIFICATION.md`

## Verification constraints

- Inspect the actual current code and runtime UI.
- Do not implement fixes during this verification.
- Do not modify payment, booking, pricing, scheduling, matching, or business
  behavior.
- Use controlled test data only when runtime evidence requires it.
- Report missing checks explicitly instead of inferring intended behavior from
  plans.

## 1. Parent Path A — tutor availability

After the parent selects:

- primary subject;
- preferred schedule window or slot;

verify exactly which tutors the public Academic Year scheduling step displays.

Confirm whether a tutor is shown only when all conditions are true:

- tutor is active;
- tutor teaches the selected primary subject;
- tutor has an active availability slot matching the selected schedule window;
- the slot has remaining capacity:
  `booked_seats + held_seats < capacity_seats`.

Identify the exact files, functions, and API/database queries enforcing each
condition.

Verify whether a tutor with any of the following can appear to the parent:

- no matching subject;
- no availability in the selected window;
- inactive availability;
- a full slot.

## 2. Path A — final behavior

Verify the actual behavior after a parent chooses an available tutor and slot.

Target sequence:

`parent selection → required payment/setup → server revalidation → same tutoring request → exactly one booking → exactly one seat → confirmed`

Verify:

- whether Path A enters any Staff assignment queue;
- whether Staff must click `Assign`;
- whether the final booking is created automatically;
- whether final booking revalidates the tutor is active;
- whether the tutor teaches the request subject;
- whether the slot belongs to that tutor;
- whether the slot matches the selected schedule window;
- whether the slot is active;
- whether capacity is still available.

Report every missing revalidation explicitly.

## 3. Path B — Staff tutor choice

Inspect the actual Staff assignment page for `Let Professional Tutoring choose`.

Confirm whether Staff sees at a glance:

- Student;
- Family;
- primary subject;
- parent preferred windows/times;
- only tutors who teach the subject;
- only relevant available slots;
- remaining capacity for each option.

Document exactly what is displayed and what is missing. Staff should not need to
open tutor profiles manually to compare availability.

## 4. Current Staff navigation and modules

Inspect the actual current Staff navigation/sidebar and list every module/tab
exactly as it appears in the UI.

For each relevant page, document its actual purpose:

- Staff Home/Dashboard;
- tutoring requests, if present;
- Tutors;
- Sessions;
- Requests;
- Reports/Waitlist;
- Scheduling-related pages or modules.

Then recommend the smallest and most intuitive placement for tutor assignments
using the existing navigation.

Guiding UX:

- Dashboard = work needing attention;
- dedicated assignment page = perform assignment work;
- Reports = reporting, not daily workflow;
- Sessions = already-booked tutoring;
- Tutors = tutor management and availability;
- Requests = incoming requests, if present.

Do not create a new module unless the current navigation has no appropriate
place.

## Required report output

The completed report must contain:

## Already correct

- Current behavior:
- Exact routes:
- Exact files/functions/API queries:
- Runtime evidence:

## Incorrect

- Current behavior:
- Expected behavior:
- Exact routes:
- Exact files/functions/API queries:
- Evidence:

## Not verified

- Item:
- Reason:
- Minimal prerequisite:

## Smallest changes required

- Minimal implementation change:
- Relevant files:
- Explicitly out of scope:

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Source inspection | | |
| Public availability runtime | | |
| Path A runtime | | |
| Path B Staff runtime | | |
| Navigation/UI runtime | | |
| TypeScript/lint/tests | | |

## Verified working

## Verified broken

## Still unverified

## Minimum next implementation work