---
name: Public-form test fixtures
description: How public-form version tokens stay valid in real pages and isolated tests.
---

The real public registration page must render a signed token for its valid
published version. A null hidden token is a live-flow defect, not expected
development behavior. Isolated API tests must initialize a published
public-form version and may mint a fixture token only when they are
intentionally not testing page rendering.

**Why:** An unversioned fallback looks valid to a family but has no signed
token, so submission fails only after they complete the entire form. A published
form can become structurally incompatible when protected catalog labels change;
the safe parser correctly prevents submission but must not leave the real page
with no usable token.

**How to apply:** Keep schema initialization and published-version seeding in
test setup. Generate fixture tokens with the same signing secret and payload
format that the server validates. When an existing public version fails parser
validation, preserve the validation rule and republish compatible content
through the audited form service. Include a browser-level test that uses the
page-rendered token; do not relax production token validation to make tests
pass. Preserve malformed versions for audit before restoring a safe baseline.
