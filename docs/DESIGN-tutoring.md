# Professional Tutoring — Style Reference
> A quiet operations lounge at navy dusk — linen canvas, serif headlines, and a single gold wayfinding light.

**Theme:** light (Staff navy · Family forest)

Professional Tutoring uses a premium operations visual language: a near-black navy (`#010345`) anchors staff chrome and high-emphasis actions, while Family swaps that wall to forest (`#24382f`). A single gold (`#c4922e` idle, `#d8a840` active) punctuates navigation, eyebrows, and brand moments — never flooding the page. White and linen-tint surfaces dominate, giving the interface the air of a private academy desk rather than a generic admin tool. Georgia serifs carry titles and numbers; Arial carries everything else. Components are light-touch: 14px radii on cards and buttons, pill-shaped status chips, gold-tinted highlight cards, and atmospheric navy→gold washes used sparingly. The sidebar is the full-bleed dark bookend — brand color as destination, not decoration.

This system is the Navan-style reference applied to this product. **Only colour and typography are taken from the current app.** Spacing, radii, elevation, density, and component structure follow this document — not the incumbent UI.

## Tokens — Colors

Staff is the default token set. Family overrides the primary wall (navy → forest) and the canvas tint; all other tokens stay shared.

### Core (Staff default)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Navy | `#010345` | `--color-midnight-navy` | Sidebar, primary CTA fill, dark card surfaces, heading ink on inverted chrome — the near-black navy that carries Staff brand weight |
| Navy Lift | `#1a2068` | `--color-navy-lift` | Hover/active navy, pressed primary, selected nav well |
| Navy Deep | `#000233` | `--color-navy-deep` | Pressed/darker navy for destructive-adjacent navy actions |
| Navy Soft | `#e8e9f2` | `--color-navy-soft` | Light navy wash, avatar fill, selected-row tint, icon wells on canvas |
| Signal Gold | `#c4922e` | `--color-signal-gold` | Idle nav icons, eyebrows, course kickers — the single chromatic accent. Do not promote it to the primary CTA fill |
| Bright Gold | `#d8a840` | `--color-bright-gold` | Active nav icon, hover gold, selected gold moments — never an inset bar or edge strip |
| Gold Soft | `#fff6e5` | `--color-gold-soft` | Soft highlight wash for gold-tinted cards, capacity notes, warning-adjacent surfaces |
| Gold Glow | `linear-gradient(90deg, rgba(1, 3, 69, 0) 0%, rgba(26, 32, 104, 0.28) 35%, rgba(216, 168, 64, 0.28) 50%, rgba(26, 32, 104, 0.28) 65%, rgba(1, 3, 69, 0) 100%)` | `--color-gold-glow` | Horizontal brand gradient wash — navy to gold light streak used as a decorative band, never as a button fill |
| Ink | `#172133` | `--color-ink` | Primary text, icon strokes on light surfaces, heading color on canvas |
| Slate | `#697486` | `--color-slate` | Muted body text, metadata, supporting labels |
| Fog | `#8d8da5` | `--color-fog` | Tertiary text, captions, inactive placeholders *(keep for chrome hierarchy; prefer Slate for body)* |
| Chrome Label | `#b8c4d1` | `--color-chrome-label` | Sidebar labels, idle chrome text on navy |
| Chrome Mute | `#a9b8c9` | `--color-chrome-mute` | Brand subtitle, collapse control, low-emphasis chrome |
| Chrome Hover | `#ffffff` | `--color-chrome-hover` | Hover/active chrome text on navy |
| Line | `#e3e6e2` | `--color-line` | Hairline dividers, card borders, input borders — the universal separator |
| Canvas | `#f5f6f3` | `--color-canvas` | Staff page background, nav-adjacent wash — the warm linen off-white |
| Surface Lift | `#fbfcfa` | `--color-surface-lift` | Input fill, row hover, subtle panel wash — one step above canvas |
| Paper | `#ffffff` | `--color-paper` | Card surfaces, button text on dark fills, inverted text on navy |
| Jet | `#000000` | `--color-jet` | High-contrast text only when Ink is not enough (rare) |
| Navy Twilight | `radial-gradient(197.36% 161.87% at 4.08% 0%, rgba(1, 3, 69, 0.85) 6.19%, rgba(26, 32, 104, 0.75) 52.28%, rgba(196, 146, 46, 0.45) 91.18%)` | `--color-navy-twilight` | Atmospheric hero wash — deepest navy through gold. Auth/hero only, never on dashboard cards |

