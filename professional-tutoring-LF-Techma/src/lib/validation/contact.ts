const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Allow digits, spaces, and common phone punctuation; require 10+ digits. */
const PHONE_DIGIT_RE = /\d/g;

export function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

export function phoneDigits(value: string) {
  return (value.match(PHONE_DIGIT_RE) ?? []).join("");
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = phoneDigits(trimmed);
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length >= 10 && national.length <= 15;
}

/** US display format, e.g. (703) 555-0123. */
export function formatUsPhone(value: string) {
  let digits = phoneDigits(value);
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizePhone(value: string) {
  return value.trim() || null;
}
