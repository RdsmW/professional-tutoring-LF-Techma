"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { StaffRowActions, type StaffRowAction } from "@/components/staff-row-actions";

export type DirectoryCardFieldSlot = {
  id: string;
  label: string;
  value: ReactNode;
};

type DirectoryCardFieldsProps = {
  /** Labeled slots, laid out 3 per row (future field-picker can pass an ordered list). */
  fields: DirectoryCardFieldSlot[];
  /** Always last, full-width (typically Created). */
  footer?: DirectoryCardFieldSlot | null;
};

/** Shared labeled-slot grid for directory cards — 3 fields per line, optional footer row. */
export function DirectoryCardFields({ fields, footer }: DirectoryCardFieldsProps) {
  if (fields.length === 0 && !footer) return null;
  return (
    <div className="mini-fields staff-dir-card-fields">
      {fields.map((field) => (
        <span key={field.id}>
          <small>{field.label}</small>
          {field.value}
        </span>
      ))}
      {footer ? (
        <span className="staff-dir-card-field-footer">
          <small>{footer.label}</small>
          {footer.value}
        </span>
      ) : null}
    </div>
  );
}

type StaffDirectoryCardProps = {
  title: string;
  subtitle?: string;
  status: ReactNode;
  fields: DirectoryCardFieldSlot[];
  footerField?: DirectoryCardFieldSlot | null;
  actions: StaffRowAction[];
  onOpen: () => void;
};

/** One record per card; whole card opens detail (no separate Open control). */
export function StaffDirectoryCard({
  title,
  subtitle,
  status,
  fields,
  footerField,
  actions,
  onOpen,
}: StaffDirectoryCardProps) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      className="staff-dir-card staff-dir-card-clickable"
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className="staff-dir-card-top" onClick={(event) => event.stopPropagation()}>
        <div className="staff-dir-card-status">{status}</div>
        <StaffRowActions label="Card actions" actions={actions} />
      </div>
      <div className="staff-dir-card-body">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
        <DirectoryCardFields fields={fields} footer={footerField} />
      </div>
    </article>
  );
}
