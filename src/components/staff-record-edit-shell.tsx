"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";

export function StaffEditSectionLabel({ children }: { children: ReactNode }) {
  return <p className="staff-edit-section-label">{children}</p>;
}

type StaffMultilineFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  fullWidth?: boolean;
  hideLabel?: boolean;
  id?: string;
};

/** Multiline control with the same chrome as single-line inputs (not oversized textareas). */
export function StaffMultilineField({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
  fullWidth = true,
  hideLabel = false,
  id,
}: StaffMultilineFieldProps) {
  return (
    <label className={fullWidth ? "staff-edit-field-full" : undefined} style={fullWidth ? { gridColumn: "1 / -1" } : undefined}>
      {hideLabel ? <span className="sr-only">{label}</span> : label}
      <textarea
        id={id}
        className="staff-multiline-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );
}

type StaffWrapSelectOption = { id: string; label: string };

type StaffWrapSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: StaffWrapSelectOption[];
  emptyLabel?: string;
  id?: string;
};

/** Select that shows selected label wrapped (~2 lines) instead of overflowing the field. */
export function StaffWrapSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel = "—",
  id,
}: StaffWrapSelectProps) {
  const selected = options.find((option) => option.id === value);
  const display = selected?.label || emptyLabel;
  return (
    <label>
      {label}
      <div className="staff-edit-select-wrap-face">
        <span className="staff-edit-select-wrap-text" aria-hidden="true">
          {display}
        </span>
        <select
          id={id}
          className="staff-edit-select-wrap-native"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          title={display}
        >
          <option value="">{emptyLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

type StaffRecordEditShellProps = {
  backHref: string;
  backLabel: string;
  title: string;
  saving: boolean;
  saveLabel: string;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  formClassName?: string;
};

export function StaffRecordEditShell({
  backHref,
  backLabel,
  title,
  saving,
  saveLabel,
  error,
  onCancel,
  onSubmit,
  children,
  formClassName = "input-grid family-household-edit-grid",
}: StaffRecordEditShellProps) {
  return (
    <div className="staff-record-edit-shell">
      <div className="family-detail-topbar">
        <Link href={backHref} className="page-back">
          {backLabel}
        </Link>
      </div>

      <section className="staff-record-edit-header">
        <h1>{title}</h1>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <Panel className="family-equal-panel staff-record-edit-panel">
        <form id="staff-record-edit-form" onSubmit={onSubmit} className={formClassName}>
          {children}
          <div className="family-household-edit-actions">
            <button type="button" className="secondary-button" disabled={saving} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving…" : saveLabel}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
