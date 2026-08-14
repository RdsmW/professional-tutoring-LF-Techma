"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ACTIONS = [
  { href: "/staff/students?new=1", label: "New Student" },
  { href: "/staff/families?newGuardian=1", label: "New Guardian" },
  { href: "/staff/families?new=1", label: "New Family" },
  { href: "/staff/tutors?new=1", label: "New Tutor" },
] as const;

export function StaffHomeCreateMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="staff-create-menu" ref={rootRef}>
      <button
        type="button"
        className="primary-button staff-create-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        +
      </button>
      {open ? (
        <div className="staff-create-menu-panel" role="menu">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              role="menuitem"
              className="staff-create-menu-item"
              onClick={() => setOpen(false)}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
