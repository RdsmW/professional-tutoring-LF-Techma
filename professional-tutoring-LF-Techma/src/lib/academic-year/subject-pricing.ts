import { ACADEMIC_SUBJECTS } from "@/lib/forms/options";

export type AcademicSubjectRateProfile = "standard" | "advanced" | "mixed" | "staff_review";

const ADVANCED_SUBJECT_CODES = new Set([
  "calculus_ab",
  "calculus_bc",
  "multivariable_calculus",
  "linear_algebra",
  "undergrad_level_history",
  "graduate_level_history",
]);

export function isAdvancedAcademicSubject(subjectCode: string) {
  const option = ACADEMIC_SUBJECTS.options.find((candidate) => candidate.id === subjectCode);
  if (!option) return false;
  return (
    ADVANCED_SUBJECT_CODES.has(option.id) ||
    /\bAP\b|AP\/IB|\bIB\b/i.test(option.label)
  );
}

export function academicSubjectRateProfile(subjectCodes: string[]): AcademicSubjectRateProfile {
  const selected = [...new Set(subjectCodes)];
  if (!selected.length || selected.includes("other")) return "staff_review";

  const advanced = selected.filter(isAdvancedAcademicSubject);
  if (advanced.length === selected.length) return "advanced";
  if (advanced.length === 0) return "standard";
  return "mixed";
}

export function requiresAcademicYearStaffReview(subjectCodes: string[]) {
  return subjectCodes.length !== 1 || subjectCodes.includes("other");
}

export function academicSubjectLabel(subjectCode: string) {
  return ACADEMIC_SUBJECTS.options.find((option) => option.id === subjectCode)?.label ?? subjectCode;
}