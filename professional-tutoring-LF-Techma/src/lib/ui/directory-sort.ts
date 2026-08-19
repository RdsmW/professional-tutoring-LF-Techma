import { APP_TIMEZONE } from "@/lib/constants";

/** Shared staff directory sort values (Families / Guardians / Students / Tutors). */

export const DIRECTORY_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
] as const;

export type DirectorySort = (typeof DIRECTORY_SORT_OPTIONS)[number]["value"];

export const DEFAULT_DIRECTORY_SORT: DirectorySort = "newest";

export function parseDirectorySort(raw: string | null | undefined): DirectorySort {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "oldest" || value === "name_asc" || value === "newest") return value;
  return DEFAULT_DIRECTORY_SORT;
}

/** Directory / dashboard Created At — date + time in app timezone (e.g. Aug 10, 2026, 3:45 PM). */
export function formatDirectoryCreatedAt(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });
  } catch {
    return "—";
  }
}
