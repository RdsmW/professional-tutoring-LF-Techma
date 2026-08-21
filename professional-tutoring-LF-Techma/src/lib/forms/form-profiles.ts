import type { FormId } from "./types";
import { fieldsForForm } from "./field-catalog";

export const FORM_META: Record<
  FormId,
  { title: string; url: string; gravityFormHint: string; journey: "book_tutoring" | "enroll_courses" }
> = {
  academic_year_tutoring: {
    title: "Academic-Year Tutoring",
    url: "https://juliarosspt.com/academic-year-tutoring-registration/",
    gravityFormHint: "GF 16",
    journey: "book_tutoring",
  },
  summer_tutoring: {
    title: "Summer Tutoring",
    url: "https://juliarosspt.com/summer-tutoring-registration/",
    gravityFormHint: "GF 11",
    journey: "book_tutoring",
  },
  first_class: {
    title: "SAT/ACT First Class (9 month)",
    url: "https://juliarosspt.com/sat-act-first-class-9-month/",
    gravityFormHint: "GF 5",
    journey: "enroll_courses",
  },
  express: {
    title: "SAT/ACT The Express (6 month)",
    url: "https://juliarosspt.com/sat-act-the-express-6-month/",
    gravityFormHint: "GF 3",
    journey: "enroll_courses",
  },
  summer_master_class: {
    title: "SAT Master Class Summer",
    url: "https://juliarosspt.com/sat-master-class-summer-2026/",
    gravityFormHint: "GF 35",
    journey: "enroll_courses",
  },
};

/** Field IDs included on each live form (for Book Tutoring / Enroll composition). */
export function formFieldIds(formId: FormId): string[] {
  return fieldsForForm(formId).map((field) => field.id);
}

export function formsForJourney(journey: "book_tutoring" | "enroll_courses"): FormId[] {
  return (Object.keys(FORM_META) as FormId[]).filter((id) => FORM_META[id].journey === journey);
}
