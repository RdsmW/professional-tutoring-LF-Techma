# Live Clerk Invitation E2E Verification

**Type:** Verification only  
**Date:** 2026-08-20  
**Instruction source:** Controlled live Clerk invitation verification plan  
**Scope:** This report retains the prior incomplete attempts and records the
final isolated non-production Academic Year Tutoring dispatch using the
separately addressed mailbox supplied during verification. The final dispatch
attempt did not change application source, payment logic, invitation logic, or
redirect behavior. Other in-progress workspace changes are outside this
verification report and were not assessed here.

## Result

**Latest controlled dispatch failed at the delivered invitation link.** The
separately addressed mailbox and a unique phone number passed preflight. The
browser registration, test-mode SetupIntent, and exactly one finalization
completed; Clerk created one invitation and the guardian delivery state was
stored. The recipient confirmed receipt in spam, but clicking the email CTA
showed a `404 page not found` instead of entering the existing invite flow.

The stored invite token still returns `200` from the application's invite API
and loads the expected household/guardian context internally. Therefore the
observed defect is limited to the delivered email's redirect path. No second
invitation, retry, acceptance, or finalization replay was attempted.

The designated mailbox is masked below. No mailbox address, password,
verification code, signed continuation token, form token, or Clerk URL is
stored in this report.

## Controlled-environment preflight

| Check | Result | Observed evidence |
| --- | --- | --- |
| Stripe environment | Passed | Configured Stripe account reported `livemode: false`; publishable and secret key checks identified test keys. |
| Clerk environment | Passed | Both configured Clerk key checks identified test keys. The running app and browser console identified the Clerk development environment. A read-only Invitations API call succeeded. |
| Test inbox | Passed | The connected Gmail mailbox `na***@gmail.com` was reachable. |
| Academic Year form | Passed | `academic_year_tutoring` definition was active with one published version. |
| Prior matching Clerk invitations | Passed | Read-only Clerk lookup for the masked mailbox returned count `0` at `2026-08-20T18:59:57Z`. |
| Prior matching database records | Passed | Guardian count `0`, guardian delivery count `0`, and staff count `0` for the masked mailbox. |

`checkClerkManagementStatus` reported Replit-managed Clerk as `not_configured`;
the service-level test-key checks and the successful read-only Clerk API call
were used for this controlled development verification.

## Fresh isolated verification attempt

### Preflight

| Check | Observed result |
| --- | --- |
| New inbox alias | A new alias of the connected Gmail test mailbox was generated in runtime and is masked in this report. |
| Existing Gmail threads for the alias | `0` before registration and `0` after the blocked attempt |
| Existing database guardian/student for alias and marker | `0` / `0` before registration |
| Existing Clerk invitations for alias | `0` before registration; `0` after the blocked attempt |
| Stripe environment | Stripe Balance read reported `livemode: false` |
| Academic Year form token | The real browser page rendered a signed `formVersionToken` before registration |
| Published Academic Year form versions | `1` |

### Registration and payment evidence

- Created at: `2026-08-20T19:36:48Z`
- Registration marker: `LIVECLERKMT1…`
- Masked household ID: `9cc2…fb42`
- Masked SetupIntent ID: `seti…F8Xj`
- First installment due date: `2026-09-01T12:00:00Z`
- Continuation expiry at observation: `2026-08-20T20:06:48Z`
- Selected path: Academic Year, Path B, monthly, automatic charge, staff-selected scheduling, Stripe test mode.

| Relationship / state | Observed result |
| --- | --- |
| Households for fresh marker | `1` |
| Guardians in fresh household | `1` |
| Students in fresh household | `1` |
| Tutoring requests in fresh household | `1` |
| Scheduled payment records | `10` |
| SetupIntent state after failed confirmation request | `requires_payment_method` |
| Payment setup completed | No |
| Continuation consumed | No |
| Guardian Clerk invitation ID / sent timestamp | Absent / absent |
| Clerk invitation count for fresh alias | `0` |
| Gmail invitation threads for fresh alias | `0` |

