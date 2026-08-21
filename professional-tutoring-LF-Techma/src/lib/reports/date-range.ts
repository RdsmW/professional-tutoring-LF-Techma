import { APP_TIMEZONE, CURRENT_TERM } from "@/lib/constants";
import type { DateFilter } from "@/lib/reports/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type YmdRange = {
  startYmd: string | null;
  endYmd: string | null;
  label: string;
};

export function formatYmdInZone(date: Date, timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

function weekdayIndexInZone(date: Date, timeZone = APP_TIMEZONE): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const index = WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);
  return index >= 0 ? index : 0;
}

export function resolveDateRange(filter: DateFilter, now = new Date()): YmdRange {
  if (filter === "all") {
    return { startYmd: null, endYmd: null, label: "All dates" };
  }

  const today = formatYmdInZone(now);

  if (filter === "week") {
    const startYmd = addDaysYmd(today, -weekdayIndexInZone(now));
    return { startYmd, endYmd: addDaysYmd(startYmd, 6), label: "This week" };
  }

  if (filter === "month") {
    const startYmd = `${today.slice(0, 7)}-01`;
    const nextMonth = addDaysYmd(startYmd, 32).slice(0, 7);
    return {
      startYmd,
      endYmd: addDaysYmd(`${nextMonth}-01`, -1),
      label: "This month",
    };
  }

  return {
    startYmd: CURRENT_TERM.startYmd,
    endYmd: CURRENT_TERM.endYmd,
    label: "Current term",
  };
}

export function isYmdInRange(ymd: string | null | undefined, range: YmdRange): boolean {
  if (!range.startYmd || !range.endYmd) return true;
  if (!ymd) return false;
  return ymd >= range.startYmd && ymd <= range.endYmd;
}

export function isInstantInRange(date: Date | null | undefined, range: YmdRange): boolean {
  if (!range.startYmd || !range.endYmd) return true;
  if (!date) return false;
  return isYmdInRange(formatYmdInZone(date), range);
}

export function periodLabelForInstant(date: Date | null | undefined, range: YmdRange): string {
  if (!date) return range.label;
  return formatYmdInZone(date);
}
