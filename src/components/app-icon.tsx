"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { navPngSrc, prefersNavPng } from "@/lib/ui/nav-png-icons";

export type IconName =
  | "dashboard"
  | "families"
  | "student"
  | "tutor"
  | "calendar"
  | "clock"
  | "billing"
  | "integrations"
  | "reports"
  | "settings"
  | "home"
  | "plus"
  | "course"
  | "receipt"
  | "message"
  | "profile"
  | "search"
  | "bell";

/** Stroke icons matched to the clickable mockup `Icon` component; PNG when present. */
export function AppIcon({
  name,
  title,
  size = 17,
}: {
  name: string;
  title?: string;
  size?: number;
}) {
  const icon = (name in drawings ? name : "dashboard") as IconName;
  const [pngFailed, setPngFailed] = useState(false);
  const tryPng = prefersNavPng(icon) && !pngFailed;

  if (tryPng) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local public PNG allowlist
      <img
        className="app-icon-img"
        src={navPngSrc(icon)}
        width={size}
        height={size}
        alt=""
        title={title}
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        onError={() => setPngFailed(true)}
      />
    );
  }

  const drawing = drawings[icon];

  return (
    <svg
      className="app-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {drawing}
    </svg>
  );
}

const drawings: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  families: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  student: (
    <>
      <path d="m2 10 10-5 10 5-10 5z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6" />
    </>
  ),
  tutor: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
      <path d="m19 8 .8 1.7 1.9.2-1.4 1.3.4 1.8-1.7-.9-1.7.9.4-1.8-1.4-1.3 1.9-.2z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  billing: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M7 15h3" />
    </>
  ),
  integrations: (
    <>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.23" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13.3 18.77" />
    </>
  ),
  reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  course: (
    <>
      <path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z" />
      <path d="M20 4h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6z" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  message: (
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A7 7 0 0 1 3 13V8a5 5 0 0 1 5-5h9a4 4 0 0 1 4 4z" />
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
};
