/**
 * Icon keys that prefer `/icons/nav/{name}.png` (3dicons.co assets).
 * After dropping PNGs in `public/icons/nav/`, add each basename (no extension) here.
 * Until then, AppIcon keeps the stroke SVG (avoids 404 spam).
 */
export const NAV_PNG_ICON_NAMES = new Set<string>([
  // "dashboard", "families", "student", "tutor", "calendar", "clock",
  // "billing", "reports", "message", "settings",
  // "home", "plus", "course", "receipt", "profile",
]);

export function navPngSrc(name: string): string {
  return `/icons/nav/${name}.png`;
}

export function prefersNavPng(name: string): boolean {
  return NAV_PNG_ICON_NAMES.has(name);
}
