export function parseMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function slotHours(start: string | null | undefined, end: string | null | undefined): number {
  const from = parseMinutes(start);
  const to = parseMinutes(end);
  if (from == null || to == null || to <= from) return 0;
  return (to - from) / 60;
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded}h`;
}
