# Component inventory — Professional Tutoring Design System

Sources of truth (spec-seeded + workspace mockup code):
- `attached_assets/DESIGN-tutoring_1787075610624.md` — full style reference ("Components" section, tokens, do's/don'ts).
- `artifacts/mockup-sandbox/src/components/mockups/staff-dashboard/Dashboard.tsx` — the user-APPROVED staff dashboard. Where it diverges from the spec it WINS: nested-panel KPI card (label header + inset white panel, no gold eyebrow), active nav has NO 3px gold inset bar (well only), cards have no colored edge bars.

Implementation path: scaffold-seeded (restyle scaffold shadcn primitives with token CSS vars) except families the scaffold lacks (KPI card, page header, sidebar nav), which are built new from the mockup code.

| Family | Reference | Depends on | Evidence / importance | Chunk | Status |
|---|---|---|---|---|---|
| button | components/button.md | — | Spec: 4 button roles; mockup header CTAs. Highest usage. | 1 (pilot) | implemented |
| status-pill | components/status-pill.md | — | Spec "Status Pill"; mockup Pill used in tables, queue, badges. | 1 (pilot) | implemented |
| card | components/card.md | — | Spec KPI/feature/highlight cards; every dashboard band. | 1 (pilot) | implemented |
| kpi-card | components/kpi-card.md | card | Approved mockup KpiCard (nested-panel FlowDesk style) — supersedes spec's eyebrow KPI card. | 1 (pilot) | implemented |
| data-table | components/data-table.md | status-pill, avatar | Spec "Data Table"; mockup StudentsTable. Primary directory surface. | 1 (pilot) | implemented |
| avatar | components/avatar.md | — | Initials in Navy Soft wells (33px), spec Imagery rules. | 2 | implemented |
| input | components/input.md | — | Spec: 14px radius, Line border, Surface Lift fill. | 2 | implemented |
| skeleton | components/skeleton.md | — | Spec "Page Loading State"; mockup DashboardSkeleton pulse. | 2 | implemented |
| progress | components/progress.md | — | Mockup CapacityRow bar (mint on canvas, pill radius). | 2 | implemented |
| toast | components/toast.md | — | Spec "Success Toast" — the only overlay besides native alerts. | 2 | implemented |
| page-header | components/page-header.md | button, card | Spec "Page Header Band" + mockup hero band (eyebrow + Georgia title + CTA). | 3 | implemented |
| sidebar-nav | components/sidebar-nav.md | avatar | Spec "Navigation Sidebar" + mockup aside (no gold inset bar per approval). | 3 | implemented |
| empty-state | components/empty-state.md | button | Spec "Empty State". | 3 | implemented |

All inventory families are implemented and demoed. `scroll-area` is kept solely as a preview-shell dependency (DesignSystemBrowser), not an exported design-system family.

Excluded by the source's own rules: dialogs/modals/sheets/drawers/popovers (spec mandates native `alert()`/`confirm()`/`prompt()`, "no custom modal overlays"), and all stock families the spec doesn't define. Icon library: spec names HugeIcons; lucide-react is the project-wide stand-in (documented substitution).
