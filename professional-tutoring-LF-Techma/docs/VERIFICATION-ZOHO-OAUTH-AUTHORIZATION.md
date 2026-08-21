# Verification: Zoho OAuth Authorization

**Date:** August 21, 2026  
**Scope:** Read-only verification of the Zoho CRM OAuth authorization implementation. No Zoho CRM records were created, updated, or deleted.

## Implementation checks

| Check | Result |
| --- | --- |
| Authorization URL uses `response_type=code`, offline access, the four read-only CRM/field scopes, and a cryptographically secure state | Passed |
| Redirect URI is HTTPS with the exact `/api/integrations/zoho/callback` path and is configured server-side | Passed |
| Callback validates provider errors and state, then atomically consumes expiring state before code exchange | Passed |
| Callback is the only Zoho route bypassed by authentication middleware | Passed |
| Authorization and status routes require an explicit Clerk staff entitlement and an existing active staff profile | Passed |
| Refresh token persistence is AES-256-GCM encrypted with the workspace `SESSION_SECRET`; authorization codes and access tokens are not persisted | Passed |
| CRM verification request set is limited to GET checks for Accounts, Contacts, Deals, and Accounts field metadata | Passed |
| Refresh-token secret was migrated into encrypted credential storage without printing credential material | Passed |

## Automated checks

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed |
| `npx playwright test e2e/zoho-oauth.spec.ts` | Passed (5 tests) |
| `npm run build` | Passed |
| Credential-storage migration (`drizzle/0028_integration_credentials.sql`) | Applied successfully |

`npm run lint` remains blocked by an existing `prefer-const` error in `src/lib/family/clerk-portal-invitations.ts`, which was outside this OAuth scope. Existing warnings were also unchanged.

## Operational read-only status

After the regional provider hosts were configured, the live verifier returned:

```json
{
  "configured": true,
  "authorized": true,
  "checks": [
    { "name": "Accounts", "ok": true },
    { "name": "Contacts", "ok": true },
    { "name": "Deals", "ok": true },
    { "name": "Field metadata", "ok": true }
  ]
}
```

The verifier refreshed the stored authorization server-side and made only GET requests. No raw provider response, account data, authorization code, access token, refresh token, or client secret was displayed.