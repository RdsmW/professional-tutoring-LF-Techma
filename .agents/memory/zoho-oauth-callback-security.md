---
name: Zoho OAuth callback security
description: Security boundary for the public Zoho OAuth callback and its long-lived credential.
---

OAuth state must be recorded as a hash with an expiry in persistent storage and atomically consumed before exchanging a code; an HttpOnly state cookie alone is not replay-safe under concurrent callbacks. The callback must be the only public integration route and sensitive integration actions require an explicit staff entitlement plus an existing active staff profile.

**Why:** A cookie can remain valid across simultaneous callback requests until the browser processes a response, and general staff helpers may auto-provision identities that should not gain control of a global OAuth credential.

**How to apply:** For any future provider OAuth callback, pair the browser-bound state cookie with a server-side, single-use state record; persist only encrypted long-lived credentials, never access tokens or authorization codes.