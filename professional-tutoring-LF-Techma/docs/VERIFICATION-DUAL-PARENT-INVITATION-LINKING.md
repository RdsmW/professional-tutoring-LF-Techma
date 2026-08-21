# Dual-Parent Invitation Linking Verification

**Type:** Verification only  
**Date:** 2026-08-21  
**Scope:** Existing Academic Year guardians, independent Clerk invitation delivery,
invitation acceptance linkage, generic bootstrap safety, and Clerk identity
uniqueness.

## Result

The implemented and automated portions of the dual-parent invitation fix passed.
The development schema migration was applied after a duplicate-identity preflight,
and the application started cleanly after the final server restart.

## Automated verification

| Check | Result |
| --- | --- |
| TypeScript (`npx tsc --noEmit`) | Passed |
| Focused Academic Year, invitation, Path A, and origin suite | Passed — 25 tests |
| Production build (`npm run build`) | Passed |
| Development migration `0027_guardian_clerk_identity_unique.sql` | Applied successfully |
| Main application workflow | Restarted and running |
| Independent implementation review | Passed |

The focused invitation coverage verifies:

- two separate parents receive independent invitations without duplicate sends;
- delivery stops when either parent is neither linked nor invitation-ready;
- a partial delivery retries only the unresolved parent;
- stale reservations recover an existing Clerk invitation rather than resending;
- a successful Clerk send with failed database recording remains recoverable;
- an ambiguous Clerk timeout remains recoverable without a second send;
- both parents link to their original household under distinct Clerk identities;
- same-identity acceptance replay succeeds while mismatched email, cross-parent
  identity reuse, and concurrent duplicate claims are rejected;
- no acceptance path creates a household or guardian.

## Controlled live Clerk acceptance

This verification did not create a new live Clerk acceptance run. Completing that
check requires two independently controllable Clerk identities to accept the two
delivered invitations. No new live Academic Year registration, payment,
invitation, or cleanup was performed during this implementation verification.

## Build observations

The successful production build continues to print the pre-existing Next.js
workspace-root warning and a dynamic-rendering warning for the staff page. Neither
warning failed the build or originated from this invitation change.