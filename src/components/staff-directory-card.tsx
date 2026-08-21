"use client";

import type { KeyboardEvent, ReactNode } from "react";
import {
  DirectoryCardFields,
  type DirectoryCardFieldSlot,
} from "@/components/directory-card-fields";
import { StaffRowActions, type StaffRowAction } from "@/components/staff-row-actions";

export type { DirectoryCardFieldSlot };
export { DirectoryCardFields };

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
      <div className="staff-dir-card-top">
        <h3 className="staff-dir-card-title">{title}</h3>
        <div className="staff-dir-card-status">{status}</div>
        <StaffRowActions label="Card actions" actions={actions} />
      </div>
      <div className="staff-dir-card-body">
        {subtitle ? <p>{subtitle}</p> : null}
        <DirectoryCardFields fields={fields} footer={footerField} />
      </div>
    </article>
  );
}
