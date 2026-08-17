"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui";
import {
  IconArchive,
  IconClose,
  IconLink,
  IconPencil,
  IconPlus,
  IconRestore,
  IconUserPlus,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { StaffRowActions, lifecycleActions, type StaffRowAction } from "@/components/staff-row-actions";
import { StaffNotesSection } from "@/components/staff-notes-section";
import { StaffRecordIntegrationsCard } from "@/components/staff-record-integrations-card";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { GuardianRelationshipRolePill } from "@/components/guardian-relationship-role-pill";
import {
  formatGuardianRelationshipRole,
  type StaffGuardianDetail,
  type StaffGuardianNote,
  type StaffGuardianStudentRow,
} from "@/lib/staff/guardian-shared";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { formatSubjectsPreview } from "@/lib/ui/subjects-preview";

type AssignStudentOption = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  householdDisplayName: string;
};

const PREVIEW_LIMIT = 3;

type GuardianLifecycleConfirm = "archive" | "restore";

function initials(firstName: string, lastName: string) {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "G";
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

/** Soft-hide Notes UI on Family / Guardian / Student detail (backend + recycle-bin kept). */
const SHOW_STAFF_NOTES = false;

function formatMailingAddressLines(guardian: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}): string[] {
  // Country is always US — omit from summary card.
  const hasLocalAddress = Boolean(
    guardian.addressLine1 ||
      guardian.addressLine2 ||
      guardian.city ||
      guardian.state ||
      guardian.postalCode,
  );
  if (!hasLocalAddress) return [];

  const lines: string[] = [];
  const line1 = (guardian.addressLine1 || "").trim();
  const line2 = (guardian.addressLine2 || "").trim();
  if (line1 && line2) {
    lines.push(`${line1}, ${line2}`);
  } else if (line1 || line2) {
    lines.push(line1 || line2);
  }

  const city = (guardian.city || "").trim();
  const state = (guardian.state || "").trim();
  const postal = (guardian.postalCode || "").trim();
  const cityStateZip = [city, [state, postal].filter(Boolean).join(" ").trim()]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) lines.push(cityStateZip);

  return lines;
}

