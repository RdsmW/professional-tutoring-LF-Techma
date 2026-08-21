---
name: Guardian identity aliases
description: Controlled-registration identity preflight for Gmail aliases and phone numbers.
---

When a controlled registration is rejected for an existing identity, preflight
both the guardian email and every supplied contact phone against the household
matching service.

**Why:** The matching service evaluates both values. An unused address can
therefore be blocked by a phone number that is already linked to a household.

**How to apply:** Use a test address only when it can receive mail and the
email-and-phone preflight is empty. Do not bypass the identity guard.