import { collectDueAcademicYearInstallments } from "@/lib/stripe/collect-due-ay-installments";

export type DuePaymentCollectionInput = {
  now?: Date;
  limit?: number;
};

/**
 * Stable scheduler entrypoint for all eligible due payment records.
 *
 * Academic Year is the only scheduled collection source today. Keeping the
 * dispatcher neutral lets future public forms join the same runtime without
 * coupling the scheduler to a form-specific collector.
 */
export function collectDuePayments(input?: DuePaymentCollectionInput) {
  return collectDueAcademicYearInstallments(input);
}