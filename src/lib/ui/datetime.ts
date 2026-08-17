import { APP_TIMEZONE } from "@/lib/constants";

const EN = "en-US";

/** Staff notes / lists — English month names, app timezone (never `août`). */
export function formatStaffDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const day = date.toLocaleDateString(EN, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
      timeZone: APP_TIMEZONE,
    });
    const time = date.toLocaleTimeString(EN, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });
    return `${day} · ${time}`;
  } catch {
    return "—";
  }
}

export function formatStaffDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(EN, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: APP_TIMEZONE,
    });
  } catch {
    return "—";
  }
}

/** 12-hour English clock, e.g. `3:15 PM`. */
export function formatTime12hEnglish(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return value;
  const hour = Number.parseInt(match[1]!, 10);
  const minute = Number.parseInt(match[2]!, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString(EN, { hour: "numeric", minute: "2-digit" });
}
