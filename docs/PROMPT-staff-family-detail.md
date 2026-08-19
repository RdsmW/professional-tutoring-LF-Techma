# Prompt — Redesign Staff Family Detail

Copy everything under **Agent prompt** to a design agent. Attach a screenshot of the current family detail page if one is available. The agent must read `docs/DESIGN-tutoring.md` before drawing or coding.

This pass is one **Families instance detail** (`/staff/families/[id]`) only. Do not redesign the Families directory, New Family, New guardian, Merge queue, Edit family, guardian detail, or student detail.

---

## Agent prompt

Redesign the **Staff Family detail** page of Professional Tutoring using the design system in `docs/DESIGN-tutoring.md`. Visual redesign only.

### Hard rules

1. **Do not change content.** Same words, same sections, same data fields, same actions, same hierarchy. No new copy, no removed copy, no renamed labels, no extra widgets, no extra stats, no extra nav items, no extra columns. Notes are currently hidden — do not add a Notes section.
2. Apply `docs/DESIGN-tutoring.md` fully: colour tokens (Staff navy + gold), Georgia titles / Arial UI, 14px radii, Paper-on-Canvas, HugeIcons outlined, skeleton loading that mirrors this layout, richer table chrome.
3. **No custom modal overlays.** Blocking questions use native `confirm()` / `alert()`. Assign-existing is an on-page panel or full view, not a dialog. **View more** expands the list in place (or stays on this page) — do not open a list modal.
4. This is the **Staff** shell (Midnight Navy wall), not Family forest.
5. **Families** stays the active tab (this is a Families child page). Do not invent or restyle other pages in this pass.
6. **No accent bars anywhere in the app.** Drop the gold inset stripe on sidebar tabs. Active tab = Navy Lift fill well + brighter icon/label only. No left-edge colour marks on cards or rows.

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

### Family detail — keep all of this

Layout order is fixed: back/actions → hero → Household → Guardians → Students → Course enrollments + Bookings (two columns) → Integrations.

**1. Top bar**

- Back link: **← Families**
- Icon actions, right side (HugeIcons; `aria-label` / `title` = the labels below):
  - **Edit** (always) → `/staff/families/{id}/edit`
  - If not archived: **Archive**
  - If archived: **Restore** (instead of Archive)
  - **Delete** only when the household can be deleted (empty household)

Native confirms, keep this copy:

| Action | Title | Body | Confirm button |
|--------|-------|------|----------------|
| Archive | Archive this household? | Archived households are hidden from the default Families list. You can restore them later. | Archive |
| Restore | Restore this household? | This household will appear as active again in the Families list. | Restore |
| Delete | Delete this household? | Permanently delete this empty household? This cannot be undone. | Delete |

**2. Hero**

- Initials avatar from the household display name
- Title: household display name (e.g. `Test - test@test.ca`, `Ross Family`)
- Status pill: **Pending**, **Active**, **Inactive**, **Archived** (title-case of status)

**3. Household**

Section title: **Household**

Fields, exact labels, this structure:

| Label | Value rules |
|-------|-------------|
| **Phone** | phone, or **—** |
| **Responsible for payment** | billing owner name (link to that guardian if they exist), or **—** |
| **Card on file** | `BRAND ···· 1234` when last4 exists, else **Yes** / **No** |
| **Auto-charge** | **Yes** / **No** |
| **Billing Address** | street on one line, then `City, ST ZIP` (max two lines), or **—** |
| **Zoho CRM ID** | id, or **—** |
| **Zoho CRM URL** | clickable URL (opens new tab), or **—** |

**4. Guardians**

- Title: **Guardians**
- Plus menu (`+`) items, exact labels: **Add new**, **Assign existing**
- At max 2 guardians, disable the plus and show: **Max 2 guardians — unassign one to add or assign.**

Empty: **No guardians yet.**

Table columns, this order:

1. **Name**
2. **Parent role**
3. **Email**
4. **Payer**
5. Kebab (`aria-label` **Actions**)

Row rules:

