/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f5f6f3",
      "foreground": "#172133",
      "border": "#e3e6e2",
      "card": "#ffffff",
      "cardForeground": "#172133",
      "popover": "#ffffff",
      "popoverForeground": "#172133",
      "primary": "#010345",
      "primaryForeground": "#ffffff",
      "secondary": "#e8e9f2",
      "secondaryForeground": "#010345",
      "muted": "#fbfcfa",
      "mutedForeground": "#697486",
      "accent": "#fff6e5",
      "accentForeground": "#8e661f",
      "destructive": "#ff0033",
      "destructiveForeground": "#ffffff",
      "input": "#e3e6e2",
      "ring": "#c4922e",
      "chart1": "#010345",
      "chart2": "#5a9d88",
      "chart3": "#c4922e",
      "chart4": "#4c78a8",
      "chart5": "#7566a8",
      "sidebar": "#010345",
      "sidebarForeground": "#b8c4d1",
      "sidebarBorder": "#1a2068",
      "sidebarPrimary": "#1a2068",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#1a2068",
      "sidebarAccentForeground": "#ffffff",
      "sidebarRing": "#d8a840"
    },
    "dark": {
      "background": "#0b0d1f",
      "foreground": "#eceef6",
      "border": "#262a4d",
      "card": "#12152e",
      "cardForeground": "#eceef6",
      "popover": "#12152e",
      "popoverForeground": "#eceef6",
      "primary": "#8b93ea",
      "primaryForeground": "#05073a",
      "secondary": "#1c2044",
      "secondaryForeground": "#dfe2f5",
      "muted": "#171a38",
      "mutedForeground": "#9aa2b8",
      "accent": "#332a12",
      "accentForeground": "#e6c26a",
      "destructive": "#e63757",
      "destructiveForeground": "#ffffff",
      "input": "#262a4d",
      "ring": "#d8a840",
      "chart1": "#8b93ea",
      "chart2": "#6fbfa5",
      "chart3": "#d8a840",
      "chart4": "#7ba3cf",
      "chart5": "#9d8fd4",
      "sidebar": "#060830",
      "sidebarForeground": "#b8c4d1",
      "sidebarBorder": "#1a2068",
      "sidebarPrimary": "#1a2068",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#141850",
      "sidebarAccentForeground": "#ffffff",
      "sidebarRing": "#d8a840"
    }
  },
  "fontFamily": {
    "sans": [
      "Arial",
      "Helvetica",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "Times New Roman",
      "serif"
    ],
    "mono": [
      "Menlo",
      "monospace"
    ]
  },
  "radius": "0.875rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
