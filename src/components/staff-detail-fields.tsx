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
  /** Keep the label visible when the value is blank (Identity/Profile). */
  showEmpty?: boolean;
};

/** Labeled detail slot — omitted when empty unless `showEmpty`. */
export function StaffDetailField({ label, children, className, showEmpty }: StaffDetailFieldProps) {
  const empty = isEmptyNode(children);
  if (empty && !showEmpty) return null;
  return (
    <span className={className}>
      <small>{label}</small>
      {empty ? (
        <strong />
      ) : typeof children === "string" || typeof children === "number" ? (
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
