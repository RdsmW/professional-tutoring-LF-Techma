/** Dashboard + menu passes `from=dashboard` (or `returnTo=/staff`) on create URLs. */
export function isStaffCreateFromDashboard(searchParams: {
  get: (key: string) => string | null;
}): boolean {
  return searchParams.get("from") === "dashboard" || searchParams.get("returnTo") === "/staff";
}

/**
 * Where Cancel should go after leaving a create flow.
 * - From Dashboard + → `/staff`
 * - Opened via `?new=1` / `?newGuardian=1` on a list → that list path
 * - Opened via in-page + button (no query) → `null` (clear create mode only)
 */
export function staffCreateCancelPath(
  searchParams: { get: (key: string) => string | null },
  listPath: string,
): string | null {
  if (isStaffCreateFromDashboard(searchParams)) return "/staff";
  if (searchParams.get("new") === "1" || searchParams.get("newGuardian") === "1") {
    return listPath;
  }
  return null;
}
