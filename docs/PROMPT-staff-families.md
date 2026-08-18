# Prompt — Redesign Staff Families

Copy everything under **Agent prompt** to a design agent. Attach a screenshot of the current Families directory if one is available. The agent must read `docs/DESIGN-tutoring.md` before drawing or coding.

This pass is the **Families directory** (`/staff/families`) only — List and Cards. Do not redesign New Family, New guardian, Merge queue, or family detail.

---

## Agent prompt

Redesign the **Staff Families** directory of Professional Tutoring using the design system in `docs/DESIGN-tutoring.md`. Visual redesign only.

### Hard rules

1. **Do not change content.** Same words, same sections, same data fields, same actions, same hierarchy. No new copy, no removed copy, no renamed labels, no extra widgets, no extra stats, no extra nav items, no extra columns.
2. Apply `docs/DESIGN-tutoring.md` fully: colour tokens (Staff navy + gold), Georgia titles / Arial UI, 14px radii, Paper-on-Canvas, HugeIcons outlined, skeleton loading that mirrors this layout, richer table (and card) chrome. No custom modal overlays. Blocking delete stays a native `confirm()`.
3. This is the **Staff** shell (Midnight Navy wall), not Family forest.
4. **Families** is the active tab. Do not invent or restyle other pages in this pass (including New Family, Merge queue, and family detail).
5. **No accent bars anywhere in the app.** Drop the gold inset stripe on sidebar tabs. Active tab = Navy Lift fill well + brighter icon/label only. No left-edge colour marks on cards or rows.

### Sidebar — exact labels, top to bottom

Keep this chrome. Restyle it; do not add, remove, or rename items.

**Brand**

- Logo mark + wordmark **Professional Tutoring, LLC**
- Collapse control (« / »)

**Primary tabs (exact names, this order)**

1. Dashboard
2. Families *(active — fill well only, no inset bar)*
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

### Families directory — keep all of this

Layout order is fixed: page header → filter/view toolbar → results (List table or Cards grid).

**1. Page header**

- Title: **Families** (Georgia heading, no eyebrow, no description)
- Actions, right side, exact labels:
  - **Merge queue** (secondary)
  - **+ New Family** (primary)

Those two actions navigate away. Do not design those destination screens here.

**2. Filter & view toolbar**

Live filters (no separate Filter submit). Exact controls, this order:

| Control | Label | Contents |
|---------|-------|----------|
| Search | **Search name or phone** | Placeholder: **Household name or phone** |
| Status | **Status** | **All (non-archived)** (default), **Pending**, **Active**, **Inactive**, **Archived**, **All statuses** |
| Sort | **Sort** | **Newest first** (default), **Oldest first**, **Name A–Z** |

When any filter differs from defaults, show **Clear**. Hide Clear when filters are at defaults.

View toggle, right side, `aria-label` **Families layout**:

- **List** (default) — title **List view**
- **Cards** — title **Card view**

Use HugeIcons for the list/grid glyphs. Active view is a filled well (Midnight Navy), not an accent bar.

**3. List view — table**

Columns, exact headers, this order:

1. **Name**
2. **Payer**
3. **Students**
4. **Card on file**
5. **Auto-charge**
6. **Status**
7. **Created At**
8. Kebab column (no header text; `aria-label` **Actions**)

Row content rules:

- **Name:** household display name (e.g. `Ross Family`, `Test - test@test.ca`)
- **Payer:** payer name, or **—** if none
- **Students:** count
- **Card on file** / **Auto-charge:** **Yes** or **No**
- **Status:** pill — **Pending**, **Active**, **Inactive**, **Archived**, etc. (title-case of the status)
- **Created At:** formatted datetime (e.g. `Aug 10, 2026, 7:59 AM`)
- Whole row opens family detail. Kebab must not navigate.

Kebab menu (`aria-label` **Row actions**), exact items:

- Always: **Edit**
- If not archived and the household can be deleted: **Delete**
- If not archived and it cannot be deleted: **Archive**
- If archived: **Restore** (instead of Archive/Delete)

**Delete** uses native confirm, exact copy: `Permanently delete this empty household? This cannot be undone.` No custom modal.

The table must look designed (14px container, header wash, row height, hover, pills, HugeIcons kebab) — not a plain HTML grid.

**4. Cards view**

Same records as List. Each card keeps:

- Status pill (top)
- Kebab (`aria-label` **Card actions**) — same Edit / Archive / Restore / Delete rules
- Title: household display name
- Fields: **Payer**, **Students**, **Auto-charge**, **Card on file**
- Footer: **Created At**
- Whole card opens family detail

No extra fields. No “Open” button.

**5. Loading, empty, error**

- Loading: skeleton that mirrors List or Cards (whichever is active). Accessible status text remains **Loading families…**
- Empty: **No households match these filters.**
- Error: **Unable to load families.** (and related errors such as **Unable to update family.** / **Unable to delete family.**). When the error is a staff-profile / database-config failure, keep the **Retry** text button.

### What “redesign” means here

- Visual consistency with the design system (surfaces, type scale, 14px cards/table container, gold unused as a bar, navy primary CTA, HugeIcons in the sidebar and kebab).
- No accent bars: no gold inset on tabs, no left-edge marks on cards or rows.
- List and Cards both get the upgrade — same content, better chrome.
- First paint: skeleton for the header + toolbar + table/cards, not a blank canvas and not a lone loading sentence as the only UI.
- Do not restyle other tabs. Do not change routing or data.

### Done when

A design of **this Families directory only** (List + Cards) that a developer can implement without inventing new product copy, and that an agent following `docs/DESIGN-tutoring.md` would accept as on-system.
