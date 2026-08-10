/** Deterministic PT-CAN-2026.3-style recommendations for family change requests. */

export const CHANGE_REASONS = [
  "Illness",
  "School conflict",
  "Emergency",
  "Tutor cancelled",
  "Other",
] as const;

export const CHANGE_TYPES = [
  "Reschedule",
  "Cancel",
  "Update booking details",
  "Request make-up",
] as const;

export const REQUESTED_OUTCOMES = [
  "Schedule change only",
  "Make-up / banked session",
  "Refund review",
] as const;

export type ChangeReason = (typeof CHANGE_REASONS)[number];
export type ChangeType = (typeof CHANGE_TYPES)[number];
export type RequestedOutcome = (typeof REQUESTED_OUTCOMES)[number];

export function isChangeReason(value: string): value is ChangeReason {
  return (CHANGE_REASONS as readonly string[]).includes(value);
}

export function isChangeType(value: string): value is ChangeType {
  return (CHANGE_TYPES as readonly string[]).includes(value);
}

export function isRequestedOutcome(value: string): value is RequestedOutcome {
  return (REQUESTED_OUTCOMES as readonly string[]).includes(value);
}

export function evaluateChangePolicy(reason: ChangeReason): string {
  if (reason === "Tutor cancelled") {
    return "Eligible for replacement session or refund review";
  }
  if (reason === "Illness" || reason === "School conflict") {
    return "Eligible for banked-credit review";
  }
  return "Staff exception review required";
}

export function policyRecommendationDetail(
  reason: ChangeReason,
  requestedOutcome: RequestedOutcome,
): string {
  const headline = evaluateChangePolicy(reason);
  return `${headline}. Provisional notice assumption: ≥24 hours (session occurrence timing is not modeled yet). Reason: ${reason}. Requested outcome: ${requestedOutcome}. Eligible banked credits expire after 90 days. Partial credit and exceptions require staff review.`;
}

export function requiresAlternatives(changeType: ChangeType): boolean {
  return changeType === "Reschedule" || changeType === "Request make-up";
}
