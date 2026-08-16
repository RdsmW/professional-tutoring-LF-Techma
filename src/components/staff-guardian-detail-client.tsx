"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui";
import { IconClose, IconPencil, StaffIconButton } from "@/components/staff-action-icons";
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
  const [unassignBusy, setUnassignBusy] = useState(false);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [editDeepLinkHandled, setEditDeepLinkHandled] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

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

  async function unassignFromFamily() {
    if (!guardian?.household || unassignBusy) return;
    setUnassignBusy(true);
    try {
      const response = await fetch(
        `/api/staff/families/${guardian.household.id}/guardians/${guardianId}/unassign`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to unassign guardian.");
        return;
      }
      setConfirmUnassign(false);
      toast.success("Guardian unassigned.");
      await reload();
      setEditing(false);
      setProfileForm(null);
    } catch {
      toast.error("Unable to unassign guardian.");
    } finally {
      setUnassignBusy(false);
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
  const editingNote = editingNoteId
    ? guardian.notes.find((note) => note.id === editingNoteId) ?? null
    : null;
  const showStudents = guardian.isBillingOwner;

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function studentMeta(student: StaffGuardianStudentRow) {
    const parts = [
      student.gradeLabel,
      student.schoolName,
      student.graduationYear ? String(student.graduationYear) : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />

      {confirmUnassign ? (
        <ConfirmActionModal
          title="Unassign this guardian?"
          body="They become an orphan until reassigned (not deleted). Payment responsibility will move to another household guardian when needed."
          confirmLabel="Unassign"
          destructive
          busy={unassignBusy}
          onCancel={() => {
            if (!unassignBusy) setConfirmUnassign(false);
          }}
          onConfirm={() => void unassignFromFamily()}
        />
      ) : null}

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
            <div className="family-household-dense">
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
                <span style={{ gridColumn: "1 / -1" }}>
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
            <div className="family-household-dense">
              <div className="family-household-upper">
                <span>
                  <small>Parent role</small>
                  <strong>{roleLabel || "—"}</strong>
                </span>
                <span>
                  <small>Responsible for payment</small>
                  <strong>{yesNo(guardian.isBillingOwner)}</strong>
                </span>
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
                  <small>Portal</small>
                  <strong>{formatStatusLabel(statusKey)}</strong>
                </span>
              </div>
              {guardian.household ? (
                <div className="family-household-lower">
                  <span style={{ gridColumn: "1 / -1" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={unassignBusy}
                      onClick={() => setConfirmUnassign(true)}
                    >
                      Unassign from family
                    </button>
                  </span>
                </div>
              ) : (
                <div className="family-household-lower">
                  <p className="family-empty" style={{ margin: 0, gridColumn: "1 / -1" }}>
                    Assign this guardian from a Family record.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {showStudents ? (
          <Panel className="family-equal-panel family-students-band">
            <div className="family-panel-heading">
              <h2>Students</h2>
            </div>
            {guardian.students.length === 0 ? (
              <p className="family-empty">No students in this household yet.</p>
            ) : (
              <div className="staff-detail-list">
                {guardian.students.map((student) => {
                  const href = `/staff/students/${student.id}`;
                  return (
                    <div
                      key={student.id}
                      className="staff-detail-list-row staff-detail-list-row-clickable"
                      role="link"
                      tabIndex={0}
                      aria-label={`Open student ${student.displayName}`}
                      onClick={() => router.push(href)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(href);
                        }
                      }}
                    >
                      <span>
                        <strong>{student.displayName}</strong>
                        <small>{studentMeta(student)}</small>
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
                })}
              </div>
            )}
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

      {notesModalOpen ? (
        <NotesListModal
          title="Notes"
          className="family-notes-list-modal"
          onClose={() => setNotesModalOpen(false)}
        >
          {renderNotesTable(guardian.notes)}
        </NotesListModal>
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
    </>
  );
}
