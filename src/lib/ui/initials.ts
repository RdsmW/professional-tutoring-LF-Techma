/** Initials from a display name — first letters of the first two words, uppercased. */
export function initialsOf(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