### Blocking observation

The normal browser payment component supplies a `return_url` when it confirms
Stripe card setup. The verification runner instead used a direct Stripe SDK
confirmation to keep the supplied test card and continuation in one runtime,
but omitted that required parameter. Stripe returned the following concrete
error before finalization:

> This SetupIntent is configured to accept payment methods enabled in your
> Dashboard. Because some of these payment methods might redirect your customer
> off of your page, you must provide a `return_url`.

No normal finalization call was made, so no Clerk invitation, delivery, invite
link, acceptance, identity linkage, or finalization replay could be verified.
The runner was removed after the failure and its plaintext continuation is not
stored in the database, repository, or this report. Reconstructing it or
modifying the fresh partial record would violate the controlled-run boundary.

### Subsequent authorized isolated-alias attempt

An additional alias was authorized after the earlier runner failure. Its exact
preflight again found zero Gmail threads, database guardians/students, and
Clerk invitations, with Stripe confirmed in test mode and the published form
available. The real browser page rendered a signed form token, but its
registration request returned:

> `409 ambiguous_identity` — We found a possible existing family but could not
> match this email safely.

A follow-up database read confirmed zero students and zero payment records for
that attempt's unique marker. Therefore it did not create a household,
guardian, request, SetupIntent, invitation, email, link, acceptance, or
replay state.

Subsequent inspection identified the matching contact phone—not the Gmail
plus-alias—as the collision source.

### Supplied mailbox connectivity check

The supplied address was checked against the current Gmail connector before any
registration:

| Check | Observed result |
| --- | --- |
| Supplied mailbox exact database guardian count | `0` |
| Supplied mailbox exact Clerk invitation count | `0` |
| Connected Gmail profile equals supplied address | `false` |
| Connected inbox search for supplied address | `0` matching threads |
| Registration created | No |
| Payment or SetupIntent created | No |
| Clerk invitation or email sent | No |

The supplied mailbox must be connected through the workspace Gmail integration
before a live invitation can be verified. No mailbox credentials were requested
or stored.

## Controlled registration evidence

- Created at: `2026-08-20T19:03:35Z`
- Registration marker: `LIVECLERKMT1…`
- Masked household ID: `87f7…9bc8`
- Masked student ID: `2d5d…770a`
- Masked tutoring-request ID: `f3d0…5c34`
- First scheduled-payment ID: `2663…9448`
- Public registration route: `POST /api/public/ay-tutoring-registration`
- Payment preparation route: `POST /api/public/ay-tutoring-payment/prepare`
- Selected controlled path: Academic Year monthly plan, automatic charge
  enabled, staff-selected scheduling path, Stripe test configuration.

The registration created one household, one guardian, one student, one
tutoring request, and ten scheduled payment records. The tutoring request's
student was confirmed to belong to its household.

| Relationship / state | Observed result |
| --- | --- |
| Household records for the marker | `1` |
| Guardians in that household | `1` |
| Students in that household | `1` |
| Tutoring requests in that household | `1` |
| Scheduled payment records in that household | `10` |
| First payment status | `pending` |
| First payment instrument | SetupIntent present; PaymentIntent absent |
| First payment due date | `2026-09-01T12:00:00Z` |
| Setup completed | No |
| Continuation consumed | No |
| Guardian invite token | Present |
| Guardian Clerk invitation ID / sent timestamp | Absent / absent |
| Guardian Clerk user / invite acceptance timestamp | Absent / absent |

## Runtime issues checked before resumption

### Published form-version token

The published form record was structurally present but its content failed the
protected-form parser on twelve saved option-label values for the Academic Year
rate and payment-plan fields. The fallback behavior therefore returned no
published version ID and the live page emitted a null form token.

The existing audited public-form service created and published version `2` at
`2026-08-20T19:18:45Z`. It regenerated only the three protected field label
maps from the active catalog and retired version `1`; form-version validation
was not weakened.

After publication:

