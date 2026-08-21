# Controlled Dual-Parent Live E2E Verification

**Type:** Verification only  
**Date:** 2026-08-21  
**Scope:** Live Clerk invitation acceptance for both guardians in one existing
Academic Year household.

## Result

The initial controlled dual-parent live flow exposed a Clerk return-path
reliability gap. After the focused return-path fix, the same two controlled
test identities completed first-time sign-up successfully on the first
invitation click. No application source code was changed during the final
live reset and verification.

## Verified checkpoints

- The active HTTPS application origin was used for the replacement invitations.
- Exactly one original household remained.
- Both original guardians remained attached to that household.
- Parent 1 and Parent 2 retained their original guardian records.
- Parent 1 accepted the invitation and linked to the existing Parent 1 guardian.
- Parent 2 accepted the invitation and linked to the existing Parent 2 guardian.
- The two guardians linked to distinct Clerk user identities.
- Both invitation acceptance timestamps were recorded.
- One student and one tutoring request remained associated with the household.
- The existing Academic Year payment schedule remained intact.
- No additional household, guardian, student, tutoring request, or booking record
  was created during either acceptance.
- The supported retry behavior was exercised during the Parent 1 flow; the
  second attempt linked the existing guardian rather than creating a duplicate.

## UX limitation observed in the initial run

The first-time Clerk authentication path did not reliably return the user to
the invitation route:

- After creating or signing in to a Clerk account, the browser could land on
  Clerk's `default-redirect` or the Family Portal instead of returning to the
  original `/invite/<token>` route.
- In that state, the application cannot run its invitation acceptance request,
  so the Clerk user exists while the original guardian remains temporarily
  unlinked.
- Reopening the same invitation while signed in returned to `/invite/<token>`,
  linked the existing guardian, and completed successfully without creating a
  duplicate.
- The same redirect detour was observed during the second parent flow before
  the accepted-invite screen and Family Portal were reached.

This limitation was resolved by the focused return-path fix and then verified
through a fresh first-time sign-up run below.

## Final state

The household contains two independently linked guardians, each resolving to
the same Family Portal household. Parent 1 and Parent 2 are both accepted and
linked; no duplicate business records or invitation deliveries were observed.

## Post-fix manual return-path check

After the return-path fix, reopening an already accepted invitation while signed
out first showed Clerk's expected “Invitation is already accepted” message.
After signing in, the browser returned automatically to the application's
`Invite accepted` screen and then the Family Portal without a second email
click. This confirms the sign-in/replay handoff for an existing token.

Because both controlled invitations had already been consumed, this manual check
does not recreate a first-time sign-up. The first-time sign-up return contract
is covered by the focused return-path tests.

## Final first-time sign-up verification

The two controlled Clerk users were reset without changing either original
guardian, their shared household, the student, the tutoring request, bookings,
or payment records. One fresh pending invitation was dispatched to each same
email address with the validated HTTPS application origin.

Parent 1 and Parent 2 each completed this flow without a second email click:

`invitation → first-time Clerk sign-up → original /invite/<token> → existing
Guardian linked → Family Portal`

Final database verification confirmed:

- 2 distinct Clerk user IDs.
- The same 2 original Guardian IDs.
- 1 original Household.
- 1 Student.
- 1 tutoring request.
- 0 bookings and 10 payment records, unchanged.
- No duplicate business records.