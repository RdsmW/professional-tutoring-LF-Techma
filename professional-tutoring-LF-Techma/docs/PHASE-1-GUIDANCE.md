# Phase 1 Guidance

## Purpose

Phase 1 is on the right track. Keep the current architecture and scope.
After the corrections and acceptance checks described below, stop. Do not add
new product capabilities as part of this phase.

## Required corrections before acceptance testing

### 1. Make the primary tutoring subject explicit

- The family must explicitly choose one primary subject.
- The primary subject is the subject used for tutor matching.
- Any other selected subjects are additional tutoring needs.
- Do not use the first checked subject as an implicit matching rule.
- The primary subject must be one of the selected subjects.

### 2. Keep the plan and payment preferences consistent

- Do not preselect both standard and advanced hours/rate packages.
- Do not allow both packages to be submitted together.
- Only show or require an alternative payment method when it is relevant,
  such as when automatic card charging is set to `No`.
- Do not implement Stripe payment processing in Phase 1.

### 3. Make the review understandable to a parent

Replace a raw payload-style summary with clearly labeled sections:

- **Student**
- **Parents / Billing**
- **Tutoring Needs**
- **Schedule**
- **Plan**
- **Agreement**

No redesign is required. The goal is clarity, not a new visual system.

### 4. Validate email and phone values

- Validate entered email and phone formats before the user can continue.
- Validate the same values again on the server before accepting the request.
- Optional fields may remain empty.
- An entered value that is invalid must not be accepted.

### 5. Use family-friendly schedule copy

- Display times in a friendly format such as `3:00–5:00 PM`.
- Do not expose raw database-style values such as
  `15:00:00–17:00:00` to families.
- Use clear capacity language such as `2 spots available`.

### 6. Use Academic Year Tutoring terminology

Replace unrelated or misleading wording such as “course information” with
wording appropriate for Academic Year Tutoring wherever it appears in this
flow.

## Phase 1 behavior boundaries

### Path A: family selects a tutor and slot

When a family selects a compatible tutor and available slot:

- Store the selected slot as the family's preferred scheduling choice.
- Keep the request as a request awaiting staff handling.
- Do not create a booking.
- Do not consume a seat.
- Do not create a payment record.
- Treat the selected slot as a preference, not a confirmed reservation.

The submitted payload should preserve enough information to understand what the
family selected, even if availability changes before staff assignment.

### Path B: family asks Professional Tutoring to choose

When the family selects “Let Professional Tutoring choose”:

- Create a request-only record.
- Leave the preferred slot empty.
- Do not select a tutor.
- Do not create a booking.
- Do not consume a seat.
- Do not create a payment record.

The request must enter the staff assignment queue.

### Path C: staff assigns the Path B request

When staff assigns a compatible tutor and available slot:

- Update the existing Path B request.
- Do not insert a second tutoring request.
- Create exactly one confirmed booking.
- Consume exactly one seat from the selected slot.
- Move the request out of the assignment queue.
- Re-check compatibility and capacity at assignment time.
- Keep the operation atomic so a failed assignment does not leave a partial
  request, booking, or seat update.

## Explicitly out of scope for Phase 1

Do not add any of the following as part of Phase 1:

- Invite email delivery.
- A required policy foreign-key relationship if it is not yet available.
- Full third-party billing behavior; payload-backed billing information is
  acceptable for this phase.
- Handwritten or drawn signatures; typed-name signatures are acceptable.
- Stripe integration.
- Zoho integration.
- Acuity integration.
- QuickBooks Online integration.
- A new architecture or broad redesign.
- Additional features after the listed corrections are complete.

## Acceptance task: run and report A/B/C evidence

The acceptance task is a verification and reporting task, not a scope-expansion
task. It should exercise the implemented flow, inspect the resulting records,
and report the evidence. It should not add new product behavior merely to make
the report look successful.

### Preparation

1. Confirm the application is running.
2. Confirm the database is reachable.
3. Confirm there is at least one active subject, compatible tutor, and
   available slot suitable for the test.
4. Confirm the test account and staff account can access the paths they need.
5. Use unique test-family data so existing records are not overwritten.
6. Capture the relevant slot's capacity, booked seats, and held seats before
   each scenario.
7. Ensure the test runner can execute the existing Staff and Family regression
   checks.

If a required prerequisite is missing, report that blocker instead of
inventing new Phase 1 behavior.

### Scenario A: public family selects tutor and slot

1. Open the public Academic Year Tutoring registration flow.
2. Enter a new family's valid student, parent, billing, subject, plan,
   agreement, and signature information.
3. Select a primary subject and, if applicable, additional subjects.
4. Select the family-selected scheduling path.
5. Select a compatible tutor and an available slot.
6. Submit the registration.
7. Record the returned tutoring request ID and status.
8. Query the request and verify:
   - `preferred_slot_id` is the selected slot.
   - The request contains the selected scheduling information.
   - The request is still request-only/pending staff handling.
9. Query related records and verify:
   - Booking count for the request is zero.
   - Payment-record count for the request/family is zero.
10. Capture the slot's after-state and verify:
    - `booked_seats` did not increase.
    - `held_seats` did not increase.
11. Report the request ID, status, preferred slot ID, booking count, payment
    count, and before/after seat counts.

### Scenario B: public family asks Professional Tutoring to choose

1. Open the public Academic Year Tutoring registration flow with a new
   family's unique data.
2. Complete the required student, parent, billing, subject, plan, agreement,
   and signature fields.
3. Select “Let Professional Tutoring choose.”
4. Submit the registration.
5. Record the returned tutoring request ID and status.
6. Query the request and verify:
   - `preferred_slot_id` is null.
   - No tutor was assigned.
   - The request is in the staff assignment queue.
7. Query related records and verify:
   - Booking count is zero.
   - Payment-record count is zero.
8. Capture the relevant availability counts and verify no seat was consumed.
9. Report the request ID, status, preferred slot value, tutor value, booking
   count, payment count, and before/after seat counts.

### Scenario C: staff assigns the Path B request

1. Start with the exact Path B request ID from Scenario B.
2. Open the staff tutoring-request assignment flow.
3. Select a compatible tutor and an available slot.
4. Capture that slot's capacity, booked seats, and held seats before assignment.
5. Submit the assignment.
6. Record the returned tutoring request ID and booking ID.
7. Query the request and verify:
   - The request ID is the same ID created in Scenario B.
   - The request is confirmed.
   - The request is no longer in the assignment queue.
8. Query the booking and verify:
   - Exactly one booking exists for the request.
   - The booking is confirmed.
   - The assigned tutor and slot match the staff selection.
9. Query the slot and verify:
   - `booked_seats` increased by exactly one.
   - `held_seats` did not increase unexpectedly.
10. Verify no duplicate tutoring request was created.
11. Report the original request ID, final request status, booking ID, assigned
    tutor ID, assigned slot ID, and before/after seat counts.

## Regression checks

After Scenarios A–C, run the planned regression checks for existing Staff and
Family booking flows. Report each check as passed, failed, or blocked, along
with the relevant error and route when it does not pass.

## Required final report

The acceptance report must include:

- Environment and test prerequisites.
- Scenario A request ID, status, preferred slot, booking/payment counts, and
  seat counts before and after.
- Scenario B request ID, status, null preference/tutor state,
  booking/payment counts, and seat counts before and after.
- Scenario C original request ID, final status, booking ID, assigned tutor and
  slot, duplicate-request check, and seat counts before and after.
- Staff/Family regression results.
- Any blocker or failure, without silently changing Phase 1 scope.

After this report, stop. Do not add another feature or broaden Phase 1.