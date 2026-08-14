"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type StaffRowAction = {
  id: string;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

type StaffRowActionsProps = {
  label: string;
  actions: StaffRowAction[];
};

/**
 * Lightweight ⋯ menu for directory rows.
 * Escape / outside click close; focus returns to the trigger.
 */
export function StaffRowActions({ label, actions }: StaffRowActionsProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function runAction(action: StaffRowAction) {
    if (action.disabled) return;
    setOpen(false);
    triggerRef.current?.focus();
    action.onSelect();
  }

  return (
    <div className="staff-row-actions" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="staff-row-actions-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        onKeyDown={onTriggerKeyDown}
      >
        ⋯
      </button>
      {open ? (
        <div id={menuId} className="staff-row-actions-menu" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={
                action.tone === "danger"
                  ? "staff-row-actions-item staff-row-actions-item-danger"
                  : "staff-row-actions-item"
              }
              disabled={action.disabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                runAction(action);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Exclusive lifecycle action for Families / Students / Tutors. */
export function lifecycleActions(options: {
  isArchived: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  busy?: boolean;
}): StaffRowAction[] {
  const { isArchived, canDelete, onEdit, onArchive, onRestore, onDelete, busy } = options;
  const actions: StaffRowAction[] = [
    { id: "edit", label: "Edit", onSelect: onEdit, disabled: busy },
  ];
  if (isArchived) {
    actions.push({ id: "restore", label: "Restore", onSelect: onRestore, disabled: busy });
  } else if (canDelete) {
    actions.push({
      id: "delete",
      label: "Delete",
      onSelect: onDelete,
      tone: "danger",
      disabled: busy,
    });
  } else {
    actions.push({ id: "archive", label: "Archive", onSelect: onArchive, disabled: busy });
  }
  return actions;
}

export function StaffDirectoryFilters({ children }: { children: ReactNode }) {
  return <div className="staff-directory-filters">{children}</div>;
}
