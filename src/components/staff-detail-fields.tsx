import { Children, type CSSProperties, type ReactNode } from "react";

function isEmptyNode(node: ReactNode): boolean {
  if (node == null || node === false) return true;
  if (typeof node === "string" && node.trim() === "") return true;
  return false;
}

type StaffDetailFieldProps = {
  label: string;
  children?: ReactNode;
  className?: string;
};

/** Labeled detail slot — omitted when empty (same rule as Integrations). */
export function StaffDetailField({ label, children, className }: StaffDetailFieldProps) {
  if (isEmptyNode(children)) return null;
  return (
    <span className={className}>
      <small>{label}</small>
      {typeof children === "string" || typeof children === "number" ? (
        <strong>{children}</strong>
      ) : (
        children
      )}
    </span>
  );
}

/** Drops empty children so a sparse Profile/Household row does not leave a blank grid. */
export function StaffDetailFieldGroup({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter((child) => !isEmptyNode(child));
  if (items.length === 0) return null;
  return (
    <div className={className} style={style}>
      {items}
    </div>
  );
}