### Family overrides

When `.family-mode` is on, Midnight Navy and its companions remap. Gold, ink, slate, semantic colors, and Paper stay the same.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Forest | `#24382f` | `--color-forest` | Family sidebar, primary CTA, dark family surfaces — replaces Midnight Navy |
| Forest Lift | `#314c40` | `--color-forest-lift` | Hover/active forest — replaces Navy Lift |
| Forest Deep | `#1a2a23` | `--color-forest-deep` | Pressed forest |
| Forest Active | `#355247` | `--color-forest-active` | Selected nav well on family sidebar |
| Forest Soft | `#e9ede4` | `--color-forest-soft` | Family highlight wash, hero band, avatar fill — replaces Navy Soft |
| Family Canvas | `#f6f5ef` | `--color-family-canvas` | Family page background — slightly warmer linen than Staff Canvas |

In Family CSS, `--color-midnight-navy` aliases to Forest so components that consume the primary token do not fork.

### Semantic (shared)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Harbor | `#4c78a8` | `--color-harbor` | Links, secondary text-buttons, informational accent — not a CTA fill |
| Harbor Soft | `#edf4fb` | `--color-harbor-soft` | Info wash, recommendation banners |
| Harbor Deep | `#3a628c` | `--color-harbor-deep` | Link hover |
| Mint | `#5a9d88` | `--color-mint` | Success, confirmed, paid, healthy status |
| Mint Soft | `#eaf7f2` | `--color-mint-soft` | Success wash, identity-protection banners |
| Mint Ink | `#2f6f5e` | `--color-mint-ink` | Success pill text |
| Rose | `#b85a72` | `--color-rose` | Attention, change-requests, overdue |
| Rose Soft | `#fcedf1` | `--color-rose-soft` | Attention wash |
| Rose Ink | `#91455a` | `--color-rose-ink` | Attention pill text |
| Violet | `#7566a8` | `--color-violet` | Tertiary category (subjects, tags) — never a brand primary |
| Violet Soft | `#f2effb` | `--color-violet-soft` | Tertiary wash |
| Amber | `#d97706` | `--color-amber` | Caution actions (hold, pending) |
| Amber Deep | `#b45309` | `--color-amber-deep` | Caution hover |
| Alert Red | `#ff0033` | `--color-alert-red` | Destructive confirmations only |
| Alert Red Deep | `#d4002a` | `--color-alert-red-deep` | Destructive hover |
| Gray Action | `#6b7785` | `--color-gray-action` | Neutral secondary controls |
| Gray Action Deep | `#55606c` | `--color-gray-action-deep` | Neutral control hover |
| Restore | `#f4f4f4` | `--color-restore` | Quiet reset/restore control fill |
| Restore Deep | `#e0e0e0` | `--color-restore-deep` | Restore hover |
| Scroll Thumb | `#c5ccd7` | `--color-scroll-thumb` | Schedule-board scrollbar only |

## Tokens — Typography

Taken from the current app. Georgia is the editorial/display face; Arial is the workhorse. PT Sans is auth-only.

### Arial — Body, nav, buttons, badges, tables, cards — the workhorse grotesque that carries 90% of the interface · `--font-arial`

- **Substitute:** Helvetica, system-ui, sans-serif
- **Weights:** 400, 600, 700, 800
- **Sizes:** 11, 12, 14, 15, 16
- **Line height:** 1.25–1.55
- **Role:** Body, nav labels, buttons, table cells, badges, form labels. Body stays 400 at 14px. Labels, eyebrows, table headers, and buttons use 700–800 with uppercase tracking. Never set running body copy in 800.

### Georgia — Display, page titles, metrics, brand wordmark — the serif that signals academy, not SaaS · `--font-georgia`

- **Substitute:** "Times New Roman", Times, serif
- **Weights:** 700
- **Sizes:** 12, 16, 18, 19, 22, 24, 26, 27, 30, 110
- **Line height:** 1.00–1.25
- **Letter spacing:** −0.015em to −0.025em on titles
- **Role:** Page titles, section headlines, KPI numbers, sidebar wordmark, decorative Family watermark. Georgia is never used for body paragraphs, table cells, or buttons.

