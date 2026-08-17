"use client";

import type { ReactNode } from "react";
import { DirectoryViewToggle } from "@/components/directory-view-toggle";
import { StaffDirectoryFilters } from "@/components/staff-row-actions";
import { Panel } from "@/components/ui";
import type { DirectoryView } from "@/lib/ui/directory-view";

type StaffDirectoryChromeProps = {
  view: DirectoryView;
  onViewChange: (view: DirectoryView) => void;
  viewLabel: string;
  /** True when any filter differs from directory defaults. */
  filtersActive: boolean;
  onClearFilters: () => void;
  /** CSS grid columns for the filter row (exclude Filter/Clear — Clear is appended). */
  filterColumns: string;
  children: ReactNode;
};

/**
 * Shared staff directory toolbar: live filters (no Filter submit) + Clear when active + view toggle.
 */
export function StaffDirectoryChrome({
  view,
  onViewChange,
  viewLabel,
  filtersActive,
  onClearFilters,
  filterColumns,
  children,
}: StaffDirectoryChromeProps) {
  const gridTemplateColumns = filtersActive
    ? `${filterColumns} auto`
    : filterColumns;

  return (
    <div className="directory-toolbar">
      <StaffDirectoryFilters>
        <div className="student-filter-panel" style={{ gridTemplateColumns }}>
          {children}
          {filtersActive ? (
            <button type="button" className="clear-btn" onClick={onClearFilters}>
              Clear
            </button>
          ) : null}
        </div>
      </StaffDirectoryFilters>
      <DirectoryViewToggle view={view} onChange={onViewChange} label={viewLabel} />
    </div>
  );
}

type StaffDirectoryResultsProps = {
  view: DirectoryView;
  loading: boolean;
  isEmpty: boolean;
  loadingMessage: string;
  emptyMessage: string;
  cards: ReactNode;
  table: ReactNode;
};

/**
 * Card view = free-standing card grid (not wrapped in Panel).
 * Table view = Panel + table chrome.
 */
export function StaffDirectoryResults({
  view,
  loading,
  isEmpty,
  loadingMessage,
  emptyMessage,
  cards,
  table,
}: StaffDirectoryResultsProps) {
  if (loading) {
    return <p className="dashboard-empty staff-dir-status">{loadingMessage}</p>;
  }

  if (isEmpty) {
    return <p className="dashboard-empty staff-dir-status">{emptyMessage}</p>;
  }

  if (view === "cards") {
    return <div className="staff-dir-card-grid">{cards}</div>;
  }

  return (
    <Panel className="staff-dir-table-panel" style={{ padding: 0 }}>
      {table}
    </Panel>
  );
}
