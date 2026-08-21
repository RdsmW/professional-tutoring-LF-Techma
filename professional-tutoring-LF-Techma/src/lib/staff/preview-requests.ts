import { amountLabel } from "@/lib/billing";
import { APP_TIMEZONE } from "@/lib/constants";
import type { StaffChangeRequestDto } from "@/lib/staff/change-request-types";

/** UI-only Priority Queue when the DB has no payment issues (not persisted). */
export const PREVIEW_REQUEST_TOTAL = 12;
export const PRIORITY_QUEUE_RECENT_LIMIT = 3;

export type PreviewQueueRow = {
  id: string;
  name: string;
  studentName: string;
  amountLabel: string;
  dateLabel: string;
  href: string;
};

const PREVIEW_CREATED = "2026-08-14T14:30:00.000Z";

const PREVIEW_AMOUNTS: Record<string, { cents: number; currency: string }> = {
  "preview-req-1": { cents: 18500, currency: "USD" },
  "preview-req-2": { cents: 32000, currency: "USD" },
  "preview-req-3": { cents: 9000, currency: "USD" },
};

export function formatQueueDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

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
  return PREVIEW_CHANGE_REQUESTS.map((row) => {
    const sample = PREVIEW_AMOUNTS[row.id] ?? { cents: 0, currency: "USD" };
    const name = (row.householdName || "").trim() || (row.requesterName ?? "").trim() || "Family";
    return {
      id: row.id,
      name,
      studentName: row.studentName,
      amountLabel: amountLabel(sample.cents, sample.currency),
      dateLabel: formatQueueDate(row.createdAt),
      href: `/staff/requests/${row.id}`,
    };
  });
}
