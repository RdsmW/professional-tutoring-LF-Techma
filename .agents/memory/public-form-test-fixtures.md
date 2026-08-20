---
name: Public-form test fixtures
description: How integration tests obtain a valid public-form version token.
---

Public registration integration tests must initialize a published public-form version and issue a signed token from that fixture instead of scraping the development page.

**Why:** A development environment can render the public form with an empty hidden token even when the database schema and a published version exist. Tests then fail before exercising registration validation, billing, or scheduling.

**How to apply:** Keep schema initialization and published-version seeding in test setup. Generate the test token with the same signing secret and payload format that the server validates; do not relax production token validation to make tests pass.