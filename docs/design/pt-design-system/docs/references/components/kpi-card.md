# KPI Card

Source: the APPROVED mockup `KpiCard` (Dashboard.tsx lines 48–64) — nested-panel "FlowDesk" style. This SUPERSEDES the spec's original eyebrow-style KPI card.

Structure:
- Outer: Card, padding 10, min-height 132.
- Header row (6px 8px 10px padding): label Arial 14px Ink left; `MoreHorizontal` 16px icon button Slate right. No divider line.
- Inset panel: white fill, 1px Line border, 12px radius, 14px padding, fills remaining height.
  - Number: Georgia 700 28px Ink, letter-spacing −0.02em, line-height 1.
  - Trend row (12px top margin, 5px gap): ArrowUp/ArrowDown 14px stroke 2.5 in trend color; bold Arial 13px trend value in trend color; Arial 13px Slate suffix.

Trend colors from semantics: mint `#5a9d88` (good), amber `#d97706` (caution), rose `#b85a72` (down/bad).

Props: `label`, `number`, `trendValue`, `trendSuffix`, `trendDir: "up" | "down"`, `trendColor` (or semantic tone). New component `kpi-card.tsx` (scaffold has no equivalent), built on Card.
