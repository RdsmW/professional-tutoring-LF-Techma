---
name: SQL migration application
description: How schema migrations are applied in this project when Drizzle has no migration journal.
---

Apply tracked SQL migration files directly with `psql` and add each one to the post-merge migration sequence.

**Why:** The project has no Drizzle migration journal, so `drizzle-kit migrate` cannot manage the existing SQL migration history reliably even when the database is reachable.

**How to apply:** For any new schema change, make its SQL idempotent where practical, apply it with the configured database connection during development, and extend the post-merge script so later environments receive the same update.