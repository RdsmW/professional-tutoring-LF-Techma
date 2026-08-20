---
name: Public-form test fixtures
description: How integration tests obtain a valid public-form version token.
---

Public registration integration tests must initialize a published public-form version and issue a signed token from that fixture instead of scraping the development page. Public pages must never render an unversioned fallback form: recover a missing or invalid baseline into a persisted version, or fail clearly.

**Why:** An unversioned fallback looks valid to a family but has no signed token, so submission fails only after they complete the entire form.

**How to apply:** Keep schema initialization and published-version seeding in test setup. Generate the test token with the same signing secret and payload format that the server validates; do not relax production token validation to make tests pass. Preserve malformed versions for audit before restoring a safe baseline.