# Verification: Academic Year Clerk Portal Invitations

## Scope

Verification of Clerk invitation delivery for Academic Year Tutoring registrations after Stripe payment or card setup completion.

## Results

- `npx tsc --noEmit` completed successfully.
- Targeted ESLint completed successfully for the invitation dispatcher, payment finalization, Stripe reconciliation, and affected public registration UI.
- Targeted Playwright suites completed with **15 passed, 1 skipped**:
  - Academic Year billing schedules and card service fee
  - Clerk portal invitation delivery and idempotence
  - Public Academic Year registration
  - Path A finalization safety
- The skipped test is the existing opportunistic Path A page-level scenario when no open time slot is available.
- `npm run build` completed successfully.
- A read-only `clerkClient().invitations.getInvitationList({ limit: 1 })` call completed successfully, confirming access to Clerk's Invitations API without sending an email.

## Invitation-specific assertions

- The dispatch test invokes Clerk once for the existing guardian email.
- The Clerk invitation redirects to that guardian's existing local `/invite/[token]` acceptance path.
- The existing guardian retains the same household relationship.
- A second dispatch reports the prior invitation as already sent and makes no second Clerk invocation.
- An interrupted delivery reservation is reconciled against Clerk before retrying, avoiding a duplicate email after process recovery.