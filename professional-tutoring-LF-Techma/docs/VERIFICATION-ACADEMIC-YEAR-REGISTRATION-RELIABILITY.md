# Academic Year Registration Reliability — Verification

## Environment

- Verified locally on the development database and configured Next.js workflow.
- Verification date: 2026-08-20.

## Static checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed |
| `npm run lint` | Passed with 7 pre-existing warnings and no errors |
| `git diff --check` | Passed |

## Focused browser and API coverage

Command:

```sh
npx playwright test e2e/public-ay-registration.spec.ts e2e/path-a-finalization-safety.spec.ts e2e/ay-billing-schedule.spec.ts --reporter=list
```

Result: **18 passed**.

Observed outcomes:

- The public form’s parent contact controls use specific Parent 1 / Parent 2 names and are marked required.
- The client blocks incomplete parent contact details before it advances.
- The registration API rejects missing Parent 2, invalid Parent 2 phone data, missing form tokens, and tampered form tokens.
- A token read from the rendered registration page successfully submitted valid Path A and Path B registration payloads.
- A Parent 2 already associated with another household was rejected with the recoverable `parent2_conflict` response.
- All advertised Academic Year scheduling windows returned a tutor and a selectable slot from the explicitly seeded non-production fixture.
- A fixture slot made full in the test remained unavailable through public availability reads; its original capacity and hold values were restored by test cleanup.
- Existing slot finalization safety and Academic Year billing schedule coverage passed with the required Parent 2 payload.

## Runtime verification

- The `Start application` workflow restarted successfully and reported `Ready`.
- The public `/register/academic-year-tutoring` page rendered in preview with the registration welcome step and start action visible.
- Fresh workflow logs contained no application startup error.
