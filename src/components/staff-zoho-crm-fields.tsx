"use client";

import type { ReactNode } from "react";
import { StaffEditSectionLabel } from "@/components/staff-record-edit-shell";

export type StaffZohoCrmFieldsProps = {
  crmId: string;
  crmUrl: string;
  onCrmIdChange: (value: string) => void;
  onCrmUrlChange: (value: string) => void;
  /** Extra Zoho fields after the ID / URL row (future CRM columns). */
  children?: ReactNode;
};

/**
 * Shared Zoho CRM edit section for Family / Guardian / Student forms.
 * Add new fields via `children` or by extending this component.
 */
export function StaffZohoCrmFields({
  crmId,
  crmUrl,
  onCrmIdChange,
  onCrmUrlChange,
  children,
}: StaffZohoCrmFieldsProps) {
  return (
    <>
      <StaffEditSectionLabel>Zoho CRM</StaffEditSectionLabel>
      <div className="staff-edit-field-row staff-edit-field-row--2">
        <label>
          Zoho CRM ID
          <input value={crmId} onChange={(event) => onCrmIdChange(event.target.value)} autoComplete="off" />
        </label>
        <label>
          Zoho CRM URL
          <input
            type="url"
            placeholder="https://…"
            value={crmUrl}
            onChange={(event) => onCrmUrlChange(event.target.value)}
            autoComplete="off"
          />
        </label>
      </div>
      {children}
    </>
  );
}
