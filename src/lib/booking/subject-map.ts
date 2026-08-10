import { ACADEMIC_SUBJECTS } from "@/lib/forms/options";

/** Map Gravity/catalog subject option ids onto seeded DB subject codes. */
export function catalogSubjectToDbCode(subjectIdOrLabel: string): string {
  const value = subjectIdOrLabel.toLowerCase();
  if (/(^|_)(sat|psat)(_|$)/.test(value) || value.includes("sat") || value.includes("psat")) return "sat";
  if (/(^|_)act(_|$)/.test(value) || value.includes("act")) return "act";
  if (
    /math|algebra|geometry|calculus|statistics|pre_calculus|linear_algebra/.test(value)
  ) {
    return "math";
  }
  if (
    /english|writing|spanish|french|italian|arabic|latin|history|social|economics|civics/.test(
      value,
    )
  ) {
    return "english";
  }
  if (
    /science|biology|chemistry|physics|anatomy|astronomy|ocean|geo|environment/.test(value)
  ) {
    return "science";
  }

  const fromCatalog = ACADEMIC_SUBJECTS.options.find(
    (option) => option.id === subjectIdOrLabel || option.label === subjectIdOrLabel,
  );
  if (fromCatalog) return catalogSubjectToDbCode(fromCatalog.id);

  return "math";
}
