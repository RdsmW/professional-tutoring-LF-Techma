import type { FormId, OptionListId } from "@/lib/forms/types";
import {
  EXPRESS_PAYMENT_PLANS,
  FIRST_CLASS_PAYMENT_PLANS,
  FIRST_CLASS_TIME_SLOTS,
  MASTER_CLASS_PAYMENT_PLANS,
  MASTER_CLASS_SESSIONS,
} from "@/lib/forms/options";

export type EnrollFormId = Extract<FormId, "first_class" | "express" | "summer_master_class">;

const CODE_TO_FORM: Record<string, EnrollFormId> = {
  "FIRST-CLASS-2026": "first_class",
  "EXPRESS-2026": "express",
  "SUMMER-MASTER-2026": "summer_master_class",
};

const FORM_TO_CODE: Record<EnrollFormId, string> = {
  first_class: "FIRST-CLASS-2026",
  express: "EXPRESS-2026",
  summer_master_class: "SUMMER-MASTER-2026",
};

export function formIdForCourseCode(code: string): EnrollFormId | null {
  return CODE_TO_FORM[code] ?? null;
}

export function courseCodeForFormId(formId: EnrollFormId): string {
  return FORM_TO_CODE[formId];
}

export function isEnrollFormId(value: string): value is EnrollFormId {
  return value === "first_class" || value === "express" || value === "summer_master_class";
}

export function paymentPlanListId(formId: EnrollFormId): OptionListId {
  if (formId === "first_class") return "FIRST_CLASS_PAYMENT_PLANS";
  if (formId === "express") return "EXPRESS_PAYMENT_PLANS";
  return "MASTER_CLASS_PAYMENT_PLANS";
}

export function slotPreferenceListId(formId: EnrollFormId): OptionListId | null {
  if (formId === "first_class") return "FIRST_CLASS_TIME_SLOTS";
  if (formId === "summer_master_class") return "MASTER_CLASS_SESSIONS";
  return null;
}

export function paymentPlansForForm(formId: EnrollFormId) {
  if (formId === "first_class") return FIRST_CLASS_PAYMENT_PLANS.options;
  if (formId === "express") return EXPRESS_PAYMENT_PLANS.options;
  return MASTER_CLASS_PAYMENT_PLANS.options;
}

export function slotOptionsForForm(formId: EnrollFormId) {
  if (formId === "first_class") return FIRST_CLASS_TIME_SLOTS.options;
  if (formId === "summer_master_class") return MASTER_CLASS_SESSIONS.options;
  return [];
}
