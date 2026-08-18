"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  IconTrash,
  IconUserPlus,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { StaffRowActions, lifecycleActions, type StaffRowAction } from "@/components/staff-row-actions";
import { StaffCreateEnrollmentModal } from "@/components/staff-create-enrollment-modal";
import { StaffNotesSection } from "@/components/staff-notes-section";
import {
  STAFF_RECORD_INFO_CARD_CLASS,
  StaffRecordIntegrationsCard,
  StaffRecordPrimaryRow,
} from "@/components/staff-record-integrations-card";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { GuardianRelationshipRolePill } from "@/components/guardian-relationship-role-pill";
import { StaffDetailField, StaffDetailFieldGroup } from "@/components/staff-detail-fields";
import { formatStaffDate } from "@/lib/ui/datetime";
import { formatGradeLabelDisplay } from "@/lib/ui/grade";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { formatSubjectsPreview } from "@/lib/ui/subjects-preview";

type NoteRow = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  relationshipRole: "parent_1" | "parent_2" | null;
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  invitePending: boolean;
  invitePath: string | null;
  linked: boolean;
};

type StudentRow = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  schoolName: string | null;
  lifecycle: string;
  subjects?: Array<{ id: string; name: string; code: string }>;
  canDelete: boolean;
};

type FamilyDetail = {
  id: string;
  displayName: string;
  displayNameManual: boolean;
  status: string;
  primaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  zohoCrmId: string | null;
  zohoCrmUrl: string | null;
  stripeCustomerId?: string | null;
  stripeDefaultPaymentMethodId?: string | null;
  billingOwnerGuardianId: string | null;
  billingOwnerName: string | null;
  billingOwnerPhone: string | null;
  billingEmail: string | null;
  cardOnFile: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  autoCharge: boolean;
  canDelete: boolean;
  maxGuardians: number;
  notes: NoteRow[];
  guardians: GuardianRow[];
  students: StudentRow[];
  activity: {
    bookings: Array<{
      id: string;
      status: string;
      studentName: string;
      tutorName: string;
      createdAt: string;
    }>;
    enrollments: Array<{
      id: string;
      status: string;
      studentName: string;
      courseName: string;
      createdAt: string;
    }>;
  };
};

type AssignGuardianOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  householdDisplayName: string;
};

type AssignStudentOption = {
  id: string;
  displayName: string;
  gradeLabel: string | null;
  householdDisplayName: string;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "F"
  );
}

function formatDate(value: string) {
  return formatStaffDate(value);
}

