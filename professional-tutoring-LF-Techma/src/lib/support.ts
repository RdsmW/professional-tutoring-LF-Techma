export const SUPPORT_TOPICS = [
  "Scheduling",
  "Course enrollment",
  "Billing / receipt",
  "Student profile",
  "Other",
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const SUPPORT_PRIORITIES = ["normal", "time_sensitive"] as const;
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export const SUPPORT_STATUSES = [
  "submitted",
  "under_review",
  "waiting_on_family",
  "resolved",
] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export function isSupportTopic(value: string): value is SupportTopic {
  return (SUPPORT_TOPICS as readonly string[]).includes(value);
}

export function isSupportPriority(value: string): value is SupportPriority {
  return (SUPPORT_PRIORITIES as readonly string[]).includes(value);
}

export function isSupportStatus(value: string): value is SupportStatus {
  return (SUPPORT_STATUSES as readonly string[]).includes(value);
}

export function isOpenSupportStatus(status: string) {
  return status !== "resolved";
}

export function supportDisplayCode(id: string) {
  return `SUP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function supportStatusLabel(status: string) {
  if (status === "submitted") return "Submitted";
  if (status === "under_review") return "Under review";
  if (status === "waiting_on_family") return "Waiting on family";
  if (status === "resolved") return "Resolved";
  return status;
}

export function supportPriorityLabel(priority: string) {
  if (priority === "time_sensitive") return "Time-sensitive (session within 48h)";
  return "Normal";
}
