/** Deterministic cancellation recommendations. Rules come from the active policy version. */

import {
  DEFAULT_CANCELLATION_POLICY_CODE,
  DEFAULT_CANCELLATION_RULES,
  type CancellationPolicyRules,
} from "@/lib/policy/rules";

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

function defaultOutcomeHeadline(rules: CancellationPolicyRules) {
  if (rules.defaultEligibleOutcome === "refund_review") return "Eligible for refund review";
  if (rules.defaultEligibleOutcome === "reschedule_only") return "Eligible for reschedule only";
  return "Eligible for banked-credit review";
}

export function evaluateChangePolicy(
  reason: ChangeReason,
  rules: CancellationPolicyRules = DEFAULT_CANCELLATION_RULES,
): string {
  if (reason === "Tutor cancelled") {
    return "Eligible for replacement session or refund review";
  }
  if (reason === "Illness" || reason === "School conflict") {
    return defaultOutcomeHeadline(rules);
  }
  return "Staff exception review required";
}

export function policyRecommendationDetail(
  reason: ChangeReason,
  requestedOutcome: RequestedOutcome,
  rules: CancellationPolicyRules = DEFAULT_CANCELLATION_RULES,
  versionCode: string = DEFAULT_CANCELLATION_POLICY_CODE,
): string {
  const headline = evaluateChangePolicy(reason, rules);
  const expiry =
    rules.bankedExpiryMode === "end_of_term" || rules.bankedExpiryDays == null
      ? "Eligible banked credits expire at end of service term"
      : `Eligible banked credits expire after ${rules.bankedExpiryDays} days`;
  return `${headline}. Provisional notice assumption: ≥${rules.noticeHours} hours (session occurrence timing is not modeled yet). Reason: ${reason}. Requested outcome: ${requestedOutcome}. ${expiry}. Partial credit and exceptions require staff review. Policy ${versionCode}.`;
}

export function requiresAlternatives(changeType: ChangeType): boolean {
  return changeType === "Reschedule" || changeType === "Request make-up";
}
