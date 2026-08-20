---
name: Stripe SetupIntent verification
description: Constraint for controlled Academic Year card-setup verification.
---

When confirming an Academic Year SetupIntent directly through Stripe for a
controlled verification, supply the same `return_url` that the browser payment
component passes to `confirmSetup`.

**Why:** SetupIntents configured for dashboard-enabled payment methods may
allow redirect-capable methods. Stripe rejects a direct confirmation without a
return URL before finalization, even when the supplied test card itself is
valid. A lost public-flow continuation cannot be recovered from its persisted
hash afterward.

**How to apply:** Prefer the normal browser confirmation path. If a controlled
test must use the Stripe SDK, preserve its redirect parameter and retain the
single plaintext continuation only in the active runtime until finalization
and its idempotent replay are complete.