### PT Sans — Auth screens only (sign-in / sign-up Clerk chrome) · `--font-pt-sans`

- **Substitute:** Helvetica, Arial, sans-serif
- **Weights:** 400, 700
- **Sizes:** 16
- **Line height:** 1.5
- **Role:** Clerk auth fields and buttons. Do not import PT Sans into Staff or Family shells.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Font | Token |
|------|------|-------------|----------------|------|-------|
| caption | 11px | 1.3 | — | Arial | `--text-caption` |
| label | 12px | 1.25 | 0.08em–0.15em uppercase | Arial 800 | `--text-label` |
| ui | 12px | 1.4 | — | Arial | `--text-ui` |
| body | 14px | 1.55 | — | Arial 400 | `--text-body` |
| title | 16px | 1.3 | — | Arial 700 / Georgia 700 (KPI chips) | `--text-title` |
| heading-sm | 18px | 1.2 | −0.015em | Georgia 700 | `--text-heading-sm` |
| heading | 22px | 1.2 | −0.02em | Georgia 700 | `--text-heading` |
| heading-lg | 30px | 1.12 | −0.025em | Georgia 700 | `--text-heading-lg` |
| display | 27px | 1.0 | — | Georgia 700 | `--text-display` |
| hero | 110px | 0.9 | — | Georgia 700 | `--text-hero` |

`--text-hero` is decorative only (Family watermark). Do not use 110px for readable headlines.

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** spacious

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 28 | 28px | `--spacing-28` |
| 32 | 32px | `--spacing-32` |
| 36 | 36px | `--spacing-36` |
| 40 | 40px | `--spacing-40` |
| 44 | 44px | `--spacing-44` |
| 56 | 56px | `--spacing-56` |
| 60 | 60px | `--spacing-60` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 140 | 140px | `--spacing-140` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 14px |
| pills | 9999px |
| badges | 14px |
| inputs | 14px |
| buttons | 14px |
| tables (container) | 14px |
| avatars | 9999px |
| skeletons | 14px |

### Layout

- **Content max-width:** 1200px (expanded shell may fill remaining width when nav is collapsed)
- **Sidebar width:** 248px expanded / 72px collapsed
- **Section gap:** 80px on marketing/auth; 24px between dashboard bands
- **Card padding:** 20px
- **Element gap:** 16px
- **Shell inline pad:** 34px expanded / 28px collapsed

## Components

### Primary CTA Button
**Role:** Filled brand action

Midnight Navy (`#010345`) fill (Forest in Family), Paper text, 14px radius, 12px 20px padding, Arial 14px weight 800, letter-spacing 0.02em. The single high-saturation filled button in the viewport — every other interactive surface defers to it. Hover: Navy Lift / Forest Lift.

### Ghost Button
**Role:** Outlined secondary action

Transparent fill, Midnight Navy (Forest) border 1.5px, Ink text, 14px radius, 10px 20px padding, Arial 14px weight 700. Pairs with the primary CTA; identical silhouette, different fill logic.

### Text Button
**Role:** Inline tertiary action

No border, no fill, Harbor (`#4c78a8`) text, Arial 12px weight 800. Used for “Open”, “Change”, row trailing actions. Hover: Harbor Deep.

### Destructive Button
**Role:** Irreversible action

Alert Red fill, Paper text, 14px radius. Must be preceded by a native `confirm()` — never by a custom modal.

### Feature Highlight Card
**Role:** Light-tinted action tile

Gold Soft or Navy Soft / Forest Soft background, 14px radius, 20px padding, HugeIcons outline icon in Ink, Arial 14px weight 700 label. Used in dashboard “what next” grids — the tint signals interactivity without being a button.

### KPI / Metric Card
**Role:** Dashboard number tile

Paper background, 14px radius, 1px Line border, 20px padding. Eyebrow in Signal Gold uppercase 12px. Value in Georgia 27px / 700 Ink. Caption in Arial 14px Slate. No drop shadow; elevation is surface-on-canvas only. No left-edge colour mark.

### Data Table
**Role:** Primary directory and queue surface