function ConfirmActionModal({
  title,
  body,
  confirmLabel,
  destructive,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="staff-modal staff-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-confirm-modal-title"
      >
        <h3 id="staff-confirm-modal-title">{title}</h3>
        <div className="staff-confirm-modal-body">
          <p>{body}</p>
        </div>
        <div className="staff-modal-actions">
          <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={destructive ? "danger-button" : "primary-button"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesListPreview({
  total,
  empty,
  onViewMore,
  children,
}: {
  total: number;
  empty: ReactNode;
  onViewMore: () => void;
  children: ReactNode;
}) {
  if (total === 0) return <>{empty}</>;
  return (
    <div className="family-list-preview-shell">
      <div className="family-list-preview">{children}</div>
      {total > PREVIEW_LIMIT ? (
        <button type="button" className="text-button family-view-more" onClick={onViewMore}>
          View more
        </button>
      ) : null}
    </div>
  );
}

function NotesListModal({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={["staff-modal", "family-list-modal", className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-list-modal-title"
      >
        <div className="family-list-modal-header">
          <h3 id="family-list-modal-title">{title}</h3>
          <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={onClose}>
            <IconClose size={18} />
          </StaffIconButton>
        </div>
        <div className="family-list-modal-body">{children}</div>
      </div>
    </div>
  );
}

function SectionPlusMenu({
  open,
  onToggle,
  onClose,
  disabled,
  disabledReason,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  disabled?: boolean;
  disabledReason?: string;
  items: Array<{
    id: string;
    label: string;
    onSelect: () => void;
    disabled?: boolean;
    icon?: ReactNode;
  }>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="family-section-plus" ref={rootRef}>
      <StaffIconButton
        label="Add"
        title={disabled ? disabledReason || "Cannot add" : "Add"}
        disabled={disabled}
        onClick={onToggle}
      >
        <IconPlus size={16} />
      </StaffIconButton>
      {disabled && disabledReason ? (
        <span className="family-section-plus-hint">{disabledReason}</span>
      ) : null}
      {open && !disabled ? (
        <div className="family-section-plus-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="family-section-plus-item"
              disabled={item.disabled}
              onClick={() => {
                onClose();
                item.onSelect();
              }}
            >
              <span className="family-section-plus-item-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="family-section-plus-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StaffGuardianDetailClient({ guardianId }: { guardianId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const fromFamily = searchParams.get("from") === "family";
  const deepLinkEdit = searchParams.get("edit") === "1";

  const [guardian, setGuardian] = useState<StaffGuardianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDeepLinkHandled, setEditDeepLinkHandled] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [sectionMenu, setSectionMenu] = useState<"students" | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignQuery, setAssignQuery] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignStudents, setAssignStudents] = useState<AssignStudentOption[]>([]);
  const [assignSelectedId, setAssignSelectedId] = useState<string | null>(null);
  const [assignBusyId, setAssignBusyId] = useState<string | null>(null);
  const [studentBusyId, setStudentBusyId] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<GuardianLifecycleConfirm | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load guardian.");
        return;
      }
      setGuardian(data.guardian as StaffGuardianDetail);
    } catch {
      setError("Unable to load guardian.");
    } finally {
      setLoading(false);
    }
  }, [guardianId]);

  const softReload = useCallback(async () => {
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) return;
      setGuardian(data.guardian as StaffGuardianDetail);
    } catch {
      /* keep current view */
    }
  }, [guardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!deepLinkEdit || editDeepLinkHandled) return;
    setEditDeepLinkHandled(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const qs = params.toString();
    router.replace(`/staff/guardians/${guardianId}/edit${qs ? `?${qs}` : ""}`);
  }, [deepLinkEdit, editDeepLinkHandled, guardianId, router, searchParams]);

  async function setStatus(status: "active" | "archived", options?: { fromUndo?: boolean }) {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);

    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to update status.");
        return;
      }
      setLifecycleConfirm(null);
      const message = status === "archived" ? "Guardian archived." : "Guardian restored.";
      if (options?.fromUndo) {
        toast.success(message);
      } else {
        const reverse: "active" | "archived" = status === "archived" ? "active" : "archived";
        toast.success(message, {
          action: {
            label: "Undo",
            onClick: () => void setStatus(reverse, { fromUndo: true }),
          },
        });
      }
      await softReload();
    } catch {
      toast.error("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function createGuardianNote(body: string): Promise<StaffGuardianNote> {
    const response = await fetch(`/api/staff/guardians/${guardianId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.note) {
      throw new Error(data.error || "Unable to add note.");
    }
    const nextNote = data.note as StaffGuardianNote;
    setGuardian((prev) =>
      prev
        ? {
            ...prev,
            notes: [nextNote, ...prev.notes],
          }
        : prev,
    );
    return nextNote;
  }

  async function updateGuardianNote(noteId: string, body: string): Promise<StaffGuardianNote> {
    const response = await fetch(`/api/staff/guardians/${guardianId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.note) {
      throw new Error(data.error || "Unable to update note.");
    }
    const nextNote = data.note as StaffGuardianNote;
    setGuardian((prev) =>
      prev
        ? {
            ...prev,
            notes: prev.notes.map((note) => (note.id === nextNote.id ? nextNote : note)),
          }
        : prev,
    );
    return nextNote;
  }

  async function deleteGuardianNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/staff/guardians/${guardianId}/notes/${noteId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Unable to delete note.");
    }
    setGuardian((prev) =>
      prev
        ? {
            ...prev,
            notes: prev.notes.filter((note) => note.id !== noteId),
          }
        : prev,
    );
  }

  function closeAssignModal() {
    setAssignModalOpen(false);
    setAssignQuery("");
    setAssignSelectedId(null);
    setAssignStudents([]);
    setAssignBusyId(null);
  }

  async function openAssignModal() {
    if (!guardian?.household) {
      toast.error("Assign this guardian to a family before assigning students.");
      return;
    }
    setAssignModalOpen(true);
    setAssignQuery("");
    setAssignSelectedId(null);
    setAssignStudents([]);
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/staff/families/${guardian.household.id}/students/assign`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to load students.");
        closeAssignModal();
        return;
      }
      setAssignStudents(data.students ?? []);
    } catch {
      toast.error("Unable to load students.");
      closeAssignModal();
    } finally {
      setAssignLoading(false);
    }
  }

  async function searchAssign(q: string) {
    if (!guardian?.household) return;
    setAssignQuery(q);
    setAssignSelectedId(null);
    setAssignLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      const response = await fetch(
        `/api/staff/families/${guardian.household.id}/students/assign${qs ? `?${qs}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to search students.");
        return;
      }
      setAssignStudents(data.students ?? []);
    } catch {
      toast.error("Unable to search students.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function confirmAssign() {
    if (!guardian?.household || !assignSelectedId || assignBusyId) return;
    setAssignBusyId(assignSelectedId);
    try {
      const response = await fetch(`/api/staff/families/${guardian.household.id}/students/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: assignSelectedId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to assign student.");
        return;
      }
      toast.success("Student assigned.");
      closeAssignModal();
      await softReload();
    } catch {
      toast.error("Unable to assign student.");
    } finally {
      setAssignBusyId(null);
    }
  }

  async function setStudentLifecycle(studentId: string, nextLifecycle: string) {
    if (studentBusyId) return;
    setStudentBusyId(studentId);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextLifecycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to update student.");
        return;
      }
      toast.success(nextLifecycle === "archived" ? "Student archived." : "Student restored.");
      await softReload();
    } catch {
      toast.error("Unable to update student.");
    } finally {
      setStudentBusyId(null);
    }
  }

  async function deleteStudent(studentId: string) {
    if (studentBusyId) return;
    if (!window.confirm("Permanently delete this student? This cannot be undone.")) return;
    setStudentBusyId(studentId);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to delete student.");
        return;
      }
      toast.success("Student deleted.");
      await softReload();
    } catch {
      toast.error("Unable to delete student.");
    } finally {
      setStudentBusyId(null);
    }
  }

  async function unassignStudent(studentId: string) {
    if (!guardian?.household || memberBusyId) return;
    if (
      !window.confirm(
        "Unassign this student from the family? They become an orphan until reassigned. Historical bookings stay on this family.",
      )
    ) {
      return;
    }
    setMemberBusyId(studentId);
    try {
      const response = await fetch(
        `/api/staff/families/${guardian.household.id}/students/${studentId}/unassign`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to unassign student.");
        return;
      }
      toast.success("Student unassigned.");
      await softReload();
    } catch {
      toast.error("Unable to unassign student.");
    } finally {
      setMemberBusyId(null);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading guardian…</p>;
  if (error && !guardian) return <p className="form-error">{error}</p>;
  if (!guardian) return null;

  const fullName = `${guardian.firstName} ${guardian.lastName}`.trim();
  const roleLabel = formatGuardianRelationshipRole(guardian.relationshipRole);
  const backHref =
    fromFamily && guardian.household
      ? `/staff/families/${guardian.household.id}`
      : "/staff/guardians";
  const backLabel = fromFamily && guardian.household ? "← Family" : "← Guardians";
  const isArchived = guardian.status === "archived";
  const statusKey = isArchived
    ? "archived"
    : guardian.invitePending
      ? "invite_pending"
      : guardian.linked
        ? "linked"
        : "unlinked";

  const addressLines = formatMailingAddressLines(guardian);
  const previewStudents = guardian.students.slice(0, PREVIEW_LIMIT);
  const showStudents = guardian.isBillingOwner;
  const householdId = guardian.household?.id ?? null;

  const lifecycleConfirmCopy: Record<
    GuardianLifecycleConfirm,
    { title: string; body: string; confirmLabel: string }
  > = {
    archive: {
      title: "Archive this guardian?",
      body: "Archived guardians are hidden from the default Guardians list. You can restore them later.",
      confirmLabel: "Archive",
    },
    restore: {
      title: "Restore this guardian?",
      body: "This guardian will appear as active again in the Guardians list.",
      confirmLabel: "Restore",
    },
  };

  function studentActions(s: StaffGuardianStudentRow): StaffRowAction[] {
    const actions = lifecycleActions({
      isArchived: s.lifecycle === "archived",
      canDelete: Boolean(s.canDelete),
      busy: studentBusyId === s.id || memberBusyId === s.id,
      onEdit: () => router.push(`/staff/students/${s.id}/edit`),
      onArchive: () => void setStudentLifecycle(s.id, "archived"),
      onRestore: () => void setStudentLifecycle(s.id, "active"),
      onDelete: () => void deleteStudent(s.id),
    });
    if (householdId) {
      actions.splice(1, 0, {
        id: "unassign",
        label: "Unassign",
        tone: "unassign",
        disabled: memberBusyId === s.id,
        onSelect: () => void unassignStudent(s.id),
      });
    }
    return actions;
  }

  function renderStudentsTable(rows: StaffGuardianStudentRow[]) {
    return (
      <div className="table-panel staff-dir-table family-detail-table">
        <div className="table-head family-detail-cols-students">
          <span>Name</span>
          <span>Subjects</span>
          <span>Grade</span>
          <span>School</span>
          <span className="staff-dir-col-status">Status</span>
          <span className="staff-dir-col-actions" aria-label="Actions" />
        </div>
        {rows.map((s) => (
          <div
            key={s.id}
            className="table-row family-detail-cols-students family-detail-table-row family-detail-row-clickable"
            role="link"
            tabIndex={0}
            aria-label={`Open student ${s.displayName}`}
            onClick={() => router.push(`/staff/students/${s.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/staff/students/${s.id}`);
              }
            }}
          >
            <strong>{s.displayName}</strong>
            <span>{formatSubjectsPreview(s.subjects)}</span>
            <span>{s.gradeLabel || "—"}</span>
            <span>{s.schoolName || "—"}</span>
            <span className="staff-dir-col-status">
              <span className={`pill ${statusTone(s.lifecycle)}`}>{formatStatusLabel(s.lifecycle)}</span>
            </span>
            <span className="staff-dir-col-actions">
              <StaffRowActions label="Student actions" actions={studentActions(s)} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />

      {lifecycleConfirm ? (
        <ConfirmActionModal
          title={lifecycleConfirmCopy[lifecycleConfirm].title}
          body={lifecycleConfirmCopy[lifecycleConfirm].body}
          confirmLabel={lifecycleConfirmCopy[lifecycleConfirm].confirmLabel}
          busy={lifecycleBusy}
          onCancel={() => {
            if (!lifecycleBusy) setLifecycleConfirm(null);
          }}
          onConfirm={() => {
            if (lifecycleConfirm === "archive") void setStatus("archived");
            else void setStatus("active");
          }}
        />
      ) : null}

      <div className="family-detail-topbar">
        <Link href={backHref} className="page-back">
          {backLabel}
        </Link>
        <div className="family-detail-topbar-actions">
          <Link
            href={
              fromFamily
                ? `/staff/guardians/${guardianId}/edit?from=family`
                : `/staff/guardians/${guardianId}/edit`
            }
            className="staff-icon-btn staff-icon-btn-edit"
            aria-label="Edit"
            title="Edit"
          >
            <IconPencil size={15} />
          </Link>
          {isArchived ? (
            <StaffIconButton
              label="Restore"
              title="Restore"
              tone="restore"
              disabled={lifecycleBusy}
              onClick={() => setLifecycleConfirm("restore")}
            >
              <IconRestore size={15} />
            </StaffIconButton>
          ) : (
            <StaffIconButton
              label="Archive"
              title="Archive"
              tone="archive"
              disabled={lifecycleBusy}
              onClick={() => setLifecycleConfirm("archive")}
            >
              <IconArchive size={15} />
            </StaffIconButton>
          )}
        </div>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(guardian.firstName, guardian.lastName)}</span>
        <div className="family-record-hero-copy">
          <h2>{fullName}</h2>
        </div>
        <span className={`pill family-record-hero-status-pill ${statusTone(statusKey)}`}>
          {formatStatusLabel(statusKey)}
        </span>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="family-detail-layout family-detail-stack">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Identity</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense guardian-identity-dense">
              <div className="family-household-upper">
                <span>
                  <small>First name</small>
                  <strong>{guardian.firstName}</strong>
                </span>
                <span>
                  <small>Last name</small>
                  <strong>{guardian.lastName}</strong>
                </span>
                <span>
                  <small>Email</small>
                  <strong>{guardian.email}</strong>
                </span>
                <span>
                  <small>Phone</small>
                  <strong>{guardian.phone || "—"}</strong>
                </span>
              </div>
              <div className="family-household-lower guardian-identity-address-row">
                <span className="family-household-field-address">
                  <small>Mailing address</small>
                  {addressLines.length ? (
                    <div className="family-household-address-lines">
                      {addressLines.map((line, index) => (
                        <span key={`${index}-${line}`}>{line}</span>
                      ))}
                    </div>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
                <span className="guardian-identity-other-field">
                  <small>Other information</small>
                  {guardian.otherInformation?.trim() ? (
                    <strong className="guardian-other-info-text">{guardian.otherInformation}</strong>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Household</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense guardian-household-dense">
              <div className="family-household-upper">
                <span>
                  <small>Family</small>
                  {guardian.household ? (
                    <Link
                      href={`/staff/families/${guardian.household.id}`}
                      className="family-household-payer-link"
                    >
                      {guardian.household.displayName}
                    </Link>
                  ) : (
                    <strong>Unassigned</strong>
                  )}
                </span>
                <span>
                  <small>Parent role</small>
                  {roleLabel ? (
                    <GuardianRelationshipRolePill role={guardian.relationshipRole} />
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
                <span>
                  <small>Responsible for payment</small>
                  <strong>{yesNo(guardian.isBillingOwner)}</strong>
                </span>
              </div>
              {!guardian.household ? (
                <div className="family-household-lower">
                  <p className="family-empty" style={{ margin: 0, gridColumn: "1 / -1" }}>
                    Assign this guardian from a Family record.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>

        {showStudents ? (
          <Panel className="family-equal-panel family-students-band">
            <div className="family-panel-heading">
              <h2>Students</h2>
              <SectionPlusMenu
                open={sectionMenu === "students"}
                onToggle={() => setSectionMenu((v) => (v === "students" ? null : "students"))}
                onClose={() => setSectionMenu(null)}
                disabled={!householdId}
                disabledReason="Assign this guardian to a family first."
                items={[
                  {
                    id: "add-new",
                    label: "Add new",
                    icon: <IconUserPlus size={14} />,
                    onSelect: () => {
                      if (!householdId) return;
                      router.push(`/staff/students?new=1&householdId=${encodeURIComponent(householdId)}`);
                    },
                  },
                  {
                    id: "assign",
                    label: "Assign existing",
                    icon: <IconLink size={14} />,
                    onSelect: () => void openAssignModal(),
                  },
                ]}
              />
            </div>
            <NotesListPreview
              total={guardian.students.length}
              empty={<p className="family-empty">No students in this household yet.</p>}
              onViewMore={() => setStudentsModalOpen(true)}
            >
              {renderStudentsTable(previewStudents)}
            </NotesListPreview>
          </Panel>
        ) : null}
      </div>

      <StaffRecordIntegrationsCard
        zohoId={guardian.zohoCrmId}
        supports={{ zoho: true, stripe: false, acuity: false, quickbooks: false }}
      />

      {SHOW_STAFF_NOTES ? (
        <StaffNotesSection
          notes={guardian.notes}
          onCreate={createGuardianNote}
          onUpdate={updateGuardianNote}
          onDelete={deleteGuardianNote}
          onSuccess={toast.success}
          onError={toast.error}
        />
      ) : null}

      {studentsModalOpen ? (
        <NotesListModal title="Students" onClose={() => setStudentsModalOpen(false)}>
          {renderStudentsTable(guardian.students)}
        </NotesListModal>
      ) : null}

      {assignModalOpen ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAssignModal();
          }}
        >
          <div
            className="staff-modal family-assign-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-assign-student-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closeAssignModal();
            }}
          >
            <div className="family-list-modal-header">
              <h3 id="guardian-assign-student-title">Assign student</h3>
              <StaffIconButton label="Close" title="Close" tone="muted" onClick={closeAssignModal}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <div className="family-assign-modal-body">
              <label className="family-assign-search">
                Search
                <input
                  value={assignQuery}
                  onChange={(e) => void searchAssign(e.target.value)}
                  placeholder="Student name…"
                  autoFocus
                />
              </label>
              {assignLoading ? <p className="family-empty">Loading…</p> : null}
              {!assignLoading ? (
                assignStudents.length === 0 ? (
                  <p className="family-empty">No available students to assign.</p>
                ) : (
                  <div className="family-assign-list" role="listbox" aria-label="Available students">
                    {assignStudents.map((s) => {
                      const selected = assignSelectedId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`family-assign-row${selected ? " is-selected" : ""}`}
                          disabled={!!assignBusyId}
                          onClick={() => setAssignSelectedId(s.id)}
                        >
                          <span className="family-assign-row-copy">
                            <strong>{s.displayName}</strong>
                            <small>
                              {s.gradeLabel || "—"} · {s.householdDisplayName}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
            <div className="staff-modal-actions">
              <button type="button" className="secondary-button" onClick={closeAssignModal}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!assignSelectedId || !!assignBusyId}
                onClick={() => void confirmAssign()}
              >
                {assignBusyId ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
