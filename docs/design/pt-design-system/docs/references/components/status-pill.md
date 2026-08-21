# Status Pill (Badge)

Source: DESIGN-tutoring "Status Pill"; mockup `Pill` component + subject chips + Requests counter.

Shape: 9999px radius, 5px 8px padding, Arial 12px weight 800, optional uppercase with 0.05em tracking. Soft semantic fill + matching ink:
- mint: `#eaf7f2` / `#2f6f5e` (success, confirmed, paid, Active)
- gold: `#fff6e5` / `#8e661f` (pending, preview, caution)
- harbor: `#edf4fb` / `#38658f` (info, Prospect)
- rose: `#fcedf1` / `#91455a` (attention, overdue)
- navy: `#e8e9f2` / `#010345` (neutral count chips)
- violet: `#f2effb` / `#7566a8` (subjects/tags, 11px uppercase)

One pill language across tables, cards, calendars. Implementation: restyled scaffold `badge.tsx` with semantic variants above (exported as Badge; variant names mint|gold|harbor|rose|navy|violet plus default/outline mapped sensibly).
