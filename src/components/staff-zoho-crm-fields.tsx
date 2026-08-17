"use client";

import type { ReactNode } from "react";
import { StaffEditSectionLabel } from "@/components/staff-record-edit-shell";

export type StaffZohoCrmFieldsProps = {
  crmId: string;
  crmUrl: string;
  /** Ignored when read-only (default). Kept so callers can reuse one component. */
  onCrmIdChange?: (value: string) => void;
  onCrmUrlChange?: (value: string) => void;
  /** Staff cannot edit CRM IDs/URLs on record forms. */
  readOnly?: boolean;
  /** Extra Zoho fields after the ID / URL row (future CRM columns). */
  children?: ReactNode;
};

/**
 * Shared Zoho CRM section for Family / Guardian / Student (and other) edit shells.
 * Display-only by default — IDs/URLs are not staff-editable on the form.
 */
export function StaffZohoCrmFields({
  crmId,
  crmUrl,
  onCrmIdChange,
  onCrmUrlChange,
  readOnly = true,
  children,
}: StaffZohoCrmFieldsProps) {
  return (
    <>
      <StaffEditSectionLabel>Zoho CRM</StaffEditSectionLabel>
      <div className="staff-edit-field-row staff-edit-field-row--2">
        <label>
          Zoho CRM ID
          <input
            value={crmId}
            readOnly={readOnly}
            onChange={
              readOnly || !onCrmIdChange ? undefined : (event) => onCrmIdChange(event.target.value)
            }
            autoComplete="off"
          />
        </label>
        <label>
          Zoho CRM URL
          <input
            type={readOnly ? "text" : "url"}
            placeholder={readOnly ? undefined : "https://…"}
            value={crmUrl}
            readOnly={readOnly}
            onChange={
              readOnly || !onCrmUrlChange ? undefined : (event) => onCrmUrlChange(event.target.value)
            }
            autoComplete="off"
          />
        </label>
      </div>
      {children}
    </>
  );
}
