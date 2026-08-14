"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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

type MenuPosition = {
  top: number;
  left: number;
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
 * Menu portals to document.body (fixed) so table overflow cannot clip it.
 * Escape / outside click close; focus returns to the trigger.
 */
export function StaffRowActions({ label = "Row actions", actions }: StaffRowActionsProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    function placeMenu() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menu = menuRef.current;
      const gap = 4;
      const pad = 8;
      const menuHeight = menu?.offsetHeight ?? Math.max(44, actions.length * 42 + 14);
      const menuWidth = menu?.offsetWidth ?? 148;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      let top = openUp ? rect.top - gap - menuHeight : rect.bottom + gap;
      top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));

      let left = rect.right - menuWidth;
      left = Math.max(pad, Math.min(left, window.innerWidth - menuWidth - pad));

      setPosition({ top, left });
    }

    placeMenu();
    const frame = window.requestAnimationFrame(placeMenu);

    window.addEventListener("resize", placeMenu);
    // Capture scroll from nested overflow containers (table panels, content).
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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

  const menuStyle: CSSProperties | undefined = position
    ? { top: position.top, left: position.left }
    : { top: -9999, left: -9999, visibility: "hidden" };

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            className="staff-row-actions-menu staff-row-actions-menu-portal"
            role="menu"
            style={menuStyle}
          >
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
          </div>,
          document.body,
        )
      : null;

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
      {menu}
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