Paper container, 14px radius, 1px Line border, overflow hidden. Header row: Canvas background, Arial 12px weight 800 uppercase, letter-spacing 0.08em, Slate, min-height 38px, 16px 20px padding. Body rows: min-height 60px, Paper, 1px Line hairline, 14px Arial Ink; primary name 700, meta 12px Slate. Hover: Surface Lift. Status via semantic pills (Mint / Rose / Gold / Harbor / Violet). Leading avatar (33px, HugeIcons or initials). Trailing text-button in Harbor. Sticky header on long lists. Never render an unstyled HTML table.

### Page Loading State
**Role:** First paint while data resolves

Do not leave a blank canvas. Show the page header (title + eyebrow) immediately, then skeleton blocks: 14px radius, Canvas / Navy Soft pulse (opacity 0.45–1, 1.2s ease), matching the real layout (KPI row + table rows, or form fields). Icons may be HugeIcons at muted Chrome Label. Skeletons are structural, not decorative spinners in the page center.

### Native Alert / Confirm
**Role:** Blocking interruption

Use the browser `alert()`, `confirm()`, and `prompt()` for blocking questions (delete, irreversible merge, leave-without-saving). **No custom modal overlays, no dialog chrome, no backdrop cards.** Multi-step work (create family, book tutoring) stays on the page as a wizard or full view — never in a modal.

### Success Toast
**Role:** Non-blocking confirmation

Paper or Midnight Navy background, 14px radius, single soft shadow, Mint icon well, Ink or Paper text, Arial 13px weight 700. Anchored top-right. Toasts are the only overlay besides native alerts.

### Navigation Sidebar
**Role:** Primary app navigation

Midnight Navy (Forest) full-bleed column, 248px / 72px. Wordmark: Georgia 12px / 700 Paper. Section labels: Chrome Label, uppercase 12px, letter-spacing 0.15em. Items: Arial 15px / 600 Chrome Label; HugeIcons 18px in Signal Gold idle, Bright Gold active. Active item: Navy Lift / Forest Active well only — Paper/Chrome Hover text, no inset bar, no left stripe, no underline. No top marketing bar — the sidebar is the brand wall.

### Page Header Band
**Role:** View title + primary action

Paper, 14px radius, 1px Line, 14px 18px padding. Eyebrow: Bright Gold, Arial 12px / 800 uppercase, letter-spacing 0.13em. Title: Georgia 22px / 700 Ink. Supporting copy: Arial 12px Slate, max-width 720px. Primary CTA sits on the right.

### Status Pill
**Role:** Compact state chip

Soft semantic fill + matching ink (Mint Soft / Mint Ink, Gold Soft / `#8e661f`, Harbor Soft / `#38658f`, Rose Soft / Rose Ink, Navy Soft / Midnight Navy). 9999px radius, 5px 8px padding, Arial 12px / 800 uppercase. One pill language across tables, cards, and calendars.

### Empty State
**Role:** Invitation to act

Paper, 14px radius, 1px Line, 64px 20px padding, centered. HugeIcons 24px in a Navy Soft circle. Georgia 18px title, Arial 14px Slate body, one Primary CTA. Errors do not apologize; empty screens name the next action.

## Do's and Don'ts

### Do
- Use Midnight Navy (Forest in Family) as the only filled primary CTA — one per viewport so it stays loud
- Use Signal Gold / Bright Gold for nav icons, eyebrows, and wayfinding — never as a large background fill
- Set card, button, input, and table-container radius to 14px consistently; use 9999px only for pills and avatars
- Use Georgia for titles and KPI numbers at the type scale above, with tight leading
- Keep body text Arial 400 at 14px; reserve 800 for labels, eyebrows, and buttons
- Use HugeIcons (outlined) everywhere — same optical size in a given context (18px nav, 20px table/actions, 24px empty)
- Show a skeleton loading state that mirrors the page layout; never a blank white content area
- Use native `alert` / `confirm` / `prompt` for blocking questions
- Bookend the product with the dark sidebar; keep canvas linen and cards Paper
- Keep Staff navy and Family forest as the only primary-wall swap — all semantic colors stay shared

