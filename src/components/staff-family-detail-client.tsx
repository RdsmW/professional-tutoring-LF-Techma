"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type NoteRow = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
};

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
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
  billingOwnerGuardianId: string | null;
  billingOwnerName: string | null;
  billingEmail: string | null;
  cardOnFile: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
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

type HouseholdEdit = {
  displayName: string;
  primaryPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  zohoCrmId: string;
  zohoCrmUrl: string;
  billingOwnerGuardianId: string;
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

function formatWhen(value: string) {
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

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

/** Quiet badge only for non-default portal states (Clerk link itself is not shown). */
function guardianPortalBadge(g: GuardianRow) {
  if (g.invitePending) return "Invite pending";
  return null;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function zohoHref(family: FamilyDetail) {
  const url = (family.zohoCrmUrl || "").trim();
  if (url) return url;
  return null;
}

const PREVIEW_LIMIT = 3;
const MAX_GUARDIANS = 2;

type FamilyListModalKind = "guardians" | "students" | "enrollments" | "bookings" | "notes";
type AssignModalKind = "guardians" | "students" | null;
type SectionMenuKind = "guardians" | "students" | null;

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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
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
        className="staff-modal family-list-modal"
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
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [householdForm, setHouseholdForm] = useState<HouseholdEdit | null>(null);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [guardianForm, setGuardianForm] = useState<GuardianRow | null>(null);
  const [savingGuardian, setSavingGuardian] = useState(false);
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
    if (!editingGuardianId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditingGuardianId(null);
        setGuardianForm(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingGuardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!family || !deepLinkedGuardianId) return;
    if (deepLinkHandled.current === deepLinkedGuardianId) return;
    const match = family.guardians.find((g) => g.id === deepLinkedGuardianId);
    if (!match) return;
    deepLinkHandled.current = deepLinkedGuardianId;
    setGuardianForm({ ...match });
    setEditingGuardianId(match.id);
    router.replace(`/staff/families/${familyId}`, { scroll: false });
  }, [family, deepLinkedGuardianId, familyId, router]);

  function householdFormFromFamily(next: FamilyDetail): HouseholdEdit {
    return {
      displayName: next.displayName,
      primaryPhone: next.primaryPhone || "",
      addressLine1: next.addressLine1 || "",
      addressLine2: next.addressLine2 || "",
      city: next.city || "",
      state: next.state || "",
      postalCode: next.postalCode || "",
      zohoCrmId: next.zohoCrmId || "",
      zohoCrmUrl: next.zohoCrmUrl || "",
      billingOwnerGuardianId: next.billingOwnerGuardianId || "",
    };
  }

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

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim() || savingNotes) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/staff/families/${familyId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        toast.error(data.error || "Unable to add note.");
        return;
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
      setNoteDraft("");
      toast.success("Note added.");
    } catch {
      toast.error("Unable to add note.");
    } finally {
      setSavingNotes(false);
    }
  }

  function startEditNote(note: NoteRow) {
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
      const response = await fetch(`/api/staff/families/${familyId}/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteEditDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        toast.error(data.error || "Unable to update note.");
        return;
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
      setEditingNoteId(null);
      setNoteEditDraft("");
      toast.success("Note updated.");
    } catch {
      toast.error("Unable to update note.");
    } finally {
      setSavingNoteEdit(false);
    }
  }

  function openHouseholdEdit() {
    if (!family) return;
    setHouseholdForm(householdFormFromFamily(family));
    setEditingHousehold(true);
  }

  useEffect(() => {
    if (!family || !deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    setHouseholdForm(householdFormFromFamily(family));
    setEditingHousehold(true);
    router.replace(`/staff/families/${familyId}`, { scroll: false });
  }, [family, deepLinkEdit, familyId, router]);

  async function saveHousehold(event: FormEvent) {
    event.preventDefault();
    if (!householdForm || savingHousehold) return;
    if (!householdForm.displayName.trim()) {
      toast.error("Household name is required.");
      return;
    }
    if (householdForm.primaryPhone.trim() && !isValidPhone(householdForm.primaryPhone)) {
      toast.error("Enter a valid household phone number.");
      return;
    }
    setSavingHousehold(true);

    try {
      const response = await fetch(`/api/staff/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: householdForm.displayName,
          displayNameManual: true,
          primaryPhone: householdForm.primaryPhone,
          addressLine1: householdForm.addressLine1,
          addressLine2: householdForm.addressLine2,
          city: householdForm.city,
          state: householdForm.state,
          postalCode: householdForm.postalCode,
          country: "United States",
          zohoCrmId: householdForm.zohoCrmId,
          zohoCrmUrl: householdForm.zohoCrmUrl,
          billingOwnerGuardianId: householdForm.billingOwnerGuardianId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to save household.");
        return;
      }
      setEditingHousehold(false);
      toast.success("Household updated.");
      await softReload();
    } catch {
      toast.error("Unable to save household.");
    } finally {
      setSavingHousehold(false);
    }
  }

  function openGuardianEdit(guardian: GuardianRow) {
    setListModal(null);
    setGuardianForm({ ...guardian });
    setEditingGuardianId(guardian.id);
  }

  function closeGuardianEdit() {
    setEditingGuardianId(null);
    setGuardianForm(null);
  }

  async function saveGuardian(event: FormEvent) {
    event.preventDefault();
    if (!guardianForm || !editingGuardianId || savingGuardian) return;
    if (!guardianForm.firstName.trim() || !guardianForm.lastName.trim()) {
      toast.error("Guardian first and last name are required.");
      return;
    }
    if (!isValidEmail(guardianForm.email)) {
      toast.error("Enter a valid guardian email.");
      return;
    }
    if (guardianForm.phone?.trim() && !isValidPhone(guardianForm.phone)) {
      toast.error("Enter a valid guardian phone number.");
      return;
    }
    setSavingGuardian(true);

    try {
      const response = await fetch(`/api/staff/families/${familyId}/guardians/${editingGuardianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guardianForm.firstName,
          lastName: guardianForm.lastName,
          email: guardianForm.email,
          phone: guardianForm.phone,
          isBillingOwner: guardianForm.isBillingOwner,
          canManageStudents: guardianForm.canManageStudents,
          canRequestServices: guardianForm.canRequestServices,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to save guardian.");
        return;
      }
      closeGuardianEdit();
      toast.success("Guardian updated.");
      await softReload();
    } catch {
      toast.error("Unable to save guardian.");
    } finally {
      setSavingGuardian(false);
    }
  }

  async function setStatus(status: "active" | "archived") {
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
      toast.success(status === "archived" ? "Family archived." : "Family restored.");
      await softReload();
    } catch {
      toast.error("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function deleteFamily() {
    if (!family?.canDelete || lifecycleBusy) return;
    if (!window.confirm("Permanently delete this empty household? This cannot be undone.")) return;
    setLifecycleBusy(true);

    try {
      const response = await fetch(`/api/staff/families/${familyId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to delete family.");
        return;
      }
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

  const addressLine = [
    family.addressLine1,
    family.addressLine2,
    [family.city, family.state, family.postalCode].filter(Boolean).join(", "),
    family.country || "United States",
  ]
    .filter(Boolean)
    .join(" · ");
  const billingCue = family.cardLast4
    ? `${(family.cardBrand || "Card").toUpperCase()} ···· ${family.cardLast4}`
    : "No card on file";
  const isArchived = family.status === "archived";
  const guardiansAtMax = family.guardians.length >= (family.maxGuardians || MAX_GUARDIANS);
  const zohoLink = zohoHref(family);

  const previewGuardians = family.guardians.slice(0, PREVIEW_LIMIT);
  const previewStudents = family.students.slice(0, PREVIEW_LIMIT);
  const previewEnrollments = family.activity.enrollments.slice(0, PREVIEW_LIMIT);
  const previewBookings = family.activity.bookings.slice(0, PREVIEW_LIMIT);
  const previewNotes = family.notes.slice(0, PREVIEW_LIMIT);

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
        onClick: () => void setStatus("active"),
        icon: "restore",
      });
    } else {
      buttons.push({
        id: "archive",
        label: "Archive",
        tone: "archive",
        onClick: () => void setStatus("archived"),
        icon: "archive",
      });
    }
    if (family.canDelete) {
      buttons.push({
        id: "delete",
        label: "Delete",
        tone: "danger",
        onClick: () => void deleteFamily(),
        icon: "delete",
      });
    }
    return buttons;
  })();

  function guardianActions(g: GuardianRow): StaffRowAction[] {
    const actions: StaffRowAction[] = [
      {
        id: "edit",
        label: "Edit",
        tone: "edit",
        onSelect: () => openGuardianEdit(g),
      },
      {
        id: "unassign",
        label: "Unassign",
        disabled: memberBusyId === g.id,
        onSelect: () => void unassignGuardian(g.id),
      },
    ];
    if (!g.linked) {
      actions.push({
        id: "invite",
        label: g.invitePath ? "Regenerate invite" : "Create invite",
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
      onEdit: () => router.push(`/staff/students/${s.id}?edit=1`),
      onArchive: () => void setStudentLifecycle(s.id, "archived"),
      onRestore: () => void setStudentLifecycle(s.id, "active"),
      onDelete: () => void deleteStudent(s.id),
    });
    actions.splice(1, 0, {
      id: "unassign",
      label: "Unassign",
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
          <span>Email</span>
          <span className="family-detail-col-flag">Billing owner</span>
          <span className="family-detail-col-flag">Manage students</span>
          <span className="family-detail-col-flag">Request services</span>
          <span className="staff-dir-col-actions" aria-label="Actions" />
        </div>
        {rows.map((g) => {
          const portalBadge = guardianPortalBadge(g);
          return (
          <div key={g.id} className="table-row family-detail-cols-guardians family-detail-table-row">
            <span>
              <strong>
                {g.firstName} {g.lastName}
              </strong>
              {portalBadge ? (
                <small className="family-guardian-link-status">{portalBadge}</small>
              ) : null}
            </span>
            <span>{g.email}</span>
            <span className="family-detail-col-flag">{yesNo(g.isBillingOwner)}</span>
            <span className="family-detail-col-flag">{yesNo(g.canManageStudents)}</span>
            <span className="family-detail-col-flag">{yesNo(g.canRequestServices)}</span>
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
          <span>Grade</span>
          <span>School</span>
          <span className="staff-dir-col-status">Status</span>
          <span className="staff-dir-col-actions" aria-label="Actions" />
        </div>
        {rows.map((s) => (
          <div key={s.id} className="table-row family-detail-cols-students family-detail-table-row">
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

  function renderEnrollmentRow(row: FamilyDetail["activity"]["enrollments"][number]) {
    return (
      <div key={row.id} className="staff-detail-list-row">
        <span>
          <strong>
            {row.studentName} · {row.courseName}
          </strong>
          <small>
            {formatStatusLabel(row.status)} · {formatDate(row.createdAt)}
          </small>
        </span>
        <Link
          href={`/staff/families/${familyId}/enrollments/${row.id}`}
          className="secondary-button staff-open-control"
        >
          Open
        </Link>
      </div>
    );
  }

  function renderBookingRow(row: FamilyDetail["activity"]["bookings"][number]) {
    return (
      <div key={row.id} className="staff-detail-list-row">
        <span>
          <strong>
            {row.studentName} · {row.tutorName}
          </strong>
          <small>
            {formatStatusLabel(row.status)} · {formatDate(row.createdAt)}
          </small>
        </span>
        <Link
          href={`/staff/families/${familyId}/bookings/${row.id}`}
          className="secondary-button staff-open-control"
        >
          Open
        </Link>
      </div>
    );
  }

  function renderNotesTable(notes: NoteRow[]) {
    return (
      <div className="family-notes-table-wrap">
        <table className="family-notes-table">
          <thead>
            <tr>
              <th className="family-notes-col-content">Note</th>
              <th className="family-notes-col-who">Creator</th>
              <th className="family-notes-col-when">Created</th>
              <th className="family-notes-col-edit" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td className="family-notes-col-content">
                  <span style={{ whiteSpace: "pre-wrap" }}>{note.body}</span>
                </td>
                <td className="family-notes-col-who">{note.authorDisplayName}</td>
                <td className="family-notes-col-when">{formatWhen(note.createdAt)}</td>
                <td className="family-notes-col-edit">
                  <StaffIconButton
                    label="Edit"
                    title="Edit"
                    tone="muted"
                    className="family-notes-edit-btn"
                    onClick={() => startEditNote(note)}
                  >
                    <IconPencil size={14} />
                  </StaffIconButton>
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
        <Link href="/staff/families" className="page-back">
          ← Families
        </Link>
        <div className="family-detail-topbar-actions">
          <StaffIconButton
            label="Edit"
            title="Edit"
            tone="edit"
            disabled={lifecycleBusy}
            onClick={openHouseholdEdit}
          >
            <IconPencil size={15} />
          </StaffIconButton>
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
          <p className="family-record-hero-meta">
            {[
              family.billingEmail ? `Billing: ${family.billingEmail}` : null,
              family.billingOwnerName,
              billingCue,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className={`pill family-record-hero-status-pill ${statusTone(family.status)}`}>
          {formatStatusLabel(family.status)}
        </span>
      </section>

      {editingHousehold && householdForm ? (
        <Panel title="Edit household" className="family-equal-panel">
          <form onSubmit={saveHousehold} className="input-grid family-household-edit-grid">
            <label>
              Family name
              <input
                value={householdForm.displayName}
                onChange={(e) => setHouseholdForm({ ...householdForm, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={householdForm.primaryPhone}
                onChange={(e) => setHouseholdForm({ ...householdForm, primaryPhone: e.target.value })}
              />
            </label>
            <label>
              Street
              <input
                value={householdForm.addressLine1}
                onChange={(e) => setHouseholdForm({ ...householdForm, addressLine1: e.target.value })}
              />
            </label>
            <label>
              Address line 2
              <input
                value={householdForm.addressLine2}
                onChange={(e) => setHouseholdForm({ ...householdForm, addressLine2: e.target.value })}
              />
            </label>
            <label>
              City
              <input
                value={householdForm.city}
                onChange={(e) => setHouseholdForm({ ...householdForm, city: e.target.value })}
              />
            </label>
            <label>
              State
              <input
                value={householdForm.state}
                onChange={(e) => setHouseholdForm({ ...householdForm, state: e.target.value })}
              />
            </label>
            <label>
              ZIP
              <input
                value={householdForm.postalCode}
                onChange={(e) => setHouseholdForm({ ...householdForm, postalCode: e.target.value })}
              />
            </label>
            <label>
              Country
              <input value="United States" disabled readOnly />
            </label>
            <div className="family-household-edit-zoho-row">
              <label>
                Zoho CRM ID
                <input
                  value={householdForm.zohoCrmId}
                  onChange={(e) => setHouseholdForm({ ...householdForm, zohoCrmId: e.target.value })}
                />
              </label>
              <label className="family-household-edit-zoho-url">
                Zoho CRM URL
                <input
                  type="url"
                  placeholder="https://…"
                  value={householdForm.zohoCrmUrl}
                  onChange={(e) => setHouseholdForm({ ...householdForm, zohoCrmUrl: e.target.value })}
                />
              </label>
            </div>
            <label>
              Billing owner
              <select
                value={householdForm.billingOwnerGuardianId}
                onChange={(e) =>
                  setHouseholdForm({ ...householdForm, billingOwnerGuardianId: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {family.guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.firstName} {g.lastName}
                  </option>
                ))}
              </select>
            </label>
            <div className="family-household-edit-actions">
              <button type="submit" className="primary-button" disabled={savingHousehold}>
                {savingHousehold ? "Saving…" : "Save household"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingHousehold(false)}
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
            <h2>Household</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-summary-title">
              <strong>{family.displayName}</strong>
              <span className={`pill ${statusTone(family.status)}`}>
                {formatStatusLabel(family.status)}
              </span>
            </div>
            <div className="family-household-dense">
              <span className="family-household-field-phone">
                <small>Phone</small>
                <strong>{family.primaryPhone || "—"}</strong>
              </span>
              <span className="family-household-field-email">
                <small>Billing email</small>
                <strong title={family.billingEmail || undefined}>
                  {family.billingEmail || "—"}
                </strong>
              </span>
              <span className="family-household-field-owner">
                <small>Billing owner</small>
                <strong>{family.billingOwnerName || "—"}</strong>
              </span>
              <span className="family-household-field-card">
                <small>Card</small>
                <strong>{billingCue}</strong>
              </span>
              <div className="family-household-lower">
                <span className="family-household-field-address">
                  <small>Address</small>
                  <strong>{addressLine || "—"}</strong>
                </span>
                <div className="family-household-zoho-stack">
                  <span className="family-household-field-zoho-id">
                    <small>Zoho CRM ID</small>
                    <strong>{family.zohoCrmId || "—"}</strong>
                  </span>
                  <span className="family-household-field-zoho-url">
                    <small>Zoho CRM URL</small>
                    {zohoLink ? (
                      <a
                        href={zohoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="family-zoho-url-link"
                        title={zohoLink}
                      >
                        {zohoLink}
                      </a>
                    ) : (
                      <strong>—</strong>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

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

      <div className="family-activity-band">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Course enrollments</h2>
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

      <div className="family-notes-layout">
        <Panel className="family-notes-panel family-equal-panel">
          <div className="family-panel-heading">
            <h2>Add note</h2>
          </div>
          <div className="family-add-note-stretch">
            <p className="family-add-note-helper">Internal only — not visible in the family portal.</p>
            <form onSubmit={addNote}>
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
          <FamilyListPreview
            total={family.notes.length}
            empty={<p className="family-empty">No notes yet.</p>}
            onViewMore={() => setListModal("notes")}
          >
            {renderNotesTable(previewNotes)}
          </FamilyListPreview>
        </Panel>
      </div>

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
      {listModal === "notes" ? (
        <FamilyListModal title="Notes" onClose={() => setListModal(null)}>
          {renderNotesTable(family.notes)}
        </FamilyListModal>
      ) : null}

      {editingNoteId ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelEditNote();
          }}
        >
          <div
            className="staff-modal family-note-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-note-edit-title"
          >
            <div className="family-list-modal-header">
              <h3 id="family-note-edit-title">Edit note</h3>
              <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={cancelEditNote}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <form onSubmit={saveNoteEdit} className="staff-modal-form">
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
                              {s.gradeLabel || "—"} · {s.householdDisplayName}
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

      {editingGuardianId && guardianForm ? (
        <div
          className="staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeGuardianEdit();
          }}
        >
          <div
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-edit-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closeGuardianEdit();
            }}
          >
            <div className="family-list-modal-header">
              <h3 id="guardian-edit-title">
                Edit guardian · {guardianForm.firstName} {guardianForm.lastName}
              </h3>
              <StaffIconButton label="Close" title="Cancel" tone="muted" onClick={closeGuardianEdit}>
                <IconClose size={18} />
              </StaffIconButton>
            </div>
            <form onSubmit={saveGuardian} className="staff-modal-form">
              <div className="input-grid staff-modal-fields">
                <label>
                  First name
                  <input
                    value={guardianForm.firstName}
                    onChange={(e) => setGuardianForm({ ...guardianForm, firstName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={guardianForm.lastName}
                    onChange={(e) => setGuardianForm({ ...guardianForm, lastName: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={guardianForm.email}
                    onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={guardianForm.phone || ""}
                    onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                  />
                </label>
              </div>
              <div className="guardian-perm-row" role="group" aria-label="Permissions">
                <label className="guardian-perm-option">
                  <input
                    type="checkbox"
                    checked={guardianForm.isBillingOwner}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, isBillingOwner: e.target.checked })
                    }
                  />
                  <span>Billing owner</span>
                </label>
                <label className="guardian-perm-option">
                  <input
                    type="checkbox"
                    checked={guardianForm.canManageStudents}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, canManageStudents: e.target.checked })
                    }
                  />
                  <span>Can manage students</span>
                </label>
                <label className="guardian-perm-option">
                  <input
                    type="checkbox"
                    checked={guardianForm.canRequestServices}
                    onChange={(e) =>
                      setGuardianForm({ ...guardianForm, canRequestServices: e.target.checked })
                    }
                  />
                  <span>Can request services</span>
                </label>
              </div>
              <div className="staff-modal-actions">
                <button type="button" className="secondary-button" onClick={closeGuardianEdit}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingGuardian}>
                  {savingGuardian ? "Saving…" : "Save guardian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
