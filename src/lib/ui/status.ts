/** Human-readable status label: underscores → spaces, first letter of each word capital. */
export function formatStatusLabel(status: string | null | undefined) {
  const raw = (status ?? "").trim();
  if (!raw) return "—";
  return raw
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type StatusTone = "mint" | "green" | "amber" | "gold" | "rose" | "blue" | "violet" | "navy" | "quiet" | "";

/** Map domain status strings to pill tone classes. */
export function statusTone(status: string | null | undefined): StatusTone {
  const key = (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!key) return "";

  if (
    [
      "active",
      "confirmed",
      "paid",
      "approved",
      "applied",
      "completed",
      "linked",
      "present",
      "attended",
    ].includes(key)
  ) {
    return "mint";
  }

  if (
    [
      "pending",
      "pending_payment",
      "pending_staff_review",
      "under_review",
      "submitted",
      "held",
      "draft",
      "invite_pending",
      "unlinked",
      "unpaid",
      "partial",
      "queued",
      "inactive",
      "waiting_on_family",
      "late",
      "excused",
    ].includes(key)
  ) {
    return "amber";
  }

  if (
    [
      "cancelled",
      "canceled",
      "failed",
      "declined",
      "archived",
      "absent",
      "no_show",
      "refunded",
    ].includes(key)
  ) {
    return "rose";
  }

  if (["waived", "paid"].includes(key)) {
    return "mint";
  }

  if (["review", "exceptions", "support", "open"].includes(key)) {
    return "blue";
  }

  /* Student lifecycle Prospect/Paused: quieter than navy so they do not compete with titles. */
  if (["prospect", "paused"].includes(key)) {
    return "quiet";
  }

  return "blue";
}