### Don't
- Do not use Signal Gold for body text, large fills, or primary buttons — it is a wayfinding color
- Do not introduce new accent hues; semantic Mint / Harbor / Rose / Violet / Alert Red already cover status
- Do not mix Staff navy and Family forest in the same shell
- Do not use drop shadows on standard cards; rely on Paper-on-Canvas and 14px radius
- Do not set body copy, tables, or buttons in Georgia
- Do not import PT Sans outside auth
- Do not use 0px or 8px radii on cards, buttons, or tables — 14px is signature
- Do not build custom modal overlays (backdrops, dialog cards, centered forms-in-overlays)
- Do not ship mixed icon families (inline emoji, ad-hoc SVGs, font glyphs) alongside HugeIcons
- Do not leave pages without a loading treatment
- Do not ship plain, borderless, unpadded tables
- Do not stack multiple gradient washes on a dashboard view — gradients belong on auth/hero only
- Do not use accent bars anywhere: no inset stripe on sidebar tabs, no left-edge colour marks on cards, no coloured left borders on calendar slots or list rows. Active state is a fill well (or type/icon colour), not a bar. Capacity occupancy meters are data, not accent bars — keep those.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Canvas | `#f5f6f3` Staff / `#f6f5ef` Family | Base page background — the linen everything else sits on |
| 2 | Paper | `#ffffff` | Cards, tables, elevated panels |
| 3 | Surface Lift | `#fbfcfa` | Row hover, input fill, quiet wash |
| 4 | Brand Soft | `#e8e9f2` Staff / `#e9ede4` Family, or Gold Soft `#fff6e5` | Tinted highlight tiles and selected states |
| 5 | Brand Wall | `#010345` Staff / `#24382f` Family | Sidebar and inverted summary bands |

## Elevation

Avoid heavy drop shadows. Elevation is implied by surface tone (Paper on Canvas) and 14px radius. The only shadowed elements are toasts, which use a single soft long-blur (`0 12px 32px rgba(1, 3, 69, 0.07)` to `0.18`). Native browser alerts use the OS chrome — do not restyle them.

## Imagery & Icons

**Icons:** HugeIcons, outlined, 1.5-weight optical stroke, mono. On the navy/forest wall: Signal Gold idle, Bright Gold active. On canvas: Ink. Do not fill icons except in a 28–33px circular well (Navy Soft / Forest Soft). One library, one style — no mixed sets.

**Imagery:** This is an operations product, not a marketing site. Photography is rare. Auth may use a Navy Twilight wash. Family hero may use the Georgia “PT” watermark at `--text-hero` in Forest at ~4.5% opacity — that watermark is the decorative signature, not a new illustration system. Avatars are initials in semantic soft wells, not stock photos.

## Layout

App shell: 248px Brand Wall sidebar + fluid content. Content max-width 1200px with 34px inline pad; collapsed nav (72px) drops the max-width so the dashboard can breathe. Dashboard vertical rhythm: page header band → 16px → KPI row (3–4 cards, 16px gap) → 16px → table or two-column 1.3 / 0.7 detail split. Section gaps on auth/marketing run 80px. Grid usage: 3-column metrics, 1-column tables, 2-column wizards, 7-column week board. Navigation is the sidebar only — no second top bar competing with the page header.

## Agent Prompt Guide

Quick Color Reference
- primary text: `#172133` (Ink)
- background: `#f5f6f3` Staff / `#f6f5ef` Family (Canvas)
- card surface: `#ffffff` (Paper)
- border: `#e3e6e2` (Line)
- accent wayfinding: `#c4922e` / `#d8a840` (Signal / Bright Gold)
- primary action: `#010345` Staff / `#24382f` Family
- success: `#5a9d88` (Mint)
- danger: `#ff0033` (Alert Red)

Example Component Prompts

1. **Primary CTA:** Midnight Navy (or Forest) fill, Paper text, 14px radius, 12px 20px padding, Arial 14px weight 800. One per viewport.

2. **Data Table:** Paper, 14px radius, Line border. Header Canvas + Arial 12px/800 uppercase Slate. Rows 60px, hover Surface Lift, Harbor text-button on the right, HugeIcons 20px, semantic pills. Skeleton rows on load.

3. **Page Title:** Georgia 22px weight 700, Ink, line-height 1.2, letter-spacing −0.02em. Eyebrow Bright Gold Arial 12px/800 uppercase above. Supporting copy Arial 12px Slate.

4. **KPI Card:** Paper, 14px radius, Line border, 20px padding. Georgia 27px/700 number, Arial 14px label, Arial 14px Slate caption.

5. **Blocking confirm:** `window.confirm("Permanently delete this student? This cannot be undone.")` — no custom modal.

