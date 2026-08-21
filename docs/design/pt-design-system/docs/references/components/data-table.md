# Data Table

Source: DESIGN-tutoring "Data Table"; mockup `StudentsTable` (Dashboard.tsx lines 78–97).

Container: Paper, 14px radius, 1px Line border, overflow hidden.
Header row: Canvas `background` fill, Arial 12px weight 800 uppercase, letter-spacing 0.08em, Slate, min-height 38px, 10–16px vertical / 20px horizontal padding.
Body rows: min-height 60px, Paper, 1px Line hairline bottom, Arial 14px Ink; primary name 700 with leading 33px initials avatar; meta 12px Slate. Hover: Surface Lift `#fbfcfa`.
Status via semantic pills; trailing text-button in Harbor. Sticky header on long lists. Never an unstyled HTML table.

Implementation: restyled scaffold `table.tsx` (keep Table/Header/Body/Row/Head/Cell API; theme classes only).