- Name: `First Last`. Under the name, if invite is pending, small text **Invite pending**
- Parent role: pill **Parent 1** or **Parent 2**, or **—** if unset
- Email: address
- Payer: **Yes** / **No**
- Whole row opens that guardian. Kebab does not navigate.
- Preview the first **3** rows. If more than 3, show text link **View more** (expand in place — no modal).

Kebab (`aria-label` **Guardian actions**):

- **Edit**
- **Unassign** — native confirm: `Unassign this guardian from the family? They become an orphan until reassigned (not deleted).`
- If not linked: **Create invite** or **Regenerate invite** (if an invite path already exists)

**5. Students**

- Title: **Students**
- Plus menu items: **Add new**, **Assign existing**

Empty: **No students yet.**

Table columns, this order:

1. **Name**
2. **Subjects**
3. **Grade**
4. **School**
5. **Status**
6. Kebab (`aria-label` **Actions**)

Row rules:

- Name: student display name
- Subjects: preview string (or empty)
- Grade / School: value, or **—**
- Status: pill from lifecycle (e.g. **Prospect**, **Active**, **Archived**)
- Whole row opens that student
- First 3 rows + **View more** when total > 3

Kebab (`aria-label` **Student actions**):

- **Edit**
- **Unassign** — native confirm: `Unassign this student from the family? They become an orphan until reassigned. Historical bookings stay on this family.`
- Then **Archive**, or **Restore** if archived, or **Delete** if the student can be deleted
- Delete confirm: `Permanently delete this student? This cannot be undone.`

**6. Course enrollments** (left of the two-column band)

- Title: **Course enrollments**
- Empty: **No course enrollments yet.**
- Each row: `{studentName} · {courseName}` plus `{Status} · {date}`
- Trailing control: **Open**
- First 3 + **View more** when total > 3

**7. Bookings** (right of the two-column band)

- Title: **Bookings**
- Empty: **No tutoring bookings yet.**
- Each row: `{studentName} · {tutorName}` plus `{Status} · {date}`
- Trailing control: **Open**
- First 3 + **View more** when total > 3

**8. Integrations**

Section title: **Integrations**

Four rows, this order, name + status pill:

| Name | Status |
|------|--------|
| **Zoho CRM** | **Connected** if Zoho id present, else **Not connected** |
| **QuickBooks** | **—** (not supported on family) |
| **Acuity** | **—** (not supported on family) |
| **Stripe** | **Connected** if Stripe customer id present, else **Not connected** |

Do not add extra integrations. Do not turn these into buttons that weren’t there.

**9. Assign existing (on-page, not a modal)**

Keep the same copy:

- Title: **Assign guardian** or **Assign student**
- Close control: **Close**
- Search label: **Search**
- Placeholder: **Name or email…** (guardians) or **Student name…** (students)
- Loading: **Loading…**
- Empty: **No available guardians to assign.** / **No available students to assign.**
- Guardian option line: `First Last` + `{email} · {householdDisplayName}`
- Student option line: display name + `{grade or —} · {householdDisplayName}`
- At max guardians: **Max 2 guardians — unassign one before assigning another.**
- Primary: **Assign** (busy: **Assigning…**)

**10. Loading / error**

- Loading: skeleton that mirrors this page. Accessible text remains **Loading family…**
- Hard error with no record: **Unable to load family.**
- Toasts stay the non-blocking feedback for later failures (unassign, status, invite). Do not invent new toast copy.

### What “redesign” means here

- Visual consistency with the design system (surfaces, type scale, 14px cards/table containers, navy hero/actions, HugeIcons).
- No accent bars: no gold inset on tabs, no left-edge marks on cards or rows.
- Guardians and Students tables must look designed — not a plain HTML grid.
- First paint: skeleton for back bar + hero + household + two tables + activity + integrations, not a lone loading sentence.
- Replace custom confirm/list/assign dialogs with native `confirm` or on-page UI. Keep every string listed above.
- Do not restyle other tabs. Do not change routing or data.

### Done when

A design of **this family detail page only** that a developer can implement without inventing new product copy, and that an agent following `docs/DESIGN-tutoring.md` would accept as on-system.
