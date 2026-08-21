---
name: Zoho CRM write authorization
description: How to interpret CRM write failures when the existing Zoho authorization still passes read checks.
---

A stored Zoho authorization can pass Accounts, Contacts, Deals, and metadata GET checks while CRM write requests return HTTP 401. Treat that as an authorization-grant problem, not a reason to weaken write safety or retry creates.

**Why:** Zoho scopes are bound to the consented authorization grant. Adding CREATE/UPDATE scopes to a future authorization URL does not add them to an already stored refresh authorization.

**How to apply:** Keep the existing read gate and fail-closed search behavior. Preserve the local failed sync state, then have an authorized operator complete a new consent flow with the approved write scopes before retrying the same registration; stored IDs make any partial retry idempotent.