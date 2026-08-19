export type CancellationPolicyRules = {
  noticeHours: number;
  defaultEligibleOutcome: "banked_credit" | "refund_review" | "reschedule_only";
  bankedExpiryDays: number | null;
  bankedExpiryMode: "days" | "end_of_term";
  noShowTreatment: string;
  tutorCancelTreatment: string;
  partialCreditRule: string;
  eligibleReasons: string[];
};

export const DEFAULT_CANCELLATION_POLICY_CODE = "PT-CAN-2026.3";

export const DEFAULT_CANCELLATION_RULES: CancellationPolicyRules = {
  noticeHours: 24,
  defaultEligibleOutcome: "banked_credit",
  bankedExpiryDays: 90,
  bankedExpiryMode: "days",
  noShowTreatment: "No credit by default · Staff exception allowed",
  tutorCancelTreatment: "Banked replacement or refund review",
  partialCreditRule: "Prorate only with authorized exception",
  eligibleReasons: ["Illness", "School conflict", "Emergency", "Tutor cancelled"],
};
