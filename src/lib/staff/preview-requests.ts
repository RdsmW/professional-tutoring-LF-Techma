import type { StaffChangeRequestDto } from "@/lib/staff/change-request-types";

/** UI-only Priority Queue when the DB has no open change requests (not persisted). */
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

export const PREVIEW_CHANGE_REQUESTS: StaffChangeRequestDto[] = [
  {
    id: "preview-req-1",
    status: "submitted",
    changeType: "Cancel",
    reason: "Illness",
    requestedOutcome: "Refund review",
    preferredAlternatives: null,
    policyRecommendation:
      "Eligible for banked-credit review. Provisional notice assumption: ≥24 hours. Reason: Illness. Requested outcome: Refund review.",
    relatedEntityType: "booking",
    relatedEntityId: "preview-session-1",
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
    status: "under_review",
    changeType: "Reschedule",
    reason: "School conflict",
    requestedOutcome: "Schedule change only",
    preferredAlternatives: "Tuesday 4:00 PM or Thursday 5:00 PM",
    policyRecommendation:
      "Eligible for reschedule only. Provisional notice assumption: ≥24 hours. Reason: School conflict. Requested outcome: Schedule change only.",
    relatedEntityType: "booking",
    relatedEntityId: "preview-session-2",
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
    changeType: "Update booking details",
    reason: "Other",
    requestedOutcome: "Make-up / banked session",
    preferredAlternatives: "Prefer a different tutor if available",
    policyRecommendation:
      "Staff exception review required. Reason: Other. Requested outcome: Make-up / banked session.",
    relatedEntityType: "booking",
    relatedEntityId: "preview-session-3",
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

function queueTone(status: string) {
  if (status === "under_review") return "blue";
  return "rose";
}

export function isPreviewChangeRequestId(id: string) {
  return id.startsWith("preview-req-");
}

export function getPreviewChangeRequest(id: string): StaffChangeRequestDto | null {
  return PREVIEW_CHANGE_REQUESTS.find((row) => row.id === id) ?? null;
}

export function previewQueueRows(): PreviewQueueRow[] {
  return PREVIEW_CHANGE_REQUESTS.map((row) => ({
    id: row.id,
    initials: initialsFromName(row.studentName),
    title: `${row.changeType} · ${row.studentName}`,
    copy: `${row.householdName} · ${row.requestedOutcome}`,
    meta: row.status === "under_review" ? "Under review" : "Submitted",
    tone: queueTone(row.status),
    href: `/staff/requests/${row.id}`,
  }));
}
