import type { StaffChangeRequestDto } from "@/lib/staff/change-request-types";

/** UI-only Priority Queue when the DB has no payment issues (not persisted). */
export const PREVIEW_REQUEST_TOTAL = 12;
export const PRIORITY_QUEUE_RECENT_LIMIT = 3;

export type PreviewQueueRow = {
  id: string;
  initials: string;
  title: string;
  copy: string;
  meta: string;
  tone: string;
  href: string;
};

const PREVIEW_CREATED = "2026-08-14T14:30:00.000Z";

/** Payment-issue samples — schedule/booking changes are automatic and not staff-approval work. */
export const PREVIEW_CHANGE_REQUESTS: StaffChangeRequestDto[] = [
  {
    id: "preview-req-1",
    status: "submitted",
    changeType: "Payment failed",
    reason: "Card declined",
    requestedOutcome: "Retry charge",
    preferredAlternatives: null,
    policyRecommendation:
      "Card on file was declined. Staff can retry from Billing or ask the family to update the card. This is not a schedule-change approval.",
    relatedEntityType: "payment",
    relatedEntityId: "preview-payment-1",
    staffNotes: null,
    studentId: "",
    studentName: "Emerson Chen",
    householdId: "",
    householdName: "Chen Family",
    requesterName: "Alex Chen",
    createdAt: PREVIEW_CREATED,
    resolvedAt: null,
  },
  {
    id: "preview-req-2",
    status: "submitted",
    changeType: "Unpaid balance",
    reason: "Invoice overdue",
    requestedOutcome: "Collect payment",
    preferredAlternatives: null,
    policyRecommendation:
      "Open balance on the household ledger. Open Billing to record a payment or follow up with the payer.",
    relatedEntityType: "payment",
    relatedEntityId: "preview-payment-2",
    staffNotes: null,
    studentId: "",
    studentName: "Maya Ruiz",
    householdId: "",
    householdName: "Ruiz Family",
    requesterName: "Sofia Ruiz",
    createdAt: "2026-08-13T18:10:00.000Z",
    resolvedAt: null,
  },
  {
    id: "preview-req-3",
    status: "submitted",
    changeType: "Partial payment",
    reason: "Short payment",
    requestedOutcome: "Balance due",
    preferredAlternatives: null,
    policyRecommendation:
      "A partial payment posted. Remaining balance still needs attention on Billing — not a booking or time-change review.",
    relatedEntityType: "payment",
    relatedEntityId: "preview-payment-3",
    staffNotes: null,
    studentId: "",
    studentName: "Jordan Lee",
    householdId: "",
    householdName: "Lee Family",
    requesterName: "Pat Lee",
    createdAt: "2026-08-12T11:05:00.000Z",
    resolvedAt: null,
  },
];

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function queueTone(changeType: string) {
  const value = changeType.toLowerCase();
  if (value.includes("failed") || value.includes("declined")) return "rose";
  if (value.includes("partial") || value.includes("unpaid")) return "gold";
  return "blue";
}

export function isPreviewChangeRequestId(id: string) {
  return id.startsWith("preview-req-");
}

export function getPreviewChangeRequest(id: string): StaffChangeRequestDto | null {
  return PREVIEW_CHANGE_REQUESTS.find((row) => row.id === id) ?? null;
}

export function isPaymentIssueRequest(request: {
  changeType: string;
  requestedOutcome?: string | null;
  relatedEntityType?: string | null;
}) {
  const blob = `${request.changeType} ${request.requestedOutcome ?? ""} ${request.relatedEntityType ?? ""}`.toLowerCase();
  return /payment|unpaid|invoice|card declined|balance|partial|failed|charge/.test(blob);
}

export function previewQueueRows(): PreviewQueueRow[] {
  return PREVIEW_CHANGE_REQUESTS.map((row) => ({
    id: row.id,
    initials: initialsFromName(row.studentName),
    title: `${row.changeType} · ${row.householdName}`,
    copy: `${row.studentName} · ${row.reason}`,
    meta: "Needs attention",
    tone: queueTone(row.changeType),
    href: `/staff/requests/${row.id}`,
  }));
}
