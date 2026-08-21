import { fieldsForForm } from "@/lib/forms/field-catalog";
import { FORM_META } from "@/lib/forms/form-profiles";
import { getOptionList } from "@/lib/forms/options";
import type { FieldDef, FormId } from "@/lib/forms/types";

export type PublicFormField = {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  visible: boolean;
  order: number;
  optionLabels?: Record<string, string>;
};

export type PublicFormStepKey =
  | "welcome"
  | "student"
  | "contacts"
  | "needs"
  | "schedule"
  | "payment"
  | "agreement"
  | "review";

export type PublicFormStep = {
  key: PublicFormStepKey;
  name: string;
  helpText: string;
  order: number;
  fields: PublicFormField[];
};

export type PublicFormContent = {
  schemaVersion: 1;
  title: string;
  description: string;
  introduction: string;
  helpText: string;
  steps: PublicFormStep[];
};

export type FormValidationIssue = { path: string; message: string };

const STEP_META: Array<Pick<PublicFormStep, "key" | "name" | "helpText">> = [
  { key: "welcome", name: "Welcome", helpText: "Review the registration process before you begin." },
  { key: "student", name: "Student", helpText: "Tell us about the student who needs tutoring." },
  { key: "contacts", name: "Parents & billing information", helpText: "Add parent and billing information." },
  { key: "needs", name: "Tutoring needs", helpText: "Tell us what support is needed." },
  { key: "schedule", name: "Schedule", helpText: "Choose a preferred schedule path." },
  { key: "payment", name: "Plan", helpText: "Choose a plan before the secure card step." },
  { key: "agreement", name: "Agreement", helpText: "Review and acknowledge the agreement." },
  { key: "review", name: "Review", helpText: "Review your details before submitting." },
];

const STEP_BY_FIELD: Partial<Record<string, PublicFormStepKey>> = {
  student_name: "student",
  gender: "student",
  school: "student",
  grade: "student",
  graduation_year: "student",
  birthdate: "student",
  student_cell: "student",
  student_email: "student",
  other_support_info: "student",
  household_address: "contacts",
  household_state: "contacts",
  parent1_contact: "contacts",
  parent2_contact: "contacts",
  billing_contact: "contacts",
  subjects: "needs",
  subject_notes: "needs",
  test_prep_interests: "needs",
  referral_source: "needs",
  academic_schedule_windows: "schedule",
  summer_schedule_windows: "schedule",
  summer_date_range: "schedule",
  schedule_notes: "schedule",
  academic_rate_package: "payment",
  academic_advanced_rate_package: "payment",
  academic_payment_plan: "payment",
  summer_payment_plan: "payment",
  first_class_payment_plan: "payment",
  express_payment_plan: "payment",
  master_class_payment_plan: "payment",
  auto_charge: "payment",
  alt_payment_method: "payment",
  policy_ack: "agreement",
  consent_agreement: "agreement",
};

/**
 * Inputs that participate in matching, consent, pricing, availability, or
 * enrollment handlers must always remain present and required.
 */
export const PROTECTED_FIELD_IDS = new Set([
  "student_name",
  "gender",
  "school",
  "grade",
  "graduation_year",
  "birthdate",
  "student_cell",
  "household_address",
  "household_state",
  "parent1_contact",
  "billing_contact",
  "referral_source",
  "subjects",
  "academic_schedule_windows",
  "summer_schedule_windows",
  "academic_rate_package",
  "academic_advanced_rate_package",
  "academic_payment_plan",
  "summer_payment_plan",
  "first_class_time_slot",
  "first_class_payment_plan",
  "express_payment_plan",
  "master_class_sessions",
  "master_class_payment_plan",
  "auto_charge",
  // Required only when automatic charging is declined; it must still be
  // available because the server-side condition cannot be weakened.
  "alt_payment_method",
  "policy_ack",
  "consent_agreement",
]);

/**
 * The Academic Year renderer deliberately exposes only these field-level
 * presentation controls. Compound inputs and workflow inputs stay preserved
 * and server-owned until they have an explicit field-id renderer binding.
 */
export const PUBLIC_RENDERER_EDITABLE_FIELD_IDS = new Set([
  "school",
  "grade",
  "graduation_year",
  "gender",
  "birthdate",
  "student_email",
  "referral_source",
  "academic_rate_package",
  "academic_advanced_rate_package",
  "academic_payment_plan",
  "auto_charge",
  "alt_payment_method",
  "consent_agreement",
]);

const MAX_TEXT = 800;

function fieldForCatalog(field: FieldDef, order: number): PublicFormField {
  const optionLabels = field.optionListId
    ? Object.fromEntries(getOptionList(field.optionListId).options.map((option) => [option.id, option.label]))
    : undefined;
  return {
    id: field.id,
    label: field.label,
    placeholder: "",
    required: field.required === true,
    visible: true,
    order,
    ...(optionLabels ? { optionLabels } : {}),
  };
}

