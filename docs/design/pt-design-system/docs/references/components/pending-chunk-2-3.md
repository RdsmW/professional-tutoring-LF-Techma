# Pending families (chunks 2–3) — condensed references

All from DESIGN-tutoring components section + approved mockup. Full spec text lives in `docs/references/DESIGN-tutoring.md`.

- **avatar** — initials in Navy Soft circular well, navy text, 33px table / 32px chrome / 28px small, Arial 700 11–12px. Restyle scaffold `avatar.tsx` with initials fallback default.
- **input** — 14px radius, Line border, Surface Lift `#fbfcfa` fill, Arial 14px Ink, gold focus ring. Restyle scaffold `input.tsx`.
- **skeleton** — 14px radius blocks, Navy Soft fill, opacity pulse 0.45–1 at 1.2s ease; skeletons mirror real layout (see mockup `DashboardSkeleton`). Restyle scaffold `skeleton.tsx`.
- **progress** — 8px tall pill track in Canvas, Mint fill (mockup CapacityRow). Restyle scaffold `progress.tsx`.
- **toast** — Paper (or Midnight Navy) surface, 14px radius, single soft shadow `0 12px 32px rgba(1,3,69,.07–.18)`, Mint icon well, Arial 13px 700, anchored top-right. The ONLY overlay besides native alerts. Restyle scaffold `toast.tsx`/`toaster.tsx`.
- **page-header** — Paper band, 14px radius, Line border, 14px 18px padding; eyebrow Bright Gold Arial 12px/800 uppercase tracking 0.13em; title Georgia 22px/700 Ink −0.02em; supporting copy Arial 12px Slate max 720px; primary CTA right. New component from mockup hero band.
- **sidebar-nav** — full-bleed `sidebar` navy column 248px/72px; wordmark Georgia 12px/700 Paper; section labels Chrome Label uppercase 12px 0.15em; items Arial 15px/600 Chrome Label, icons 18px Signal Gold idle / Bright Gold active; active = Navy Lift well, NO gold inset bar (approved mockup removed it). New component from mockup aside.
- **empty-state** — Paper, 14px radius, Line border, 64px 20px padding, centered; icon 24px in Navy Soft circle; Georgia 18px title; Arial 14px Slate body; one primary CTA. Restyle scaffold `empty.tsx`.
