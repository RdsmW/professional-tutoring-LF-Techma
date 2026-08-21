import assert from "node:assert/strict";
import {
  createDefaultPublicFormContent,
  parsePublicFormContent,
  PROTECTED_FIELD_IDS,
} from "../src/lib/forms/public-form-schema";
import { canManagePublicForm } from "../src/lib/staff/public-forms";

const formId = "academic_year_tutoring";
const baseline = createDefaultPublicFormContent(formId);

const accepted = parsePublicFormContent(formId, baseline);
assert.ok(accepted.content, "The protected Academic Year baseline must be publishable.");

for (const protectedId of ["gender", "referral_source", "alt_payment_method"] as const) {
  assert.ok(PROTECTED_FIELD_IDS.has(protectedId), `${protectedId} must be protected by the schema.`);
  const hiddenProtected = structuredClone(baseline);
  for (const step of hiddenProtected.steps) {
    const field = step.fields.find((candidate) => candidate.id === protectedId);
    if (field) field.visible = false;
  }
  const rejectedHiddenProtected = parsePublicFormContent(formId, hiddenProtected);
  assert.equal(rejectedHiddenProtected.content, null, `${protectedId} must never be hidden.`);
}

const protectedId = "gender";

const removedField = structuredClone(baseline);
for (const step of removedField.steps) {
  const index = step.fields.findIndex((field) => field.id === protectedId);
  if (index >= 0) step.fields.splice(index, 1);
}
const rejectedRemovedField = parsePublicFormContent(formId, removedField);
assert.equal(rejectedRemovedField.content, null, "Supported workflow inputs must never be removed.");

assert.equal(canManagePublicForm("admin", "publish"), true, "Admins must be able to publish.");
assert.equal(canManagePublicForm("scheduler", "edit"), true, "Schedulers must be able to edit drafts.");
assert.equal(canManagePublicForm("scheduler", "publish"), false, "Schedulers must not be able to publish.");
assert.equal(canManagePublicForm("finance", "edit"), false, "Finance staff must be preview-only.");
assert.equal(canManagePublicForm("support", "restore"), false, "Support staff must not restore versions.");

console.log("Public form schema safeguards verified.");