| Check | Observed result |
| --- | --- |
| Published form version ID | Present |
| Server-issued form token | Present |
| Rendered public-page token | Present and signed |
| Regression | `e2e/public-ay-registration.spec.ts` completes the rendered browser form through Review, invokes its normal submit handler, and verifies the intercepted browser request carries the page-rendered signed token. The final response is mocked, so this regression does not create another registration. |

### Clerk development-key consistency

| Check | Observed result |
| --- | --- |
| Browser publishable key | Present in the rendered page and exactly matched the configured development publishable-key value |
| Backend secret | Successfully read a Clerk **development** instance through the Clerk backend API |
| Fresh browser session | `GET /sign-in` returned `200`; no infinite-redirect-loop warning was observed in the isolated browser context |
| Key rotation or replacement | Not performed; no key mismatch was confirmed |

The long-lived preview context continued to produce Clerk's redirect-loop
warning after the app restart. Because it did not reproduce in a fresh browser
session and the configured browser/backend checks above remained valid, this
report records it as a stale-session runtime observation rather than confirmed
key inconsistency.

## Invitation, email, link, and acceptance assertions

| Assertion | Result | Evidence / limit |
| --- | --- | --- |
| Exactly one Clerk invitation created | Passed | Browser finalization ran once at `2026-08-20T19:57:50.940Z`; guardian delivery stores `inv_…Pynk` and Clerk's mailbox query returned count `1`. |
| Invitation email received | Passed | Recipient manually confirmed receipt in the spam folder. No connected-mailbox access was used. |
| Received link opens `/invite/[token]` with household context | Failed | Recipient clicked the delivered CTA and observed `404 page not found`. The stored token's internal `GET /api/invite/[token]` check returned `200`, `ok: true`, and guardian/household context at `2026-08-20T20:04Z`; the delivered redirect did not reach that route. |
| Clerk sign-in/sign-up and acceptance link the original guardian | Blocked | The email CTA's 404 prevented the existing invite page and acceptance action. Guardian remains unlinked and unaccepted; invite token is still present. |
| Finalization replay preserves invitation identity and household count | Not run | A replay would be a second finalization after a concrete redirect failure, so it was intentionally withheld. The existing invitation identity and household remain unchanged. |

## Final controlled dispatch evidence

| Evidence | Observed result |
| --- | --- |
| Mailbox / student marker / phone | `wh***@gmail.com` / `LIVECLERKMT1…` / `571…01` |
| Form and payment setup | Browser page emitted a signed token; SetupIntent `seti…jHlI` reached `succeeded` in Stripe test mode. |
| Finalization | One `POST /api/public/ay-tutoring-payment/finalize`; response reported `emailSent: true`, `emailAlreadySent: false`, `pending: false`, and `failed: false`. |
| Original relationship set | Household `7704…1347` has one guardian `0473…58d4`, one student, one tutoring request, and ten payment records. |
| Invitation state after failed CTA | One invitation `inv_…Pynk`, sent timestamp `2026-08-20T19:57:50.940Z`, no Clerk user link, no acceptance timestamp, and token still present. |
| App route isolation check | Internal invite API response was `200` with expected guardian and household context; this did not consume the token or accept the invite. |

## Current controlled payment state

At `2026-08-20T19:21:11Z`, the original record had one pending SetupIntent
(`seti…lbQH`) with Stripe status `requires_payment_method`. Its continuation
expiry was `2026-08-20T19:33:35Z`, it had not been consumed, and card setup had
not completed. The original household still had exactly one household, one
guardian, one tutoring request, ten payment records, and zero Clerk invitation
IDs.

The continuation token cannot be reconstructed from its stored hash. The
existing normal payment routes require the plaintext token, so this report
stops here rather than modifying payment data, adding a recovery mechanism, or
creating another controlled registration.

## Boundaries respected

- No production payment, production Clerk account, or production email was
  used.
- No redirect behavior, invitation mechanism, payment logic, or database
  schema was changed in response to the observed delivered-CTA failure.
- No second invitation, finalization replay, cleanup invitation, or destructive
  database cleanup was performed for the final controlled household.