/** Quiet badge only for non-default portal states (Clerk link itself is not shown). */
function guardianPortalBadge(g: GuardianRow) {
  if (g.invitePending) return "Invite pending";
  return null;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

/** Soft-hide Notes UI on Family / Guardian / Student detail (backend + recycle-bin kept). */
const SHOW_STAFF_NOTES = false;

const PREVIEW_LIMIT = 3;
const MAX_GUARDIANS = 2;

type FamilyListModalKind = "guardians" | "students" | "enrollments" | "bookings";
type AssignModalKind = "guardians" | "students" | null;
type SectionMenuKind = "guardians" | "students" | null;
type HouseholdLifecycleConfirm = "archive" | "restore" | "delete";

function formatHouseholdAddressLines(family: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}): string[] {
  // Country is always US — omit from summary card.
  const hasLocalAddress = Boolean(
    family.addressLine1 ||
      family.addressLine2 ||
      family.city ||
      family.state ||
      family.postalCode,
  );
  if (!hasLocalAddress) return [];

  const lines: string[] = [];
  const line1 = (family.addressLine1 || "").trim();
  const line2 = (family.addressLine2 || "").trim();
  // Max 2 address lines on the card: street (line1 + optional line2), then City, ST ZIP.
  if (line1 && line2) {
    lines.push(`${line1}, ${line2}`);
  } else if (line1 || line2) {
    lines.push(line1 || line2);
  }

  const city = (family.city || "").trim();
  const state = (family.state || "").trim();
  const postal = (family.postalCode || "").trim();
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

function FamilyListPreview({
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

function FamilyListModal({
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

export function StaffFamilyDetailClient({ familyId }: { familyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const toastError = toast.error;
  const deepLinkedGuardianId = searchParams.get("guardianId");
  const deepLinkEdit = searchParams.get("edit") === "1";
  const deepLinkHandled = useRef<string | null>(null);
  const editDeepLinkHandled = useRef(false);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [studentBusyId, setStudentBusyId] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [listModal, setListModal] = useState<FamilyListModalKind | null>(null);
  const [sectionMenu, setSectionMenu] = useState<SectionMenuKind>(null);
  const [assignModal, setAssignModal] = useState<AssignModalKind>(null);
  const [assignQuery, setAssignQuery] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignGuardians, setAssignGuardians] = useState<AssignGuardianOption[]>([]);
  const [assignStudents, setAssignStudents] = useState<AssignStudentOption[]>([]);
  const [assignSelectedId, setAssignSelectedId] = useState<string | null>(null);
  const [assignBusyId, setAssignBusyId] = useState<string | null>(null);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<HouseholdLifecycleConfirm | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  const softReload = useCallback(async () => {
    try {
      const response = await fetch(`/api/staff/families/${familyId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toastError(data.error || "Unable to load family.");
        return;
      }
      setFamily(data.family);
    } catch {
      toastError("Unable to load family.");
    }
  }, [familyId, toastError]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load family.");
        return;
      }
      setFamily(data.family);
    } catch {
      setError("Unable to load family.");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!family || !deepLinkedGuardianId) return;
    if (deepLinkHandled.current === deepLinkedGuardianId) return;
    const match = family.guardians.find((g) => g.id === deepLinkedGuardianId);
    if (!match) return;
    deepLinkHandled.current = deepLinkedGuardianId;
    router.replace(`/staff/guardians/${match.id}?from=family`);
  }, [family, deepLinkedGuardianId, router]);

  async function refreshInvite(guardianId: string) {
    try {
      const response = await fetch(`/api/staff/families/${familyId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to refresh invite.");
        return;
      }
      const inviteLink = `${window.location.origin}${data.invitePath}`;
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied.");
      } catch {
        // Keep invite URLs on-screen until dismissed — auto-dismiss would lose the link.
        toast.info(`Invite link: ${inviteLink}`, { durationMs: 0 });
      }
      await softReload();
    } catch {
      toast.error("Unable to refresh invite.");
    }
  }

  async function createFamilyNote(body: string): Promise<NoteRow> {
    const response = await fetch(`/api/staff/families/${familyId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.note) {
      throw new Error(data.error || "Unable to add note.");
    }
    const nextNote = data.note as NoteRow;
    setFamily((prev) =>
      prev
        ? {
            ...prev,
            notes: [nextNote, ...prev.notes],
          }
        : prev,
    );
    return nextNote;
  }

  async function updateFamilyNote(noteId: string, body: string): Promise<NoteRow> {
    const response = await fetch(`/api/staff/families/${familyId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.note) {
      throw new Error(data.error || "Unable to update note.");
    }
    const nextNote = data.note as NoteRow;
    setFamily((prev) =>
      prev
        ? {
            ...prev,
            notes: prev.notes.map((note) => (note.id === nextNote.id ? nextNote : note)),
          }
        : prev,
    );
    return nextNote;
  }

  async function deleteFamilyNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/staff/families/${familyId}/notes/${noteId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Unable to delete note.");
    }
    setFamily((prev) =>
      prev
        ? {
            ...prev,
            notes: prev.notes.filter((note) => note.id !== noteId),
          }
        : prev,
    );
  }

  useEffect(() => {
    if (!deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    router.replace(`/staff/families/${familyId}/edit`);
  }, [deepLinkEdit, familyId, router]);

  function openGuardianDetail(guardian: GuardianRow) {
    setListModal(null);
    router.push(`/staff/guardians/${guardian.id}?from=family`);
  }

  async function setStatus(status: "active" | "archived", options?: { fromUndo?: boolean }) {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);

    try {
      const response = await fetch(`/api/staff/families/${familyId}`, {
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
      const message = status === "archived" ? "Family archived." : "Family restored.";
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

  async function deleteFamily() {
    if (!family?.canDelete || lifecycleBusy) return;
    setLifecycleBusy(true);

    try {
      const response = await fetch(`/api/staff/families/${familyId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to delete family.");
        return;
      }
      setLifecycleConfirm(null);
      router.push("/staff/families");
    } catch {
      toast.error("Unable to delete family.");
    } finally {
      setLifecycleBusy(false);
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

  async function unassignGuardian(guardianId: string) {
    if (memberBusyId) return;
    if (
      !window.confirm(
        "Unassign this guardian from the family? They become an orphan until reassigned (not deleted).",
      )
    ) {
      return;
    }
    setMemberBusyId(guardianId);

    try {
      const response = await fetch(`/api/staff/families/${familyId}/guardians/${guardianId}/unassign`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to unassign guardian.");
        return;
      }
      toast.success("Guardian unassigned.");
      await softReload();
    } catch {
      toast.error("Unable to unassign guardian.");
    } finally {
      setMemberBusyId(null);
    }
  }

  async function unassignStudent(studentId: string) {
    if (memberBusyId) return;
    if (
      !window.confirm(
        "Unassign this student from the family? They become an orphan until reassigned. Historical bookings stay on this family.",
      )
    ) {
      return;
    }
    setMemberBusyId(studentId);

    try {
      const response = await fetch(`/api/staff/families/${familyId}/students/${studentId}/unassign`, {
        method: "POST",
      });
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

  function closeAssignModal() {
    setAssignModal(null);
    setAssignQuery("");
    setAssignSelectedId(null);
    setAssignGuardians([]);
    setAssignStudents([]);
    setAssignBusyId(null);
  }

  async function openAssignModal(kind: "guardians" | "students") {
    setAssignModal(kind);
    setAssignQuery("");
    setAssignSelectedId(null);
    setAssignGuardians([]);
    setAssignStudents([]);
    setSectionMenu(null);
    setAssignLoading(true);

    try {
      const path =
        kind === "guardians"
          ? `/api/staff/families/${familyId}/guardians/assign`
          : `/api/staff/families/${familyId}/students/assign`;
      const response = await fetch(path);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to load assign options.");
        return;
      }
      if (kind === "guardians") setAssignGuardians(data.guardians ?? []);
      else setAssignStudents(data.students ?? []);
    } catch {
      toast.error("Unable to load assign options.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function searchAssign(kind: "guardians" | "students", q: string) {
    setAssignQuery(q);
    setAssignSelectedId(null);
    setAssignLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const path =
        kind === "guardians"
          ? `/api/staff/families/${familyId}/guardians/assign?${params}`
          : `/api/staff/families/${familyId}/students/assign?${params}`;
      const response = await fetch(path);
      const data = await response.json();
      if (!response.ok || !data.ok) return;
      if (kind === "guardians") setAssignGuardians(data.guardians ?? []);
      else setAssignStudents(data.students ?? []);
    } finally {
      setAssignLoading(false);
    }
  }

  async function confirmAssign() {
    if (!assignModal || !assignSelectedId || assignBusyId) return;
    if (assignModal === "guardians") await assignGuardian(assignSelectedId);
    else await assignStudent(assignSelectedId);
  }

  async function assignGuardian(guardianId: string) {
    if (assignBusyId) return;
    setAssignBusyId(guardianId);

    try {
      const response = await fetch(`/api/staff/families/${familyId}/guardians/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to assign guardian.");
        return;
      }
      closeAssignModal();
      toast.success("Guardian assigned.");
      await softReload();
    } catch {
      toast.error("Unable to assign guardian.");
    } finally {
      setAssignBusyId(null);
    }
  }

  async function assignStudent(studentId: string) {
    if (assignBusyId) return;
    setAssignBusyId(studentId);

    try {
      const response = await fetch(`/api/staff/families/${familyId}/students/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to assign student.");
        return;
      }
      closeAssignModal();
      toast.success("Student assigned.");
      await softReload();
    } catch {
      toast.error("Unable to assign student.");
    } finally {
      setAssignBusyId(null);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading family…</p>;
  if (error && !family) return <p className="form-error">{error}</p>;
  if (!family) return null;

  const addressLines = formatHouseholdAddressLines(family);
  const cardLabel = family.cardLast4
    ? `${(family.cardBrand || "Card").toUpperCase()} ···· ${family.cardLast4}`
    : family.cardOnFile
      ? "Yes"
      : "No";
  const billingOwner = family.billingOwnerGuardianId
    ? family.guardians.find((g) => g.id === family.billingOwnerGuardianId) ?? null
    : null;
  const isArchived = family.status === "archived";
  const guardiansAtMax = family.guardians.length >= (family.maxGuardians || MAX_GUARDIANS);

  const previewGuardians = family.guardians.slice(0, PREVIEW_LIMIT);
  const previewStudents = family.students.slice(0, PREVIEW_LIMIT);
  const previewEnrollments = family.activity.enrollments.slice(0, PREVIEW_LIMIT);
  const previewBookings = family.activity.bookings.slice(0, PREVIEW_LIMIT);

  const householdLifecycleButtons = (() => {
    const buttons: Array<{
      id: string;
      label: string;
      tone: "archive" | "restore" | "danger";
      onClick: () => void;
      icon: "archive" | "restore" | "delete";
    }> = [];
    if (isArchived) {
      buttons.push({
        id: "restore",
        label: "Restore",
        tone: "restore",
        onClick: () => setLifecycleConfirm("restore"),
        icon: "restore",
      });
    } else {
      buttons.push({
        id: "archive",
        label: "Archive",
        tone: "archive",
        onClick: () => setLifecycleConfirm("archive"),
        icon: "archive",
      });
    }
    if (family.canDelete) {
      buttons.push({
        id: "delete",
        label: "Delete",
        tone: "danger",
        onClick: () => setLifecycleConfirm("delete"),
        icon: "delete",
      });
    }
    return buttons;
  })();

  const lifecycleConfirmCopy: Record<
    HouseholdLifecycleConfirm,
    { title: string; body: string; confirmLabel: string; destructive?: boolean }
  > = {
    archive: {
      title: "Archive this household?",
      body: "Archived households are hidden from the default Families list. You can restore them later.",
      confirmLabel: "Archive",
    },
    restore: {
      title: "Restore this household?",
      body: "This household will appear as active again in the Families list.",
      confirmLabel: "Restore",
    },
    delete: {
      title: "Delete this household?",
      body: "Permanently delete this empty household? This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    },
  };

  function guardianActions(g: GuardianRow): StaffRowAction[] {
    const actions: StaffRowAction[] = [
      {
        id: "edit",
        label: "Edit",
        tone: "edit",
        onSelect: () => openGuardianDetail(g),
      },
      {
        id: "unassign",
        label: "Unassign",
        tone: "unassign",
        disabled: memberBusyId === g.id,
        onSelect: () => void unassignGuardian(g.id),
      },
    ];
    if (!g.linked) {
      actions.push({
        id: "invite",
        label: g.invitePath ? "Regenerate invite" : "Send invite",
        onSelect: () => void refreshInvite(g.id),
      });
    }
    return actions;
  }

  function studentActions(s: StudentRow): StaffRowAction[] {
    const actions = lifecycleActions({
      isArchived: s.lifecycle === "archived",
      canDelete: Boolean(s.canDelete),
      busy: studentBusyId === s.id || memberBusyId === s.id,
      onEdit: () => router.push(`/staff/students/${s.id}/edit`),
      onArchive: () => void setStudentLifecycle(s.id, "archived"),
      onRestore: () => void setStudentLifecycle(s.id, "active"),
      onDelete: () => void deleteStudent(s.id),
    });
    actions.splice(1, 0, {
      id: "unassign",
      label: "Unassign",
      tone: "unassign",
      disabled: memberBusyId === s.id,
      onSelect: () => void unassignStudent(s.id),
    });
    return actions;
  }

  function renderGuardiansTable(rows: GuardianRow[]) {
    return (
      <div className="table-panel staff-dir-table family-detail-table">
        <div className="table-head family-detail-cols-guardians">
          <span>Name</span>
          <span>Parent role</span>
          <span>Email</span>
          <span className="family-detail-col-flag">Payer</span>
          <span className="staff-dir-col-actions" aria-label="Actions" />
        </div>
        {rows.map((g) => {
          const portalBadge = guardianPortalBadge(g);
          return (
          <div
            key={g.id}
            className="table-row family-detail-cols-guardians family-detail-table-row family-detail-row-clickable"
            role="link"
            tabIndex={0}
            aria-label={`Open guardian ${g.firstName} ${g.lastName}`}
            onClick={() => openGuardianDetail(g)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openGuardianDetail(g);
              }
            }}
          >
            <span>
              <strong>
                {g.firstName} {g.lastName}
              </strong>
              {portalBadge ? (
                <small className="family-guardian-link-status">{portalBadge}</small>
              ) : null}
              {!g.linked ? (
                <button
                  type="button"
                  className="family-send-invite"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void refreshInvite(g.id);
                  }}
                >
                  {g.invitePath ? "Regenerate invite" : "Send invite"}
                </button>
              ) : null}
            </span>
            <span>
              <GuardianRelationshipRolePill role={g.relationshipRole} />
            </span>
            <span>{g.email}</span>
            <span className="family-detail-col-flag">{yesNo(g.isBillingOwner)}</span>
            <span className="staff-dir-col-actions">
              <StaffRowActions label="Guardian actions" actions={guardianActions(g)} />
            </span>
          </div>
          );
        })}
      </div>
    );
  }

  function renderStudentsTable(rows: StudentRow[]) {
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
            <span>{formatGradeLabelDisplay(s.gradeLabel)}</span>
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

  function renderEnrollmentRow(row: FamilyDetail["activity"]["enrollments"][number]) {
    const href = `/staff/families/${familyId}/enrollments/${row.id}`;
    return (
      <div
        key={row.id}
        className="staff-detail-list-row staff-detail-list-row-clickable"
        role="link"
        tabIndex={0}
        aria-label={`Open enrollment ${row.studentName} ${row.courseName}`}
        onClick={() => router.push(href)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(href);
          }
        }}
      >
        <span>
          <strong>
            {row.studentName} · {row.courseName}
          </strong>
          <small>
            {formatStatusLabel(row.status)} · {formatDate(row.createdAt)}
          </small>
        </span>
        <Link
          href={href}
          className="secondary-button staff-open-control"
          onClick={(event) => event.stopPropagation()}
        >
          Open
        </Link>
      </div>
    );
  }

  function renderBookingRow(row: FamilyDetail["activity"]["bookings"][number]) {
    const href = `/staff/families/${familyId}/bookings/${row.id}`;
    return (
      <div
        key={row.id}
        className="staff-detail-list-row staff-detail-list-row-clickable"
        role="link"
        tabIndex={0}
        aria-label={`Open booking ${row.studentName} ${row.tutorName}`}
        onClick={() => router.push(href)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(href);
          }
        }}
      >
        <span>
          <strong>
            {row.studentName} · {row.tutorName}
          </strong>
          <small>
            {formatStatusLabel(row.status)} · {formatDate(row.createdAt)}
          </small>
        </span>
        <Link
          href={href}
          className="secondary-button staff-open-control"
          onClick={(event) => event.stopPropagation()}
        >
          Open
        </Link>
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
          destructive={lifecycleConfirmCopy[lifecycleConfirm].destructive}
          busy={lifecycleBusy}
          onCancel={() => {
            if (!lifecycleBusy) setLifecycleConfirm(null);
          }}
          onConfirm={() => {
            if (lifecycleConfirm === "archive") void setStatus("archived");
            else if (lifecycleConfirm === "restore") void setStatus("active");
            else void deleteFamily();
          }}
        />
      ) : null}

      <div className="family-detail-topbar">
        <Link href="/staff/families" className="page-back">
          ← Families
        </Link>
        <div className="family-detail-topbar-actions">
          <Link
            href={`/staff/families/${familyId}/edit`}
            className="staff-icon-btn staff-icon-btn-edit"
            aria-label="Edit"
            title="Edit"
          >
            <IconPencil size={15} />
          </Link>
          {householdLifecycleButtons.map((action) => (
            <StaffIconButton
              key={action.id}
              label={action.label}
              title={action.label}
              tone={action.tone}
              disabled={lifecycleBusy}
              onClick={action.onClick}
            >
              {action.icon === "archive" ? (
                <IconArchive size={15} />
              ) : action.icon === "restore" ? (
                <IconRestore size={15} />
              ) : (
                <IconTrash size={15} />
              )}
            </StaffIconButton>
          ))}
        </div>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(family.displayName)}</span>
        <div className="family-record-hero-copy">
          <h2>{family.displayName}</h2>
        </div>
        <span className={`pill family-record-hero-status-pill ${statusTone(family.status)}`}>
          {formatStatusLabel(family.status)}
        </span>
      </section>

      <StaffRecordPrimaryRow>
        <Panel className={STAFF_RECORD_INFO_CARD_CLASS}>
          <div className="family-panel-heading">
            <h2>Household</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense">
              <StaffDetailFieldGroup className="family-household-upper">
                <StaffDetailField label="Phone" className="family-household-field-phone">
                  {family.primaryPhone}
                </StaffDetailField>
                <StaffDetailField label="Responsible for payment" className="family-household-field-payer">
                  {billingOwner && family.billingOwnerName ? (
                    <button
                      type="button"
                      className="family-household-payer-link"
                      onClick={() => openGuardianDetail(billingOwner)}
                    >
                      {family.billingOwnerName}
                    </button>
                  ) : family.billingOwnerName ? (
                    family.billingOwnerName
                  ) : null}
                </StaffDetailField>
                <StaffDetailField label="Card on file" className="family-household-field-card">
                  {cardLabel}
                </StaffDetailField>
                <StaffDetailField label="Auto-charge" className="family-household-field-autocharge">
                  {yesNo(family.autoCharge)}
                </StaffDetailField>
              </StaffDetailFieldGroup>
              <StaffDetailFieldGroup className="family-household-lower">
                <StaffDetailField label="Billing address" className="family-household-field-address">
                  {addressLines.length ? (
                    <div className="family-household-address-lines">
                      {addressLines.map((line, index) => (
                        <span key={`${index}-${line}`}>{line}</span>
                      ))}
                    </div>
                  ) : null}
                </StaffDetailField>
              </StaffDetailFieldGroup>
            </div>
          </div>
        </Panel>

        <StaffRecordIntegrationsCard
          zohoId={family.zohoCrmId}
          zohoUrl={family.zohoCrmUrl}
          stripeCustomerId={family.stripeCustomerId ?? null}
          stripePaymentMethodId={family.stripeDefaultPaymentMethodId ?? null}
          supports={{ stripe: true }}
        />
      </StaffRecordPrimaryRow>

      <div className="family-detail-layout family-detail-stack">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Guardians</h2>
            <SectionPlusMenu
              open={sectionMenu === "guardians"}
              onToggle={() => setSectionMenu((v) => (v === "guardians" ? null : "guardians"))}
              onClose={() => setSectionMenu(null)}
              disabled={guardiansAtMax}
              disabledReason={`Max ${MAX_GUARDIANS} guardians — unassign one to add or assign.`}
              items={[
                {
                  id: "add-new",
                  label: "Add new",
                  icon: <IconUserPlus size={14} />,
                  onSelect: () =>
                    router.push(`/staff/families?newGuardian=1&householdId=${encodeURIComponent(familyId)}`),
                },
                {
                  id: "assign",
                  label: "Assign existing",
                  icon: <IconLink size={14} />,
                  onSelect: () => void openAssignModal("guardians"),
                },
              ]}
            />
          </div>
          <FamilyListPreview
            total={family.guardians.length}
            empty={<p className="family-empty">No guardians yet.</p>}
            onViewMore={() => setListModal("guardians")}
          >
            {renderGuardiansTable(previewGuardians)}
          </FamilyListPreview>
        </Panel>

        <Panel className="family-equal-panel family-students-band">
          <div className="family-panel-heading">
            <h2>Students</h2>
            <SectionPlusMenu
              open={sectionMenu === "students"}
              onToggle={() => setSectionMenu((v) => (v === "students" ? null : "students"))}
              onClose={() => setSectionMenu(null)}
              items={[
                {
                  id: "add-new",
                  label: "Add new",
                  icon: <IconUserPlus size={14} />,
                  onSelect: () =>
                    router.push(`/staff/students?new=1&householdId=${encodeURIComponent(familyId)}`),
                },
                {
                  id: "assign",
                  label: "Assign existing",
                  icon: <IconLink size={14} />,
                  onSelect: () => void openAssignModal("students"),
                },
              ]}
            />
          </div>
          <FamilyListPreview
            total={family.students.length}
            empty={<p className="family-empty">No students yet.</p>}
            onViewMore={() => setListModal("students")}
          >
            {renderStudentsTable(previewStudents)}
          </FamilyListPreview>
        </Panel>
      </div>

      <div className="family-activity-band staff-equal-cards">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Course enrollments</h2>
            <div className="family-section-plus">
              <StaffIconButton
                label="Add"
                title={
                  family.students.length === 0
                    ? "Add a student before creating an enrollment."
                    : "Add"
                }
                disabled={family.students.length === 0}
                onClick={() => setEnrollModalOpen(true)}
              >
                <IconPlus size={16} />
              </StaffIconButton>
            </div>
          </div>
          <FamilyListPreview
            total={family.activity.enrollments.length}
            empty={<p className="family-empty">No course enrollments yet.</p>}
            onViewMore={() => setListModal("enrollments")}
          >
            <div className="staff-detail-list">{previewEnrollments.map(renderEnrollmentRow)}</div>
          </FamilyListPreview>
        </Panel>
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Bookings</h2>
          </div>
          <FamilyListPreview
            total={family.activity.bookings.length}
            empty={<p className="family-empty">No tutoring bookings yet.</p>}
            onViewMore={() => setListModal("bookings")}
          >
            <div className="staff-detail-list">{previewBookings.map(renderBookingRow)}</div>
          </FamilyListPreview>
        </Panel>
      </div>

      {SHOW_STAFF_NOTES ? (
        <StaffNotesSection
          notes={family.notes}
          onCreate={createFamilyNote}
          onUpdate={updateFamilyNote}
          onDelete={deleteFamilyNote}
          onSuccess={toast.success}
          onError={toast.error}
        />
      ) : null}

      {listModal === "guardians" ? (
        <FamilyListModal title="Guardians" onClose={() => setListModal(null)}>
          {renderGuardiansTable(family.guardians)}
        </FamilyListModal>
      ) : null}
      {listModal === "students" ? (
        <FamilyListModal title="Students" onClose={() => setListModal(null)}>
          {renderStudentsTable(family.students)}
        </FamilyListModal>
      ) : null}
      {listModal === "enrollments" ? (
        <FamilyListModal title="Course enrollments" onClose={() => setListModal(null)}>
          <div className="staff-detail-list">{family.activity.enrollments.map(renderEnrollmentRow)}</div>
        </FamilyListModal>
      ) : null}
      {listModal === "bookings" ? (
        <FamilyListModal title="Bookings" onClose={() => setListModal(null)}>
          <div className="staff-detail-list">{family.activity.bookings.map(renderBookingRow)}</div>
        </FamilyListModal>
      ) : null}

      {enrollModalOpen ? (
        <StaffCreateEnrollmentModal
          householdId={familyId}
          students={family.students.map((s) => ({ id: s.id, displayName: s.displayName }))}
          onClose={() => setEnrollModalOpen(false)}
          onCreated={async () => {
            setEnrollModalOpen(false);
            toast.success("Enrollment added.");
            await softReload();
          }}
        />
      ) : null}

      {assignModal ? (
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
            aria-labelledby="family-assign-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closeAssignModal();
            }}
          >
            <div className="family-list-modal-header">
              <h3 id="family-assign-title">
                {assignModal === "guardians" ? "Assign guardian" : "Assign student"}
              </h3>
              <StaffIconButton label="Close" title="Close" tone="muted" onClick={closeAssignModal}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <div className="family-assign-modal-body">
              <label className="family-assign-search">
                Search
                <input
                  value={assignQuery}
                  onChange={(e) => void searchAssign(assignModal, e.target.value)}
                  placeholder={
                    assignModal === "guardians" ? "Name or email…" : "Student name…"
                  }
                  autoFocus
                />
              </label>
              {assignLoading ? <p className="family-empty">Loading…</p> : null}
              {!assignLoading && assignModal === "guardians" ? (
                assignGuardians.length === 0 ? (
                  <p className="family-empty">No available guardians to assign.</p>
                ) : (
                  <div className="family-assign-list" role="listbox" aria-label="Available guardians">
                    {assignGuardians.map((g) => {
                      const selected = assignSelectedId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`family-assign-row${selected ? " is-selected" : ""}`}
                          disabled={guardiansAtMax || !!assignBusyId}
                          onClick={() => setAssignSelectedId(g.id)}
                        >
                          <span className="family-assign-row-copy">
                            <strong>
                              {g.firstName} {g.lastName}
                            </strong>
                            <small>
                              {g.email} · {g.householdDisplayName}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : null}
              {!assignLoading && assignModal === "students" ? (
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
                              {formatGradeLabelDisplay(s.gradeLabel)} · {s.householdDisplayName}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : null}
              {guardiansAtMax && assignModal === "guardians" ? (
                <p className="family-section-plus-hint">
                  Max {MAX_GUARDIANS} guardians — unassign one before assigning another.
                </p>
              ) : null}
            </div>
            <div className="staff-modal-actions">
              <button
                type="button"
                className="action-btn action-btn-edit"
                disabled={
                  !assignSelectedId ||
                  !!assignBusyId ||
                  (assignModal === "guardians" && guardiansAtMax)
                }
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
