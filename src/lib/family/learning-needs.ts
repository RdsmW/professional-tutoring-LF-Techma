import { ACADEMIC_SUBJECTS } from "@/lib/forms/options";

/** Split stored learning-needs text into display chips (subjects before optional notes). */
export function learningNeedChips(learningNeeds: string | null | undefined, limit = 6): string[] {
  const { chips } = parseLearningNeeds(learningNeeds);
  return chips.slice(0, limit);
}

export function learningNeedNotes(learningNeeds: string | null | undefined): string | null {
  return parseLearningNeeds(learningNeeds).notes;
}

export function parseLearningNeeds(learningNeeds: string | null | undefined): {
  chips: string[];
  notes: string | null;
} {
  if (!learningNeeds?.trim()) return { chips: [], notes: null };
  if (!learningNeeds.includes("—")) {
    return {
      chips: learningNeeds
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      notes: null,
    };
  }
  const [subjectsPart, ...rest] = learningNeeds.split("—");
  return {
    chips: subjectsPart
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
    notes: rest.join("—").trim() || null,
  };
}

export function composeLearningNeeds(subjectIds: string[], notes: string) {
  const labels = ACADEMIC_SUBJECTS.options
    .filter((option) => subjectIds.includes(option.id))
    .map((option) => option.label);
  const trimmedNotes = notes.trim();
  if (labels.length === 0) return trimmedNotes;
  if (!trimmedNotes) return labels.join(", ");
  return `${labels.join(", ")} — ${trimmedNotes}`;
}

/** Map stored learning-needs text back into catalog subject IDs + leftover notes for edit forms. */
export function learningNeedsToEditState(learningNeeds: string | null | undefined): {
  subjectIds: string[];
  notes: string;
} {
  const { chips, notes } = parseLearningNeeds(learningNeeds);
  const subjectIds: string[] = [];
  const unmatched: string[] = [];
  for (const chip of chips) {
    const match = ACADEMIC_SUBJECTS.options.find(
      (option) => option.label.toLowerCase() === chip.toLowerCase() || option.id === chip,
    );
    if (match) subjectIds.push(match.id);
    else unmatched.push(chip);
  }
  const leftover = [unmatched.join(", "), notes || ""].filter((part) => part.trim()).join(" — ");
  return { subjectIds, notes: leftover };
}
