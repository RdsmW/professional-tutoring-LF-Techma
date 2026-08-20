// hint: Structural change (rename/retype). Check callers of this entity.
- [Academic Year collections](academic-year-collections.md) — fixed Academic Year plans use persisted installments and server-side off-session collection, not open-ended subscriptions.
- [Academic Year contractual approvals](academic-year-contractual-approvals.md) — keep the agreement verbatim and surface the two source/app conflicts until client approval.
- [Mapbox address search](mapbox-address-search-authorization.md) — autocomplete uses a server route and needs a token authorized for Mapbox Geocoding or Search.
- [Nested app dependencies](nested-app-dependencies.md) — package repair tools may target the workspace root; validate the nested app from its own lockfile.
- [Same-app Reserved VM billing scheduler](reserved-vm-billing-scheduler.md) — the loopback scheduler runs beside Next.js; Clerk bypass is paired with its own billing-secret authorization.
- [Public-form test fixtures](public-form-test-fixtures.md) — Playwright must seed a published form version and sign its token; development-page tokens may be intentionally blank.
- [SQL migration application](sql-migration-application.md) — this project has no Drizzle journal; tracked SQL migrations run through `psql` and need a post-merge entry.
- [Public form renderer fallbacks](public-form-renderer-fallbacks.md) — publish a compatible version before rendering legacy form content.
- [Non-production availability fixtures](non-production-availability-fixtures.md) — fixture setup is explicit test-only work; availability and finalization reads must not mutate capacity.
