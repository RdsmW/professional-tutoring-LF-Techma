const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Allow digits, spaces, and common phone punctuation; require 10+ digits. */
const PHONE_DIGIT_RE = /\d/g;

export function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = trimmed.match(PHONE_DIGIT_RE)?.length ?? 0;
  return digits >= 10 && digits <= 15;
}

export function normalizePhone(value: string) {
  return value.trim() || null;
}
