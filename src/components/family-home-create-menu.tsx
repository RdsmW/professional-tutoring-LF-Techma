"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

function IconStudent() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 11.5v4.2c0 .8 2.7 2.8 6 2.8s6-2 6-2.8v-4.2" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M4 5.5V21.5" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
    </svg>
  );
}

const ACTIONS: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: "/family/students?add=1", label: "+ New Student", icon: <IconStudent /> },
  { href: "/family/book-tutoring", label: "+ Book Tutoring", icon: <IconBook /> },
];

export function FamilyHomeCreateMenu() {
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
    <div className="staff-create-menu family-create-menu" ref={rootRef}>
      <button
        type="button"
        className="primary-button family-primary staff-create-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Create new"
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
              <span className="staff-create-menu-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
