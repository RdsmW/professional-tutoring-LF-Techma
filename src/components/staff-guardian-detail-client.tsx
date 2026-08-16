"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui";
import {
  IconClose,
  IconLink,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUserPlus,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { StaffRowActions, lifecycleActions, type StaffRowAction } from "@/components/staff-row-actions";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  formatGuardianRelationshipRole,
  type GuardianRelationshipRole,
  type StaffGuardianDetail,
  type StaffGuardianNote,
  type StaffGuardianStudentRow,
} from "@/lib/staff/guardian-shared";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  otherInformation: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  relationshipRole: "" | GuardianRelationshipRole;
  isBillingOwner: boolean;
};

type AssignStudentOption = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  householdDisplayName: string;
};

const PREVIEW_LIMIT = 3;

function initials(firstName: string, lastName: string) {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "G";
}

function toProfileForm(guardian: StaffGuardianDetail): ProfileForm {
  return {
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    email: guardian.email,
    phone: guardian.phone || "",
    otherInformation: guardian.otherInformation || "",
    addressLine1: guardian.addressLine1 || "",
    addressLine2: guardian.addressLine2 || "",
    city: guardian.city || "",
    state: guardian.state || "",
    postalCode: guardian.postalCode || "",
    relationshipRole: guardian.relationshipRole ?? "",
    isBillingOwner: guardian.isBillingOwner,
  };
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const day = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    });
    const time = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${day} · ${time}`;
  } catch {
    return "—";
  }
}

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
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [editDeepLinkHandled, setEditDeepLinkHandled] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
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
    if (!guardian || !deepLinkEdit || editDeepLinkHandled) return;
    setEditDeepLinkHandled(true);
    setProfileForm(toProfileForm(guardian));
    setEditing(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const qs = params.toString();
    router.replace(`/staff/guardians/${guardianId}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [guardian, deepLinkEdit, editDeepLinkHandled, guardianId, router, searchParams]);

  function openEdit() {
    if (!guardian) return;
    setProfileForm(toProfileForm(guardian));
    setEditing(true);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || saving) return;

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!isValidEmail(profileForm.email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (profileForm.phone.trim() && !isValidPhone(profileForm.phone)) {
      toast.error("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          phone: profileForm.phone,
          otherInformation: profileForm.otherInformation,
          addressLine1: profileForm.addressLine1,
          addressLine2: profileForm.addressLine2,
          city: profileForm.city,
          state: profileForm.state,
          postalCode: profileForm.postalCode,
          relationshipRole: profileForm.relationshipRole || null,
          isBillingOwner: profileForm.isBillingOwner,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to save guardian.");
        return;
      }
      setGuardian(data.guardian as StaffGuardianDetail);
      setEditing(false);
      setProfileForm(null);
      toast.success("Guardian updated.");
    } catch {
      toast.error("Unable to save guardian.");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim() || savingNotes) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        toast.error(data.error || "Unable to add note.");
        return;
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
      setNoteDraft("");
      toast.success("Note added.");
    } catch {
      toast.error("Unable to add note.");
    } finally {
      setSavingNotes(false);
    }
  }

  function startEditNote(note: StaffGuardianNote) {
    setEditingNoteId(note.id);
    setNoteEditDraft(note.body);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setNoteEditDraft("");
  }

  async function saveNoteEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingNoteId || !noteEditDraft.trim() || savingNoteEdit) return;
    setSavingNoteEdit(true);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteEditDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        toast.error(data.error || "Unable to update note.");
        return;
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
      setEditingNoteId(null);
      setNoteEditDraft("");
      toast.success("Note updated.");
    } catch {
      toast.error("Unable to update note.");
    } finally {
      setSavingNoteEdit(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (deletingNoteId) return;
    setDeletingNoteId(noteId);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to delete note.");
        return;
      }
      setGuardian((prev) =>
        prev
          ? {
              ...prev,
              notes: prev.notes.filter((note) => note.id !== noteId),
            }
          : prev,
      );
      if (editingNoteId === noteId) cancelEditNote();
      setConfirmDeleteNoteId(null);
      toast.success("Note moved to Recycle bin.");
    } catch {
      toast.error("Unable to delete note.");
    } finally {
      setDeletingNoteId(null);
    }
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
  const statusKey = guardian.invitePending
    ? "invite_pending"
    : guardian.linked
      ? "linked"
      : "unlinked";

  const takenRoles = new Set(
    guardian.householdGuardians
      .map((row) => row.relationshipRole)
      .filter((role): role is GuardianRelationshipRole => role === "parent_1" || role === "parent_2"),
  );
  if (guardian.relationshipRole) takenRoles.delete(guardian.relationshipRole);

  const addressLines = formatMailingAddressLines(guardian);
  const previewNotes = guardian.notes.slice(0, PREVIEW_LIMIT);
  const previewStudents = guardian.students.slice(0, PREVIEW_LIMIT);
  const editingNote = editingNoteId
    ? guardian.notes.find((note) => note.id === editingNoteId) ?? null
    : null;
  const showStudents = guardian.isBillingOwner;
  const householdId = guardian.household?.id ?? null;

  function studentActions(s: StaffGuardianStudentRow): StaffRowAction[] {
    const actions = lifecycleActions({
      isArchived: s.lifecycle === "archived",
      canDelete: Boolean(s.canDelete),
      busy: studentBusyId === s.id || memberBusyId === s.id,
      onEdit: () => router.push(`/staff/students/${s.id}?edit=1`),
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

  function renderNotesTable(notes: StaffGuardianNote[]) {
    return (
      <div className="family-notes-table-wrap">
        <table className="family-notes-table">
          <thead>
            <tr>
              <th className="family-notes-col-content">Note</th>
              <th className="family-notes-col-who">Created By</th>
              <th className="family-notes-col-when">Created Time</th>
              <th className="family-notes-col-edit" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr
                key={note.id}
                className="family-notes-row-clickable"
                tabIndex={0}
                role="button"
                aria-label="Edit note"
                onClick={() => startEditNote(note)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    startEditNote(note);
                  }
                }}
              >
                <td className="family-notes-col-content">
                  <span className="family-notes-body">{note.body}</span>
                </td>
                <td className="family-notes-col-who">{note.authorDisplayName}</td>
                <td className="family-notes-col-when">{formatWhen(note.createdAt)}</td>
                <td className="family-notes-col-edit">
                  <div className="family-notes-action-group" onClick={(event) => event.stopPropagation()}>
                    <StaffIconButton
                      label="Edit"
                      title="Edit"
                      tone="muted"
                      className="family-notes-edit-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditNote(note);
                      }}
                    >
                      <IconPencil size={14} />
                    </StaffIconButton>
                    <StaffIconButton
                      label="Delete"
                      title="Delete"
                      tone="danger"
                      className="family-notes-edit-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDeleteNoteId(note.id);
                      }}
                    >
                      <IconTrash size={14} />
                    </StaffIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />

      <div className="family-detail-topbar">
        <Link href={backHref} className="page-back">
          {backLabel}
        </Link>
        <div className="family-detail-topbar-actions">
          <StaffIconButton label="Edit" title="Edit" tone="edit" onClick={openEdit}>
            <IconPencil size={15} />
          </StaffIconButton>
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

      {editing && profileForm ? (
        <Panel title="Edit guardian" className="family-equal-panel">
          <form onSubmit={(e) => void saveProfile(e)} className="input-grid family-household-edit-grid">
            <label>
              First name
              <input
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Other information
              <textarea
                value={profileForm.otherInformation}
                onChange={(e) => setProfileForm({ ...profileForm, otherInformation: e.target.value })}
                rows={3}
                placeholder="Optional context about this guardian…"
              />
            </label>
            <label>
              Street
              <input
                value={profileForm.addressLine1}
                onChange={(e) => setProfileForm({ ...profileForm, addressLine1: e.target.value })}
              />
            </label>
            <label>
              Address line 2
              <input
                value={profileForm.addressLine2}
                onChange={(e) => setProfileForm({ ...profileForm, addressLine2: e.target.value })}
              />
            </label>
            <label>
              City
              <input
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              />
            </label>
            <label>
              State
              <input
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
              />
            </label>
            <label>
              ZIP
              <input
                value={profileForm.postalCode}
                onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
              />
            </label>
            <label>
              Country
              <input value="United States" disabled readOnly />
            </label>
            <label>
              Parent role
              <select
                value={profileForm.relationshipRole}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    relationshipRole: e.target.value as ProfileForm["relationshipRole"],
                  })
                }
                disabled={!guardian.household}
              >
                <option value="">{guardian.household ? "Unset" : "Assign to a family first"}</option>
                <option value="parent_1" disabled={takenRoles.has("parent_1")}>
                  Parent 1{takenRoles.has("parent_1") ? " (taken)" : ""}
                </option>
                <option value="parent_2" disabled={takenRoles.has("parent_2")}>
                  Parent 2{takenRoles.has("parent_2") ? " (taken)" : ""}
                </option>
              </select>
            </label>
            <label>
              Responsible for payment
              <select
                value={profileForm.isBillingOwner ? "yes" : "no"}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, isBillingOwner: e.target.value === "yes" })
                }
                disabled={!guardian.household}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            {!guardian.household ? (
              <p className="family-empty" style={{ gridColumn: "1 / -1", margin: 0 }}>
                Assign this guardian to a family before setting Parent role or payment responsibility.
              </p>
            ) : guardian.isBillingOwner && !profileForm.isBillingOwner ? (
              <p className="family-empty" style={{ gridColumn: "1 / -1", margin: 0 }}>
                To remove payment responsibility, set another household guardian as payer on the Family
                page first.
              </p>
            ) : null}
            <div className="family-household-edit-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving…" : "Save guardian"}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setProfileForm(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

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
              <div className="family-household-lower">
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
                <span>
                  <small>Other information</small>
                  <strong style={{ whiteSpace: "pre-wrap" }}>
                    {guardian.otherInformation || "—"}
                  </strong>
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
                  <strong>{roleLabel || "—"}</strong>
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

      <div className="family-notes-layout">
        <Panel className="family-notes-panel family-equal-panel">
          <div className="family-panel-heading">
            <h2>Add note</h2>
          </div>
          <div className="family-add-note-stretch">
            <p className="family-add-note-helper">Internal only — not visible in the family portal.</p>
            <form onSubmit={(e) => void addNote(e)}>
              <label className="family-add-note-label">
                <span className="sr-only">Note</span>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={4}
                  placeholder="Add a staff note…"
                />
              </label>
              <div className="family-add-note-footer">
                <button
                  type="submit"
                  className="primary-button family-add-note-btn"
                  disabled={savingNotes || !noteDraft.trim()}
                >
                  {savingNotes ? "Adding…" : "Add note"}
                </button>
              </div>
            </form>
          </div>
        </Panel>

        <Panel className="family-notes-panel family-equal-panel">
          <div className="family-panel-heading">
            <h2>Notes</h2>
          </div>
          <NotesListPreview
            total={guardian.notes.length}
            empty={<p className="family-empty">No notes yet.</p>}
            onViewMore={() => setNotesModalOpen(true)}
          >
            {renderNotesTable(previewNotes)}
          </NotesListPreview>
        </Panel>
      </div>

      {studentsModalOpen ? (
        <NotesListModal title="Students" onClose={() => setStudentsModalOpen(false)}>
          {renderStudentsTable(guardian.students)}
        </NotesListModal>
      ) : null}

      {notesModalOpen ? (
        <NotesListModal
          title="Notes"
          className="family-notes-list-modal"
          onClose={() => setNotesModalOpen(false)}
        >
          {renderNotesTable(guardian.notes)}
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

      {editingNoteId ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirmDeleteNoteId) cancelEditNote();
          }}
        >
          <div
            className="staff-modal family-note-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-note-edit-title"
          >
            <div className="family-list-modal-header">
              <h3 id="guardian-note-edit-title">Edit note</h3>
              <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={cancelEditNote}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <dl className="family-note-edit-meta">
              <div>
                <dt>Created By</dt>
                <dd>{editingNote?.authorDisplayName || "—"}</dd>
              </div>
              <div>
                <dt>Created Time</dt>
                <dd>{formatWhen(editingNote?.createdAt)}</dd>
              </div>
              <div>
                <dt>Edited By</dt>
                <dd>{editingNote?.editorDisplayName || "—"}</dd>
              </div>
              <div>
                <dt>Edited Time</dt>
                <dd>{formatWhen(editingNote?.updatedAt)}</dd>
              </div>
            </dl>
            <form onSubmit={(e) => void saveNoteEdit(e)} className="staff-modal-form family-note-edit-form">
              <label className="family-note-edit-field">
                Note
                <textarea
                  value={noteEditDraft}
                  onChange={(event) => setNoteEditDraft(event.target.value)}
                  rows={5}
                  autoFocus
                />
              </label>
              <div className="staff-modal-actions">
                <button
                  type="button"
                  className="danger-button"
                  disabled={!!deletingNoteId}
                  onClick={() => {
                    if (editingNoteId) setConfirmDeleteNoteId(editingNoteId);
                  }}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="action-btn action-btn-edit"
                  disabled={savingNoteEdit || !noteEditDraft.trim()}
                >
                  {savingNoteEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmDeleteNoteId ? (
        <ConfirmActionModal
          title="Delete this note?"
          body="The note moves to Settings → Recycle bin for 30 days, then is permanently removed."
          confirmLabel="Delete"
          destructive
          busy={deletingNoteId === confirmDeleteNoteId}
          onCancel={() => {
            if (!deletingNoteId) setConfirmDeleteNoteId(null);
          }}
          onConfirm={() => void deleteNote(confirmDeleteNoteId)}
        />
      ) : null}
    </>
  );
}
