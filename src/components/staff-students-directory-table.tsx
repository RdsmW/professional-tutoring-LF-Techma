import Link from "next/link";
import type { KeyboardEvent, ReactNode } from "react";

export type StaffStudentDirectoryTableRow = {
  id: string;
  name: string;
  household: string;
  subjects: string;
  grade: string;
  school: string;
  statusLabel: string;
  statusTone: string;
  created: string;
  href: string;
};

type StaffStudentsDirectoryTableProps = {
  rows: StaffStudentDirectoryTableRow[];
  /** Directory kebab menu. Omit on dashboard (click-row to detail). */
  renderActions?: (row: StaffStudentDirectoryTableRow) => ReactNode;
  /** Directory uses click handlers so row actions can stop navigation. */
  onRowActivate?: (href: string) => void;
};

function rowClassName(withActions: boolean) {
  return withActions
    ? "table-row staff-dir-cols-students"
    : "table-row staff-dir-cols-students staff-dir-cols-no-actions";
}

function headClassName(withActions: boolean) {
  return withActions
    ? "table-head staff-dir-cols-students"
    : "table-head staff-dir-cols-students staff-dir-cols-no-actions";
}

function StudentTableCells({
  row,
  actions,
}: {
  row: StaffStudentDirectoryTableRow;
  actions?: ReactNode;
}) {
  return (
    <>
      <strong>{row.name}</strong>
      <span>{row.household}</span>
      <span>{row.subjects}</span>
      <span>{row.grade}</span>
      <span>{row.school}</span>
      <span className="staff-dir-col-status">
        <span className={`pill ${row.statusTone}`}>{row.statusLabel}</span>
      </span>
      <span>{row.created}</span>
      {actions ? <span className="staff-dir-col-actions">{actions}</span> : null}
    </>
  );
}

/** Shared students list chrome: same columns as `/staff/students` table view. */
export function StaffStudentsDirectoryTable({
  rows,
  renderActions,
  onRowActivate,
}: StaffStudentsDirectoryTableProps) {
  const withActions = Boolean(renderActions);

  return (
    <div className="table-panel staff-dir-table">
      <div className={headClassName(withActions)}>
        <span>Name</span>
        <span>Household</span>
        <span>Subjects</span>
        <span>Grade</span>
        <span>School</span>
        <span className="staff-dir-col-status">Status</span>
        <span>Created At</span>
        {withActions ? <span className="staff-dir-col-actions" aria-label="Actions" /> : null}
      </div>
      {rows.map((row) => {
        const cells = (
          <StudentTableCells row={row} actions={renderActions ? renderActions(row) : undefined} />
        );
        if (onRowActivate) {
          return (
            <div
              key={row.id}
              className={rowClassName(withActions)}
              role="link"
              tabIndex={0}
              onClick={() => onRowActivate(row.href)}
              onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowActivate(row.href);
                }
              }}
            >
              {cells}
            </div>
          );
        }
        return (
          <Link key={row.id} href={row.href} className={rowClassName(withActions)}>
            {cells}
          </Link>
        );
      })}
    </div>
  );
}
