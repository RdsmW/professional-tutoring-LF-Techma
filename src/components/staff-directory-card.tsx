"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { StaffRowActions, type StaffRowAction } from "@/components/staff-row-actions";

type StaffDirectoryCardProps = {
  title: string;
  subtitle?: string;
  status: ReactNode;
  fields: { label: string; value: ReactNode }[];
  actions: StaffRowAction[];
  onOpen: () => void;
};

export function StaffDirectoryCard({
  title,
  subtitle,
  status,
  fields,
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
        {fields.length > 0 ? (
          <div className="mini-fields">
            {fields.map((field) => (
              <span key={field.label}>
                <small>{field.label}</small>
                {field.value}
              </span>
            ))}
          </div>
        ) : null}
        <span className="card-action">
          Open <span>→</span>
        </span>
      </div>
    </article>
  );
}
