---
name: Clerk invitation redirect delivery
description: Verify delivered Clerk invitation CTAs independently from invitation creation.
---

A successful Clerk invitation creation and a stored delivery timestamp do not
prove that the email CTA reaches the application's guardian-acceptance route.

**Why:** Email delivery, app token validity, and the external redirect target
are separate systems; any one can succeed while the next step fails.

**How to apply:** Treat email delivery, CTA routing, invite-page context, and
acceptance as distinct assertions. Do not resend an invitation to diagnose a
broken CTA; inspect the redirect configuration and fix it separately before
running a new controlled verification.