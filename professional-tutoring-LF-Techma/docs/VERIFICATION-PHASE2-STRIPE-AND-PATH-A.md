# Verification — Phase 2 Stripe and Path A

## Scope verified

- Path A finalization rejects a tutor that became inactive after selection.
- Path A finalization rejects a tutor that no longer teaches the request’s primary subject.
- Path A finalization rejects a slot moved outside the original schedule window.
- Concurrent Path A finalization reuses one existing booking.
- Full Year, Semester, and Monthly registrations create their complete fixed installment schedules.
- Path B1 public registration continues to create no booking before staff assignment.

## Results

| Check | Result |
| --- | --- |
| `npm exec tsc -- --noEmit` | Passed |
| `npx tsx scripts/apply-ay-billing-phase2.mts` | Passed |
| `npm run test:smoke -- e2e/ay-billing-schedule.spec.ts e2e/path-a-finalization-safety.spec.ts e2e/public-ay-registration.spec.ts` | 11 passed, 1 skipped |
| `npm run build` | Passed |
| Main application workflow restart | Running |
| Public Academic Year registration preview | Rendered successfully |

## Targeted test evidence

- `e2e/ay-billing-schedule.spec.ts`
  - Full Year: 1 installment
  - Semester: 2 installments
  - Monthly: 10 installments
  - Each schedule has ordered sequences, one shared schedule id, a price snapshot, and a continuation token only on the initial installment.
- `e2e/path-a-finalization-safety.spec.ts`
  - 4 targeted Path A scenarios passed: inactive tutor, removed primary subject, changed schedule window, and concurrent finalization.
- `e2e/public-ay-registration.spec.ts`
  - Path B API/manual payment scenario passed.
  - The pre-existing open-slot Path A scenario was skipped because the development data set had no qualifying public availability. The independent Path A safety scenarios above passed against self-created test fixtures.

## Runtime observations

- Build and preview completed with existing Clerk development/deprecation warnings.
- No live Stripe webhook delivery was executed in this development verification.