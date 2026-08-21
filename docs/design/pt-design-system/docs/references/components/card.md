# Card

Source: DESIGN-tutoring surfaces/elevation; mockup `Card` component (line ~45).

Paper `card` background, 1px Line border, 14px radius, 20px padding, NO drop shadow — elevation is Paper-on-Canvas only. No colored edge/accent bars (removed during mockup approval). Variants:
- default — Paper + Line border.
- highlight (Feature Highlight) — Gold Soft or Navy Soft tinted fill, no border, 20px padding; tint signals interactivity.

Implementation: restyled scaffold `card.tsx` (keep Header/Title/Description/Content/Footer API; Title uses Georgia serif).
