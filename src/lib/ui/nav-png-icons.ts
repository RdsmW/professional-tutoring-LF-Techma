/**
 * Icon keys that prefer `/icons/nav/{name}.png` (3dicons.co clay/front assets).
 */
export const NAV_PNG_ICON_NAMES = new Set<string>([
  "dashboard",
  "home",
  "families",
  "student",
  "tutor",
  "calendar",
  "clock",
  "billing",
  "reports",
  "message",
  "settings",
  "plus",
  "course",
  "receipt",
  "profile",
  "search",
  "bell",
]);

export function navPngSrc(name: string): string {
  return `/icons/nav/${name}.png`;
}

export function prefersNavPng(name: string): boolean {
  return NAV_PNG_ICON_NAMES.has(name);
}
