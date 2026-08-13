# Nav icons (3dicons.co)

1. Download PNGs from [3dicons.co](https://3dicons.co/) (same angle/style for the set).
2. Save them here with these exact names:

- `dashboard.png`, `families.png`, `student.png`, `tutor.png`
- `calendar.png`, `clock.png`, `billing.png`, `reports.png`
- `message.png`, `settings.png`
- Family extras: `home.png`, `plus.png`, `course.png`, `receipt.png`, `profile.png`

3. Register each basename in `src/lib/ui/nav-png-icons.ts` (`NAV_PNG_ICON_NAMES`).

Until a key is registered and the file exists, the sidebar uses the stroke SVG fallback. Optional chrome: `search.png` / `bell.png` with the same registration step.
