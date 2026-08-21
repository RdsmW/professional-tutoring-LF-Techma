/** Display helper — `Grade 12`, never a bare `11`. Leaves Kindergarten / College labels as-is. */
export function formatGradeLabel(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const numbered = /^(?:grade\s*)?(\d{1,2})(?:st|nd|rd|th)?$/i.exec(raw);
  if (numbered) return `Grade ${numbered[1]}`;

  if (/^grade\s+/i.test(raw)) {
    return `Grade ${raw.replace(/^grade\s+/i, "").trim()}`;
  }

  if (/^k(?:in(?:dergarten)?)?$/i.test(raw)) return "Kindergarten";

  return raw;
}

export function formatGradeLabelDisplay(value: string | null | undefined): string {
  return formatGradeLabel(value) ?? "—";
}
