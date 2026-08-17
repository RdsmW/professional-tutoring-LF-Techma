import type { ReactNode } from "react";

export type DirectoryCardFieldSlot = {
  id: string;
  label: string;
  value: ReactNode;
};

type DirectoryCardFieldsProps = {
  /** Labeled slots, laid out 3 per row on directory cards (future field-picker can pass an ordered list). */
  fields: DirectoryCardFieldSlot[];
  /** Always last, full-width (typically Created). */
  footer?: DirectoryCardFieldSlot | null;
  /** Override grid classes (dashboard rows use auto-fit columns). */
  className?: string;
};

/** Shared labeled-slot grid — directory default is 3 fields per line, optional footer row. */
export function DirectoryCardFields({
  fields,
  footer,
  className = "mini-fields staff-dir-card-fields",
}: DirectoryCardFieldsProps) {
  if (fields.length === 0 && !footer) return null;
  return (
    <div className={className}>
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
