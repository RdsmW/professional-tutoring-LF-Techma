/** Truncate subject names for directory / related-student tables (≈2 + “+N”). */
export function formatSubjectsPreview(subjects: Array<{ name: string }> | undefined) {
  if (!subjects || subjects.length === 0) return "—";
  const visible = subjects.slice(0, 2).map((subject) => subject.name);
  const remaining = subjects.length - visible.length;
  if (remaining > 0) return `${visible.join(", ")} +${remaining}`;
  return visible.join(", ");
}
