# Button

Source: DESIGN-tutoring "Primary CTA / Ghost / Text / Destructive Button"; mockup Dashboard.tsx header band (lines ~127).

Variants:
- **default (Primary CTA)** — Midnight Navy fill (`primary` token), Paper text, 14px radius, 12px 20px padding, Arial 14px weight 800, letter-spacing 0.02em. Hover: Navy Lift (elevate). ONE per viewport.
- **outline (Ghost)** — transparent fill, 1.5px `primary` border, Ink text, 14px radius, 10px 20px padding, Arial 14px weight 700.
- **ghost (Text button)** — no border/fill, Harbor `#4c78a8` text, Arial 12px weight 800. Used for "Open", "Change", row trailing actions. Hover: Harbor Deep `#3a628c`.
- **destructive** — Alert Red (`destructive`) fill, Paper text, 14px radius. Must be preceded by native `confirm()`.
- **secondary** — Navy Soft fill, navy text (soft tile actions).

Implementation: restyled scaffold `button.tsx` (keep CVA API, slots, sizes; adjust classes only).
