"use client";

import { formatUsPhone } from "@/lib/validation/contact";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
};

export function PhoneInput({
  value,
  onChange,
  required,
  autoComplete = "tel",
}: PhoneInputProps) {
  return (
    <input
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      value={value}
      required={required}
      placeholder="(703) 555-0123"
      onChange={(event) => onChange(formatUsPhone(event.target.value))}
    />
  );
}