6. **Sidebar:** Midnight Navy (Forest), HugeIcons 18px Signal Gold, Arial 15px/600 Chrome Label, active Navy Lift well only — no gold inset bar.

## Gradient System

Gradients are atmospheric brand signals, not functional fills. The palette is fixed: midnight navy (`#010345`) → navy lift (`#1a2068`) → signal gold (`#c4922e` / `#d8a840`), always at 0.25–0.85 opacity. Apply as full-bleed radial washes on auth/hero only. Never use gradients on buttons, cards, tables, or text. The gold stop is the surprise — it keeps navy from feeling like a generic admin theme.

## Type Pairing Logic

Georgia and Arial are deliberately paired: Georgia carries the academy voice (titles, KPIs, wordmark) while Arial carries the operations voice (body, nav, tables, buttons). The contrast is the system's most distinctive typographic choice — it reads as “private tutoring prospectus meets staff desk.” Never use both in the same line; Georgia headlines sit above Arial subheads, not inline. PT Sans is a third face for Clerk auth only so the login screen can stay independent of the shell.

## Iconography

**Library:** [HugeIcons](https://hugeicons.com) (React / SVG, outlined style).

**Rules:** one set, outlined, currentColor, no mixed weights. Prefer stroke icons that match Signal Gold on dark chrome and Ink on linen. Do not use emoji as UI icons. Do not inline one-off SVGs when a HugeIcon exists. Keep a shared icon map (nav, table actions, empty states, toast) so the same action always uses the same glyph.

## Similar Brands

- **Mercury** — Same near-black primary wall, gold-as-wayfinding discipline, serif numbers on a quiet canvas
- **Linear** — Same one-chromatic-accent restraint, same generous spacing rhythm, same refusal of heavy shadows
- **Notion** — Same serif + grotesque pairing in an operations product (not a marketing site)
- **Navan / Brex** — Same 14px radius language, paper-on-tint elevation, single loud CTA
- **Stripe Dashboard** — Same table-as-primary-surface, status pills, and skeleton-first loading

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors — Staff default */
  --color-midnight-navy: #010345;
  --color-navy-lift: #1a2068;
  --color-navy-deep: #000233;
  --color-navy-soft: #e8e9f2;
  --color-signal-gold: #c4922e;
  --color-bright-gold: #d8a840;
  --color-gold-soft: #fff6e5;
  --gradient-gold-glow: linear-gradient(90deg, rgba(1, 3, 69, 0) 0%, rgba(26, 32, 104, 0.28) 35%, rgba(216, 168, 64, 0.28) 50%, rgba(26, 32, 104, 0.28) 65%, rgba(1, 3, 69, 0) 100%);
  --color-ink: #172133;
  --color-slate: #697486;
  --color-fog: #8d8da5;
  --color-chrome-label: #b8c4d1;
  --color-chrome-mute: #a9b8c9;
  --color-chrome-hover: #ffffff;
  --color-line: #e3e6e2;
  --color-canvas: #f5f6f3;
  --color-surface-lift: #fbfcfa;
  --color-paper: #ffffff;
  --color-jet: #000000;
  --gradient-navy-twilight: radial-gradient(197.36% 161.87% at 4.08% 0%, rgba(1, 3, 69, 0.85) 6.19%, rgba(26, 32, 104, 0.75) 52.28%, rgba(196, 146, 46, 0.45) 91.18%);

  /* Semantic */
  --color-harbor: #4c78a8;
  --color-harbor-soft: #edf4fb;
  --color-harbor-deep: #3a628c;
  --color-mint: #5a9d88;
  --color-mint-soft: #eaf7f2;
  --color-mint-ink: #2f6f5e;
  --color-rose: #b85a72;
  --color-rose-soft: #fcedf1;
  --color-rose-ink: #91455a;
  --color-violet: #7566a8;
  --color-violet-soft: #f2effb;
  --color-amber: #d97706;
  --color-amber-deep: #b45309;
  --color-alert-red: #ff0033;
  --color-alert-red-deep: #d4002a;
  --color-gray-action: #6b7785;
  --color-gray-action-deep: #55606c;
  --color-restore: #f4f4f4;
  --color-restore-deep: #e0e0e0;
  --color-scroll-thumb: #c5ccd7;

  /* Family aliases (applied under .family-mode) */
  --color-forest: #24382f;
  --color-forest-lift: #314c40;
  --color-forest-deep: #1a2a23;
  --color-forest-active: #355247;
  --color-forest-soft: #e9ede4;
  --color-family-canvas: #f6f5ef;

  /* Typography — Font Families */
  --font-arial: Arial, Helvetica, sans-serif;
  --font-georgia: Georgia, "Times New Roman", serif;
  --font-pt-sans: "PT Sans", Helvetica, Arial, sans-serif;

  /* Typography — Scale */
  --text-caption: 11px;
  --leading-caption: 1.3;
  --text-label: 12px;
  --leading-label: 1.25;
  --text-ui: 12px;
  --leading-ui: 1.4;
  --text-body: 14px;
  --leading-body: 1.55;
  --text-title: 16px;
  --leading-title: 1.3;
  --text-heading-sm: 18px;
  --leading-heading-sm: 1.2;
  --tracking-heading-sm: -0.015em;
  --text-heading: 22px;
  --leading-heading: 1.2;
  --tracking-heading: -0.02em;
  --text-heading-lg: 30px;
  --leading-heading-lg: 1.12;
  --tracking-heading-lg: -0.025em;
  --text-display: 27px;
  --leading-display: 1;
  --text-hero: 110px;
  --leading-hero: 0.9;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-56: 56px;
  --spacing-60: 60px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-140: 140px;

  /* Layout */
  --page-max-width: 1200px;
  --sidebar-width: 248px;
  --sidebar-width-collapsed: 72px;
  --section-gap: 80px;
  --card-padding: 20px;
  --element-gap: 16px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-xl: 14px;
  --radius-full: 9999px;
  --radius-cards: 14px;
  --radius-pills: 9999px;
  --radius-badges: 14px;
  --radius-inputs: 14px;
  --radius-buttons: 14px;
  --radius-tables: 14px;

  /* Surfaces */
  --surface-canvas: #f5f6f3;
  --surface-paper: #ffffff;
  --surface-lift: #fbfcfa;
  --surface-brand-soft: #e8e9f2;
  --surface-brand-wall: #010345;
}

