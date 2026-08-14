"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

function IconStudent() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 11.5v4.2c0 .8 2.7 2.8 6 2.8s6-2 6-2.8v-4.2" />
    </svg>
  );
}

function IconGuardian() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.5c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
    </svg>
  );
}

function IconFamily() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function IconTutor() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="12" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

const ACTIONS: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: "/staff/students?new=1", label: "Student", icon: <IconStudent /> },
  { href: "/staff/families?newGuardian=1", label: "Guardian", icon: <IconGuardian /> },
  { href: "/staff/families?new=1", label: "Family", icon: <IconFamily /> },
  { href: "/staff/tutors?new=1", label: "Tutor", icon: <IconTutor /> },
];

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
              {action.icon}
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
