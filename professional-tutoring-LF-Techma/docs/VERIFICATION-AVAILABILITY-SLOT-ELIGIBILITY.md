# Availability Slot Eligibility Verification

**Type:** Verification only  
**Date:** 2026-08-20  
**Scope:** Public Academic Year Path A and Staff Path B available-tutor/slot UI  
**Code changes:** None

## Required behavior under review

Only display selectable availability when all of the following are true:

- the tutor is active;
- the tutor teaches the selected primary subject;
- the tutor has at least one active slot in the relevant schedule window;
- `booked_seats + held_seats < capacity_seats`.

Full slots must not be returned as available options. Tutors with no eligible
remaining slot must not be returned either.

## Verification method and limit

This is a source-level verification of the current public and Staff data paths.
No controlled browser fixture was created for this report, and no application
code or data was changed.

## Public Academic Year Path A

### Current query and UI path

1. `src/components/public-ay-tutoring-registration-form.tsx` calls:
   `GET /api/public/ay-tutoring-availability?subjectCode=...&windowId=...`.
2. `src/app/api/public/ay-tutoring-availability/route.ts` calls:
   - `listOpenTutorsForSubjectWindow`;
   - `listOpenSlotsForTutorWindow`.
3. Both helpers are in
   `src/lib/booking/open-slots-for-subject-window.ts`.

### Current filtering result

`listOpenTutorsForSubjectWindow`:

- joins tutors to `tutorSubjects` for the resolved selected subject;
- requires `tutors.active = true`;
- requires an active slot in the selected schedule window;
- requires
  `booked_seats + held_seats < capacity_seats`;
- returns a tutor only when at least one matching open slot exists.

`listOpenSlotsForTutorWindow` applies the same slot-active, matching-window, and
open-capacity conditions before returning a slot.

### Finding

The current public Path A API does not return inactive or full slots as
available choices. It also does not return a tutor who has no remaining eligible
slot for the selected subject/window.

The public client still has a defensive `disabled` / `Full` display branch, but
the normal API response cannot reach that branch because the API has already
excluded those slots.

## Staff Path B

### Current query and UI path

1. The existing assignment detail page is
   `/staff/tutoring-requests/[id]`.
2. `src/components/staff-tutoring-request-assign-client.tsx` loads
   `GET /api/staff/tutoring-requests/[id]`.
3. `src/app/api/staff/tutoring-requests/[id]/route.ts` derives the request
   subject and relevant preferred windows.
4. For each relevant window, it calls the same:
   - `listOpenTutorsForSubjectWindow`;
   - `listOpenSlotsForTutorWindow`.
5. The client renders only the returned `compatible` tutor/slot data.

### Current filtering result

Because Staff Path B uses the shared helpers, it excludes:

- inactive tutors;
- tutors without the selected subject;
- inactive slots;
- full slots;
- tutors without an eligible slot in a relevant window.

The Staff assignment POST independently revalidates slot ownership, slot active
status, and remaining capacity through the atomic assignment transaction in
`src/lib/booking/assign-tutoring-request.ts`.

### Finding

The normal Staff Path B compatible-options response does not include inactive or
full slots, nor tutors without an eligible slot.

The client retains a defensive `Full` rendering branch. In addition, it can
show an informational message that a **previously preferred Path A time** is now
full. That message is not a Path B compatible option and it is not selectable,
but it is a visible full-slot status elsewhere on the same assignment screen.

## Report

### Already correct

- Public Path A filters available tutors and slots by active status, subject,
  relevant schedule window, and remaining capacity.
- Staff Path B uses the same shared filters for each compatible tutor and slot.
- Full slots are excluded from both normal available-options API responses.
- Tutors with no eligible remaining slot are excluded from both normal
  available-options API responses.
- The server repeats active/capacity validation at assignment time to protect
  against stale selection.

### Incorrect

Under the strictest reading of “full slots must be excluded entirely from the
UI,” the implementation still contains:

- a defensive `Full`/disabled slot branch in the public client;
- a defensive `Full`/disabled slot branch in the Staff client;
- an informational Staff message for a previously preferred Path A slot that is
  now full.

Those paths are not normal selectable availability results. The shared queries
already exclude such records. They are presentation fallbacks/status messages,
not failures of the availability query.

### Not verified

- Controlled browser evidence showing no full or inactive slot after loading
  fixtures for both public Path A and authenticated Staff Path B.
- A runtime response generated from a tutor with multiple slots where one is
  full or inactive and one remains eligible.

### Smallest fix required

No data-query or server eligibility fix is required for the normal available
options lists.

If the requirement literally prohibits any `Full` label anywhere in these
screens, remove the defensive client `Full` branches and the informational
previously-preferred-slot message. That would be a presentation-only change and
would not alter the server eligibility rules.

## Evidence

| Check | Result | Exact responsibility |
| --- | --- | --- |
| Active tutor filter | Verified | `listOpenTutorsForSubjectWindow` in `src/lib/booking/open-slots-for-subject-window.ts` |
| Subject compatibility filter | Verified | Same helper joins `tutorSubjects` to the resolved subject |
| Active slot filter | Verified | Shared tutor and slot helpers |
| Remaining-capacity filter | Verified | Shared predicate: `booked_seats + held_seats < capacity_seats` |
| Public Path A UI | Verified from source | `src/components/public-ay-tutoring-registration-form.tsx` |
| Staff Path B UI | Verified from source | `src/components/staff-tutoring-request-assign-client.tsx` |
| Stale selection protection | Verified | `src/lib/booking/assign-tutoring-request.ts` |
| Controlled browser matrix | Not verified | No dedicated runtime fixture run for this report |

## Verified working

- The current public and Staff available-option queries exclude full/inactive
  slots and unavailable tutors before rendering.
- The shared capacity predicate includes both booked and held seats.

## Verified broken

- Nothing in the normal available-option query path.
- The literal “no Full label anywhere” interpretation is not fully met because
  defensive/informational UI branches remain.

## Still unverified

- Browser runtime matrix for all active/inactive/full combinations.

## Minimum next implementation work

- No server-side eligibility change is indicated by this verification.
- Decide whether informational/defensive `Full` text should remain. If not,
  remove those presentation-only branches and add browser coverage.