- Earlier partial controlled registrations and the final blocked household were
  left intact.
- This report records the observed controlled runs through 2026-08-20. It does
  not assert a subsequent live acceptance or finalization replay after the
  delivered-link failure.

## 2026-08-21 authorized rerun preflight

At `2026-08-20T23:18:45.344Z`, an explicitly authorized new controlled run was
preflighted for the newly supplied mailbox. It was stopped before registration
because the required isolation checks did not pass.

| Check | Observed result |
| --- | --- |
| Connected Gmail mailbox equals designated mailbox | Failed — Gmail profile was readable, but did not equal the designated mailbox |
| Exact guardian records for designated mailbox | `1` |
| Existing guardian delivery state | `1` stored Clerk invitation ID and `1` sent timestamp |
| Existing guardian acceptance state | `0` linked Clerk users and `0` accepted invitations |
| Clerk invitation lookup for designated mailbox | `1` invitation; Clerk API returned `200` |
| Staff profile records for designated mailbox | `0` |
| Published Academic Year form versions | `1` |
| Stripe environment | Stripe Balance API returned `livemode: false` |
| Registration, payment setup, finalization, or invitation sent in this rerun | No |

The designated mailbox is masked in this report. No new registration marker,
household, payment continuation, Clerk invitation, email delivery check, link
open, acceptance, or replay evidence exists for this preflight because the
run stopped before those actions.

At `2026-08-20T23:23:05.775Z`, the requested retry was rechecked without
performing any write. The development database still contained one guardian
for the designated mailbox, with one stored invitation ID, no linked Clerk
user, and no acceptance timestamp. Clerk's read-only lookup returned HTTP
`200` with zero currently listed invitations. The differing database/provider
state was not treated as permission to resend: no new invitation, payment,
registration, or finalization was issued.

## 2026-08-21 authorized stale-delivery recovery

After the Clerk invitation had been explicitly deleted, the guardian's stale
database delivery markers were reset with authorization. No household,
guardian, student, tutoring request, payment record, or app invite token was
deleted or changed. The existing invitation sender then ran once and reported
`emailSent: true`, `sentCount: 1`, `emailAlreadySent: false`, `pending: false`,
and `failed: false`.

| Evidence | Observed result |
| --- | --- |
| New stored Clerk invitation | `inv_…MPWu` |
| Stored invitation sent timestamp | `2026-08-20T23:29:28.855Z` |
| Guardian / household | `0473…58d4` / `7704…1347` |
| Existing household relationships | `1` student, `1` tutoring request, `10` payment records |
| Guardian Clerk linkage / acceptance at send time | Absent / absent |
| App invite token at send time | Present and unconsumed |
| Clerk invitation list for designated mailbox before recovery | `0` active invitations |
| Clerk invitation list after recovery | `1` active invitation |

The recipient confirmed that the delivered CTA opened the invitation and
completed Clerk acceptance. Clerk's invitation list then returned one
invitation with status `accepted`.

### Acceptance database assertion

The required household-link assertion failed. The original Academic Year
guardian `0473…58d4` remained unlinked and unaccepted, retaining its app invite
token and stored invitation state in household `7704…1347`. At
`2026-08-20T23:33:07.568Z`, the application instead created guardian
`3d16…204e` in a new household `4dc0…a43b`. That new household has no
students, tutoring requests, or payment records.

| Assertion | Observed result |
| --- | --- |
| Recipient received and opened the recovery invitation | Passed — recipient-confirmed |
| Email CTA reached the invitation and Clerk acceptance flow | Passed — recipient-confirmed |
| Clerk invitation status after acceptance | `accepted` |
| Original guardian linked to original Academic Year household | Failed |
| Original guardian marked accepted and app token consumed | Failed |
| No duplicate guardian or household created | Failed — one new empty household and guardian were created |
| Idempotent finalization replay | Not run — the linkage and uniqueness assertions failed first |

No further invitation, finalization, or sender replay was issued after this
failure.