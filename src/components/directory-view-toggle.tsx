"use client";

import type { DirectoryView } from "@/lib/ui/directory-view";

type DirectoryViewToggleProps = {
  view: DirectoryView;
  onChange: (view: DirectoryView) => void;
  label?: string;
};

export function DirectoryViewToggle({
  view,
  onChange,
  label = "Result layout",
}: DirectoryViewToggleProps) {
  return (
    <div className="student-view-toggle directory-view-toggle" role="group" aria-label={label}>
      <button
        type="button"
        className={view === "table" ? "active" : undefined}
        aria-pressed={view === "table"}
        title="List view"
        onClick={() => onChange("table")}
      >
        <span className="directory-view-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
          </svg>
        </span>
        <span className="directory-view-label">List</span>
      </button>
      <button
        type="button"
        className={view === "cards" ? "active" : undefined}
        aria-pressed={view === "cards"}
        title="Card view"
        onClick={() => onChange("cards")}
      >
        <span className="directory-view-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <span className="directory-view-label">Cards</span>
      </button>
    </div>
  );
}
