"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type StaffRowActionTone = "edit" | "restore" | "archive" | "danger" | "default";

export type StaffRowAction = {
  id: string;
  label: string;
  onSelect: () => void;
  tone?: StaffRowActionTone;
  disabled?: boolean;
};

type StaffRowActionsProps = {
  label?: string;
  actions: StaffRowAction[];
};

function toneClass(tone: StaffRowActionTone | undefined) {
  switch (tone) {
    case "edit":
      return "staff-row-actions-item staff-row-actions-item-edit";
    case "restore":
      return "staff-row-actions-item staff-row-actions-item-restore";
    case "archive":
      return "staff-row-actions-item staff-row-actions-item-archive";
    case "danger":
      return "staff-row-actions-item staff-row-actions-item-danger";
    default:
      return "staff-row-actions-item";
  }
}

/**
 * Lightweight vertical ⋮ menu for directory rows.
 * Escape / outside click close; focus returns to the trigger.
 */
export function StaffRowActions({ label = "Row actions", actions }: StaffRowActionsProps) {
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
        title="Actions"
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
        <span className="staff-row-actions-kebab" aria-hidden="true">
          ⋮
        </span>
      </button>
      {open ? (
        <div id={menuId} className="staff-row-actions-menu" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={toneClass(action.tone)}
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
    { id: "edit", label: "Edit", onSelect: onEdit, tone: "edit", disabled: busy },
  ];
  if (isArchived) {
    actions.push({
      id: "restore",
      label: "Restore",
      onSelect: onRestore,
      tone: "restore",
      disabled: busy,
    });
  } else if (canDelete) {
    actions.push({
      id: "delete",
      label: "Delete",
      onSelect: onDelete,
      tone: "danger",
      disabled: busy,
    });
  } else {
    actions.push({
      id: "archive",
      label: "Archive",
      onSelect: onArchive,
      tone: "archive",
      disabled: busy,
    });
  }
  return actions;
}

export function StaffDirectoryFilters({ children }: { children: ReactNode }) {
  return <div className="staff-directory-filters">{children}</div>;
}
