# Prompt — Redesign Staff Dashboard

Copy everything under **Agent prompt** to a design agent. Attach a screenshot of the current Dashboard if one is available. The agent must read `docs/DESIGN-tutoring.md` before drawing or coding.

---

## Agent prompt

Redesign the **Staff Dashboard** of Professional Tutoring using the design system in `docs/DESIGN-tutoring.md`. Visual redesign only.

### Hard rules

1. **Do not change content.** Same words, same sections, same data fields, same actions, same hierarchy. No new copy, no removed copy, no renamed labels, no extra widgets, no extra stats, no extra nav items.
2. Apply `docs/DESIGN-tutoring.md` fully: colour tokens (Staff navy + gold), Georgia titles / Arial UI, 14px radii, Paper-on-Canvas, HugeIcons outlined, skeleton loading that mirrors this layout, richer table chrome. No custom modals (this page has none — do not add any).
3. This is the **Staff** shell (Midnight Navy wall), not Family forest.
4. Dashboard is the active tab. Do not invent other pages in this pass.
5. **No accent bars anywhere in the app.** Drop the gold inset stripe on sidebar tabs. Active tab = Navy Lift fill well + brighter icon/label only. Also drop left-edge colour marks on metric cards and any other decorative edge stripe. Capacity occupancy meters (the week fill tracks) stay — those are data, not accent bars.

### Sidebar — exact labels, top to bottom

Keep this chrome. Restyle it; do not add, remove, or rename items.

**Brand**

- Logo mark + wordmark **Professional Tutoring, LLC**
- Collapse control (« / »)

**Primary tabs (exact names, this order)**

1. Dashboard *(active — fill well only, no inset bar)*
2. Families
3. Guardians
4. Students
5. Tutors
6. Scheduling
7. Sessions
8. Billing
9. Reports
10. Settings

**Footer chrome (not tabs — keep both labels)**

- Search
- Alerts
- Signed-in user name + role label **Staff**

### Dashboard content — keep all of this

Layout order is fixed: hero → four metrics → two-column row → students table.

**1. Hero band**

- Eyebrow: current date in America/New_York, e.g. `Tuesday, August 18`
- Title: `{Good morning | Good afternoon | Good evening}, {firstName}.`
- Actions, right side, exact labels:
  - **New family** (primary)
  - **New tutor** (secondary)

**2. Metric strip — four cards, this order, these titles and captions**

| Title | Number | Caption (live) | Caption (not live yet) |
|-------|--------|----------------|------------------------|
| Families still setting up | count | Pending or no parent login | *(same caption in current UI)* |
| Sessions this week | count | Scheduled or happening this week | Live when sessions exist |
| Open tutor seats | count | Seats still free on active times | Live when availability exists |
| Payments needing attention | count | Unpaid, pending, failed, or partial | Live when payment rows exist |

Do not retitle the cards. Do not keep the left-edge colour marks — no accent bars on these cards.

**3. Left column — Priority queue**

- Eyebrow: **Priority queue**
- Heading: **Family requests**
- Chip: **Requests** + the request count
- Text link: **Open sessions**
- When showing sample data, keep the note: **Sample preview — not live requests.**
- Each row: initials avatar, **title**, supporting **copy**, status/meta pill (e.g. Preview). Example titles/copy (preview set — keep this structure even when live data replaces it):
  - `Cancel session · Emerson Chen` — `Chen Family · Cancel upcoming booking`
  - `Reschedule · Maya Ruiz` — `Ruiz Family · Move to another day`
  - `Tutor change · Jordan Lee` — `Lee Family · Request different tutor`

**4. Right column — Capacity**

- Eyebrow: **Capacity**
- Heading: **This week**
- Text link: **Open schedule**
- One row per weekday **Sunday–Thursday** (not Fri/Sat): day label with date (`Sunday · Aug 16`), horizontal bar, ratio (`0/2`)
- When bars are empty/not live, keep: **Bars fill when availability slots exist in the database.**

**5. Students — Recently added**

- Eyebrow: **Students**
- Heading: **Recently added**
- Text link: **Open students**
- Empty copy, if no rows: **No students yet. Add a student to get started.**
- Table columns, exact headers, this order: **Name**, **Household**, **Subjects**, **Grade**, **School**, **Status**, **Created At**
- Status stays a pill (e.g. Prospect). Rows remain clickable through to the student. No kebab/actions column on Dashboard.

### What “redesign” means here

- Visual consistency with the design system (surfaces, type scale, 14px cards/table container, gold eyebrows, navy primary CTA, HugeIcons in the sidebar).
- No accent bars: no gold inset on tabs, no left-edge marks on KPI cards or rows.
- The students table must look designed (header wash, row height, hover, pills) — not a plain HTML grid.
- First paint: skeleton that matches this page (hero + 4 KPIs + queue/capacity + table), not a blank canvas.
- Do not restyle other tabs. Do not change routing or data.

### Done when

A design of **this Dashboard only** that a developer can implement without inventing new product copy, and that an agent following `docs/DESIGN-tutoring.md` would accept as on-system.
