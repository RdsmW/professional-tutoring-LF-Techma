// hint: Structural change (rename/retype). Check callers of this entity.
- [Academic Year collections](academic-year-collections.md) — fixed Academic Year plans use persisted installments and server-side off-session collection, not open-ended subscriptions.
- [Mapbox address search](mapbox-address-search-authorization.md) — autocomplete uses a server route and needs a token authorized for Mapbox Geocoding or Search.
- [Nested app dependencies](nested-app-dependencies.md) — package repair tools may target the workspace root; validate the nested app from its own lockfile.
- [Same-app Reserved VM billing scheduler](reserved-vm-billing-scheduler.md) — the loopback scheduler runs beside Next.js; Clerk bypass is paired with its own billing-secret authorization.
- [Public-form test fixtures](public-form-test-fixtures.md) — Playwright must seed a published form version and sign its token; development-page tokens may be intentionally blank.
