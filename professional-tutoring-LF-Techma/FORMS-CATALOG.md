# Five-form field catalog

Machine-readable catalog for Professional Tutoring’s five live service forms. Extends (does not replace) `../FORM-TO-APP-FIELD-MAPPING.md`.

## Source URLs

| Form | URL |
|------|-----|
| Academic-Year Tutoring | https://juliarosspt.com/academic-year-tutoring-registration/ |
| Summer Tutoring | https://juliarosspt.com/summer-tutoring-registration/ |
| First Class (9 month) | https://juliarosspt.com/sat-act-first-class-9-month/ |
| The Express (6 month) | https://juliarosspt.com/sat-act-the-express-6-month/ |
| Summer Master Class | https://juliarosspt.com/sat-master-class-summer-2026/ |

## Code

- [`src/lib/forms/types.ts`](src/lib/forms/types.ts) — control types and owners
- [`src/lib/forms/options.ts`](src/lib/forms/options.ts) — shared option lists
- [`src/lib/forms/field-catalog.ts`](src/lib/forms/field-catalog.ts) — field definitions
- [`src/lib/forms/form-profiles.ts`](src/lib/forms/form-profiles.ts) — per-form composition

## Control rules

- **radio** — few single-choice options (gender, payment plan, yes/no, First Class slots)
- **select** — long single lists (state, graduation year, referral)
- **checkbox_group** — multi-select (subjects, schedule windows, Master Class sessions)
- **text / textarea** — names, phones, school (until lookup), learning needs, notes
- **restricted** — birthdate, 504/IEP, testing accommodations (not on list cards)

**Do not invent:** Express time slots (`EXPRESS_TIME_SLOTS.status = pendingClientConfirmation`). Summer Master Class agreement-title inconsistency stays gated.

## Wired today

- Add Student: grade select, graduation year select, gender select, academic subject multi-select for learning needs
- Family onboarding: US state select + Mapbox address autocomplete
- Book Tutoring: Academic/Summer subjects, schedule windows, payment plans; optional referral source + test-prep interests; APIs reject unknown catalog values
- Enroll in Courses: course payment plans / slots from catalog; optional referral source persisted on enrollment
- Stripe card-on-file during Book/Enroll **only after** explicit save-card permission (tokens + brand/last4 only)

## Deferred (not Stage 2 closeout)

- Restricted accommodations / 504 / IEP collection
- Academic rate packages as live charge matrix
- Parent2 / billing contact Gravity dumps
- Express time slots (pending client confirmation)
- Dynamic `fieldsForForm` UI engine
