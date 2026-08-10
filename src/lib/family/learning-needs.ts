/** Split stored learning-needs text into display chips (subjects before optional notes). */
export function learningNeedChips(learningNeeds: string | null | undefined, limit = 6): string[] {
  if (!learningNeeds?.trim()) return [];
  const [subjectsPart] = learningNeeds.split("—");
  return subjectsPart
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function learningNeedNotes(learningNeeds: string | null | undefined): string | null {
  if (!learningNeeds?.includes("—")) return null;
  const notes = learningNeeds.split("—").slice(1).join("—").trim();
  return notes || null;
}
