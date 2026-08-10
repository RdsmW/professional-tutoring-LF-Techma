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
- Book Tutoring: Academic/Summer subjects, schedule windows, payment plans from this catalog; APIs reject unknown catalog values
- Stripe card-on-file during Book Tutoring **only after** explicit save-card permission (tokens + brand/last4 only)

## Next Stage 2 composition

- **Enroll** mounts First Class slots, Express (pending time), or Master Class session checkboxes + course payment radios
- Full Gravity verified-intake field dump on tutoring journeys (deferred from Book Tutoring slice)
