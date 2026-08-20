# Verification Report Template

Use this template for a future verification request that does not already have
its own `.md` report.

## File separation rule

- One verification request gets one dedicated report file.
- Do not combine unrelated verification requests.
- Do not place implementation requirements in a verification report.
- Do not place Dashboard/Settings action requirements in a verification report
  unless the user explicitly asks for a separate Dashboard/Settings
  verification.
- Do not duplicate an existing report.
- The existing Stripe/Phase 1/Phase 2 report is:
  `docs/CURRENT-IMPLEMENTATION-VERIFICATION.md`.

## Verification metadata

```md
# [Specific verification name]

**Type:** Verification only
**Date:**
**Instruction source:**
**Scope:**
```

## Constraints

- Inspect current code and runtime behavior.
- Do not implement fixes unless the user separately asks for implementation.
- Do not change business behavior to make a test pass.
- Use controlled test data only when necessary.
- Record limits and blocked scenarios explicitly.

## Already correct

- Current behavior:
- Exact routes:
- Exact files/functions:
- Runtime evidence:

## Incorrect

- Current behavior:
- Expected behavior:
- Exact routes:
- Exact files/functions:
- Evidence:
- Risk:

## Not verified

- Item:
- Why it could not be verified:
- Minimal prerequisite:

## Smallest changes required

- Minimal next implementation:
- Relevant files:
- Out of scope:

## Verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Source inspection | | |
| Database/runtime | | |
| UI/runtime | | |
| TypeScript | | |
| Lint | | |
| Tests | | |

## Verified working

## Verified broken

## Still unverified

## Minimum next implementation work