export function createDefaultPublicFormContent(formId: FormId): PublicFormContent {
  const formFields = fieldsForForm(formId);
  return {
    schemaVersion: 1,
    title: FORM_META[formId].title,
    description: `${FORM_META[formId].title} registration.`,
    introduction:
      formId === "academic_year_tutoring"
        ? "Register for Academic Year Tutoring. We’ll save your information and invite you to the family portal."
        : `Register for ${FORM_META[formId].title}.`,
    helpText: "Required information is validated securely when you submit. Payment, availability, and enrollment rules are protected.",
    steps: STEP_META.map((step, stepIndex) => ({
      ...step,
      order: stepIndex,
      fields: formFields
        .filter((field) => (STEP_BY_FIELD[field.id] ?? "needs") === step.key)
        .map((field, fieldIndex) => fieldForCatalog(field, fieldIndex)),
    })),
  };
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function validText(value: string, path: string, issues: FormValidationIssue[], required = true) {
  if (required && !value) issues.push({ path, message: "This value is required." });
  if (value.length > MAX_TEXT) issues.push({ path, message: `Keep this under ${MAX_TEXT} characters.` });
}

/**
 * Converts unknown JSON into the declared safe schema. There are no arbitrary
 * components, expressions, URLs, handlers, or field types in this format.
 */
export function parsePublicFormContent(formId: FormId, value: unknown): {
  content: PublicFormContent | null;
  issues: FormValidationIssue[];
} {
  const issues: FormValidationIssue[] = [];
  const raw = record(value);
  if (!raw) return { content: null, issues: [{ path: "form", message: "Form content must be an object." }] };

  const defaults = createDefaultPublicFormContent(formId);
  const title = asText(raw.title);
  const description = asText(raw.description);
  const introduction = asText(raw.introduction);
  const helpText = asText(raw.helpText);
  validText(title, "title", issues);
  validText(description, "description", issues);
  validText(introduction, "introduction", issues);
  validText(helpText, "helpText", issues, false);

  if (!Array.isArray(raw.steps) || raw.steps.length !== defaults.steps.length) {
    return { content: null, issues: [...issues, { path: "steps", message: "All supported steps must remain in the form." }] };
  }

  const supportedFields = new Map(fieldsForForm(formId).map((field) => [field.id, field]));
  const seenSteps = new Set<string>();
  const seenFields = new Set<string>();
  const steps: PublicFormStep[] = [];

  for (const [index, rawStep] of raw.steps.entries()) {
    const stepValue = record(rawStep);
    if (!stepValue) {
      issues.push({ path: `steps.${index}`, message: "Step must be an object." });
      continue;
    }
    const key = asText(stepValue.key) as PublicFormStepKey;
    if (!defaults.steps.some((step) => step.key === key) || seenSteps.has(key)) {
      issues.push({ path: `steps.${index}.key`, message: "Step is not supported." });
      continue;
    }
    seenSteps.add(key);
    const name = asText(stepValue.name);
    const stepHelp = asText(stepValue.helpText);
    validText(name, `steps.${index}.name`, issues);
    validText(stepHelp, `steps.${index}.helpText`, issues, false);
    const rawFields = Array.isArray(stepValue.fields) ? stepValue.fields : [];
    const fields: PublicFormField[] = [];

    for (const [fieldIndex, rawField] of rawFields.entries()) {
      const fieldValue = record(rawField);
      const id = asText(fieldValue?.id);
      const catalogField = supportedFields.get(id);
      if (!fieldValue || !catalogField || seenFields.has(id)) {
        issues.push({ path: `steps.${index}.fields.${fieldIndex}`, message: "Field is not supported." });
        continue;
      }
      seenFields.add(id);
      if ((STEP_BY_FIELD[id] ?? "needs") !== key) {
        issues.push({ path: `steps.${index}.fields.${fieldIndex}`, message: "This field cannot move to another step." });
      }
      const label = asText(fieldValue.label);
      const placeholder = asText(fieldValue.placeholder);
      const visible = fieldValue.visible !== false;
      const required = fieldValue.required === true;
      validText(label, `steps.${index}.fields.${fieldIndex}.label`, issues);
      validText(placeholder, `steps.${index}.fields.${fieldIndex}.placeholder`, issues, false);
      if (PROTECTED_FIELD_IDS.has(id) && !visible) {
        issues.push({
          path: `steps.${index}.fields.${fieldIndex}`,
          message: "This protected input must remain visible.",
        });
      }
      if (catalogField.required === true && !required) {
        issues.push({ path: `steps.${index}.fields.${fieldIndex}.required`, message: "This input is required by its workflow." });
      }

      let optionLabels: Record<string, string> | undefined;
      if (catalogField.optionListId) {
        const expected = getOptionList(catalogField.optionListId).options;
        const incoming = record(fieldValue.optionLabels) ?? {};
        optionLabels = {};
        for (const option of expected) {
          const labelValue = asText(incoming[option.id], option.label);
          validText(labelValue, `steps.${index}.fields.${fieldIndex}.optionLabels.${option.id}`, issues);
          if (PROTECTED_FIELD_IDS.has(id) && labelValue !== option.label) {
            issues.push({
              path: `steps.${index}.fields.${fieldIndex}.optionLabels.${option.id}`,
              message: "Options for protected workflow inputs cannot be changed.",
            });
          }
          optionLabels[option.id] = labelValue;
        }
      }
      fields.push({ id, label, placeholder, visible, required, order: fieldIndex, ...(optionLabels ? { optionLabels } : {}) });
    }
    steps.push({ key, name, helpText: stepHelp, order: index, fields });
  }

  for (const field of supportedFields.values()) {
    if (!seenFields.has(field.id)) {
      issues.push({ path: "steps", message: `${field.label} cannot be removed from this form.` });
    }
  }
  for (const step of defaults.steps) {
    if (!seenSteps.has(step.key)) issues.push({ path: "steps", message: `${step.name} must remain in the form.` });
  }
  if (issues.length) return { content: null, issues };
  return { content: { schemaVersion: 1, title, description, introduction, helpText, steps }, issues: [] };
}

export function isPublicFormContent(formId: FormId, value: unknown): value is PublicFormContent {
  return parsePublicFormContent(formId, value).content !== null;
}