.family-mode {
  --color-midnight-navy: var(--color-forest);
  --color-navy-lift: var(--color-forest-lift);
  --color-navy-deep: var(--color-forest-deep);
  --color-navy-soft: var(--color-forest-soft);
  --color-canvas: var(--color-family-canvas);
  --surface-canvas: var(--color-family-canvas);
  --surface-brand-soft: var(--color-forest-soft);
  --surface-brand-wall: var(--color-forest);
}
```

### Tailwind v4

```css
@theme {
  --color-midnight-navy: #010345;
  --color-navy-lift: #1a2068;
  --color-navy-deep: #000233;
  --color-navy-soft: #e8e9f2;
  --color-signal-gold: #c4922e;
  --color-bright-gold: #d8a840;
  --color-gold-soft: #fff6e5;
  --color-ink: #172133;
  --color-slate: #697486;
  --color-chrome-label: #b8c4d1;
  --color-line: #e3e6e2;
  --color-canvas: #f5f6f3;
  --color-surface-lift: #fbfcfa;
  --color-paper: #ffffff;
  --color-harbor: #4c78a8;
  --color-harbor-soft: #edf4fb;
  --color-mint: #5a9d88;
  --color-mint-soft: #eaf7f2;
  --color-rose: #b85a72;
  --color-rose-soft: #fcedf1;
  --color-violet: #7566a8;
  --color-alert-red: #ff0033;
  --color-forest: #24382f;
  --color-forest-lift: #314c40;
  --color-family-canvas: #f6f5ef;

  --font-arial: Arial, Helvetica, sans-serif;
  --font-georgia: Georgia, "Times New Roman", serif;
  --font-pt-sans: "PT Sans", Helvetica, Arial, sans-serif;

  --text-caption: 11px;
  --text-label: 12px;
  --text-ui: 12px;
  --text-body: 14px;
  --text-title: 16px;
  --text-heading-sm: 18px;
  --text-heading: 22px;
  --text-heading-lg: 30px;
  --text-display: 27px;
  --text-hero: 110px;

  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-56: 56px;
  --spacing-60: 60px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-140: 140px;

  --radius-md: 4px;
  --radius-xl: 14px;
  --radius-full: 9999px;
}
```
