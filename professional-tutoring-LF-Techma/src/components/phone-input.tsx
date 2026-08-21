"use client";

import { formatUsPhone } from "@/lib/validation/contact";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  invalid?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  required,
  autoComplete = "tel",
  invalid,
}: PhoneInputProps) {
  return (
    <input
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      value={value}
      required={required}
      placeholder="(703) 555-0123"
      aria-invalid={invalid || undefined}
      className={invalid ? "is-invalid" : undefined}
      onChange={(event) => onChange(formatUsPhone(event.target.value))}
    />
  );
}
