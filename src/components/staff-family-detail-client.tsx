"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";
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

type FamilyDetail = {
  id: string;
  displayName: string;
  status: string;
  primaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  billingOwnerGuardianId: string | null;
  billingOwnerName: string | null;
  cardOnFile: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  canDelete: boolean;
  notes: NoteRow[];
  guardians: GuardianRow[];
  students: Array<{
    id: string;
    displayName: string;
    gradeLabel: string | null;
    schoolName: string | null;
    lifecycle: string;
  }>;
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
  billingOwnerGuardianId: string;
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
    return new Date(value).toLocaleString();
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

const PREVIEW_LIMIT = 3;

type FamilyListModalKind = "guardians" | "students" | "enrollments" | "bookings" | "notes";

function FamilyListPreview({
  total,
  empty,
  onViewMore,
  children,
}: {
  total: number;
  empty: React.ReactNode;
  onViewMore: () => void;
  children: React.ReactNode;
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
  children: React.ReactNode;
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
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="family-list-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function StaffFamilyDetailClient({ familyId }: { familyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkedGuardianId = searchParams.get("guardianId");
  const deepLinkEdit = searchParams.get("edit") === "1";
  const deepLinkHandled = useRef<string | null>(null);
  const editDeepLinkHandled = useRef(false);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [householdForm, setHouseholdForm] = useState<HouseholdEdit | null>(null);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [guardianForm, setGuardianForm] = useState<GuardianRow | null>(null);
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [listModal, setListModal] = useState<FamilyListModalKind | null>(null);

  const softReload = useCallback(async () => {
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
    }
  }, [familyId]);

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
    setSavedMessage(null);
    router.replace(`/staff/families/${familyId}`, { scroll: false });
  }, [family, deepLinkedGuardianId, familyId, router]);

  async function refreshInvite(guardianId: string) {
    setInviteMessage(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to refresh invite.");
        return;
      }
      setInviteMessage(`Invite link: ${window.location.origin}${data.invitePath}`);
      await softReload();
    } catch {
      setError("Unable to refresh invite.");
    }
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteDraft.trim() || savingNotes) return;
    setSavingNotes(true);
    setSavedMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        setError(data.error || "Unable to add note.");
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
      setSavedMessage("Note added.");
    } catch {
      setError("Unable to add note.");
    } finally {
      setSavingNotes(false);
    }
  }

  function startEditNote(note: NoteRow) {
    setEditingNoteId(note.id);
    setNoteEditDraft(note.body);
    setError(null);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setNoteEditDraft("");
  }

  async function saveNoteEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingNoteId || !noteEditDraft.trim() || savingNoteEdit) return;
    setSavingNoteEdit(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteEditDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.note) {
        setError(data.error || "Unable to update note.");
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
      setSavedMessage("Note updated.");
    } catch {
      setError("Unable to update note.");
    } finally {
      setSavingNoteEdit(false);
    }
  }

  function openHouseholdEdit() {
    if (!family) return;
    setHouseholdForm({
      displayName: family.displayName,
      primaryPhone: family.primaryPhone || "",
      addressLine1: family.addressLine1 || "",
      addressLine2: family.addressLine2 || "",
      city: family.city || "",
      state: family.state || "",
      postalCode: family.postalCode || "",
      billingOwnerGuardianId: family.billingOwnerGuardianId || "",
    });
    setEditingHousehold(true);
    setSavedMessage(null);
  }

  useEffect(() => {
    if (!family || !deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    setHouseholdForm({
      displayName: family.displayName,
      primaryPhone: family.primaryPhone || "",
      addressLine1: family.addressLine1 || "",
      addressLine2: family.addressLine2 || "",
      city: family.city || "",
      state: family.state || "",
      postalCode: family.postalCode || "",
      billingOwnerGuardianId: family.billingOwnerGuardianId || "",
    });
    setEditingHousehold(true);
    setSavedMessage(null);
    router.replace(`/staff/families/${familyId}`, { scroll: false });
  }, [family, deepLinkEdit, familyId, router]);

  async function saveHousehold(event: React.FormEvent) {
    event.preventDefault();
    if (!householdForm || savingHousehold) return;
    if (!householdForm.displayName.trim()) {
      setError("Household name is required.");
      return;
    }
    if (householdForm.primaryPhone.trim() && !isValidPhone(householdForm.primaryPhone)) {
      setError("Enter a valid household phone number.");
      return;
    }
    setSavingHousehold(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: householdForm.displayName,
          primaryPhone: householdForm.primaryPhone,
          addressLine1: householdForm.addressLine1,
          addressLine2: householdForm.addressLine2,
          city: householdForm.city,
          state: householdForm.state,
          postalCode: householdForm.postalCode,
          billingOwnerGuardianId: householdForm.billingOwnerGuardianId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save household.");
        return;
      }
      setEditingHousehold(false);
      setSavedMessage("Household updated.");
      await softReload();
    } catch {
      setError("Unable to save household.");
    } finally {
      setSavingHousehold(false);
    }
  }

  function openGuardianEdit(guardian: GuardianRow) {
    setListModal(null);
    setGuardianForm({ ...guardian });
    setEditingGuardianId(guardian.id);
    setSavedMessage(null);
    setError(null);
  }

  function closeGuardianEdit() {
    setEditingGuardianId(null);
    setGuardianForm(null);
  }

  async function saveGuardian(event: React.FormEvent) {
    event.preventDefault();
    if (!guardianForm || !editingGuardianId || savingGuardian) return;
    if (!guardianForm.firstName.trim() || !guardianForm.lastName.trim()) {
      setError("Guardian first and last name are required.");
      return;
    }
    if (!isValidEmail(guardianForm.email)) {
      setError("Enter a valid guardian email.");
      return;
    }
    if (guardianForm.phone?.trim() && !isValidPhone(guardianForm.phone)) {
      setError("Enter a valid guardian phone number.");
      return;
    }
    setSavingGuardian(true);
    setError(null);
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
        setError(data.error || "Unable to save guardian.");
        return;
      }
      closeGuardianEdit();
      setSavedMessage("Guardian updated.");
      await softReload();
    } catch {
      setError("Unable to save guardian.");
    } finally {
      setSavingGuardian(false);
    }
  }

  async function setStatus(status: "active" | "archived") {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update status.");
        return;
      }
      setSavedMessage(status === "archived" ? "Family archived." : "Family restored.");
      await softReload();
    } catch {
      setError("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function deleteFamily() {
    if (!family?.canDelete || lifecycleBusy) return;
    if (!window.confirm("Permanently delete this empty household? This cannot be undone.")) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete family.");
        return;
      }
      router.push("/staff/families");
    } catch {
      setError("Unable to delete family.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading family…</p>;
  if (error && !family) return <p className="form-error">{error}</p>;
  if (!family) return null;

  const address = [family.addressLine1, family.addressLine2, family.city, family.state, family.postalCode]
    .filter(Boolean)
    .join(", ");
  const billingCue = family.cardLast4
    ? `${(family.cardBrand || "Card").toUpperCase()} ···· ${family.cardLast4}`
    : "No card on file";
  const isArchived = family.status === "archived";

  const previewGuardians = family.guardians.slice(0, PREVIEW_LIMIT);
  const previewStudents = family.students.slice(0, PREVIEW_LIMIT);
  const previewEnrollments = family.activity.enrollments.slice(0, PREVIEW_LIMIT);
  const previewBookings = family.activity.bookings.slice(0, PREVIEW_LIMIT);
  const previewNotes = family.notes.slice(0, PREVIEW_LIMIT);

  function renderGuardianArticle(g: GuardianRow) {
    const perms = [
      g.linked ? "Own login" : g.invitePending ? "Invite pending" : "Not linked",
      g.isBillingOwner ? "Billing owner" : "No billing",
      g.canManageStudents ? "Manage students" : null,
      g.canRequestServices ? "Request services" : null,
    ].filter(Boolean);
    return (
      <article key={g.id}>
        <span className="mini-avatar">{initials(`${g.firstName} ${g.lastName}`)}</span>
        <span>
          <strong>
            {g.firstName} {g.lastName}
          </strong>
          <small>
            {g.email}
            {g.phone ? ` · ${g.phone}` : ""}
            <br />
            {perms.join(" · ")}
          </small>
          <span style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <button
              type="button"
              className="text-button"
              style={{ padding: 0 }}
              onClick={() => openGuardianEdit(g)}
            >
              Edit
            </button>
            {!g.linked ? (
              <button
                type="button"
                className="text-button"
                style={{ padding: 0 }}
                onClick={() => void refreshInvite(g.id)}
              >
                {g.invitePath ? "Regenerate invite" : "Create invite"}
              </button>
            ) : null}
          </span>
        </span>
        <span
          className={`pill ${statusTone(g.linked ? "active" : g.invitePending ? "invite_pending" : "unlinked")}`}
        >
          {formatStatusLabel(g.linked ? "active" : g.invitePending ? "invite_pending" : "unlinked")}
        </span>
      </article>
    );
  }

  function renderStudentRow(s: FamilyDetail["students"][number]) {
    return (
      <div key={s.id} className="staff-detail-list-row">
        <span className="mini-avatar">{initials(s.displayName)}</span>
        <span>
          <strong>{s.displayName}</strong>
          <small>
            {s.gradeLabel || "Grade pending"} · {s.schoolName || "School pending"} ·{" "}
            {formatStatusLabel(s.lifecycle)}
          </small>
        </span>
        <Link href={`/staff/students/${s.id}`} className="secondary-button staff-open-control">
          Open
        </Link>
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
              <th className="family-notes-col-when">Creation Date</th>
              <th className="family-notes-col-edit" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td className="family-notes-col-content">
                  {editingNoteId === note.id ? (
                    <form className="family-notes-edit-inline" onSubmit={saveNoteEdit}>
                      <textarea
                        value={noteEditDraft}
                        onChange={(event) => setNoteEditDraft(event.target.value)}
                        rows={3}
                      />
                      <div className="family-notes-edit-actions">
                        <button
                          type="submit"
                          className="primary-button"
                          disabled={savingNoteEdit || !noteEditDraft.trim()}
                        >
                          {savingNoteEdit ? "Saving…" : "Save"}
                        </button>
                        <button type="button" className="secondary-button" onClick={cancelEditNote}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{note.body}</span>
                  )}
                </td>
                <td className="family-notes-col-who">{note.authorDisplayName}</td>
                <td className="family-notes-col-when">{formatWhen(note.createdAt)}</td>
                <td className="family-notes-col-edit">
                  {editingNoteId === note.id ? null : (
                    <button
                      type="button"
                      className="action-btn action-btn-edit"
                      style={{ padding: "8px 12px" }}
                      onClick={() => startEditNote(note)}
                    >
                      Edit
                    </button>
                  )}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <Link href="/staff/families" className="page-back">
          ← Families
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="action-btn action-btn-edit" onClick={openHouseholdEdit}>
            Edit
          </button>
          {isArchived ? (
            <button
              type="button"
              className="action-btn action-btn-restore"
              disabled={lifecycleBusy}
              onClick={() => void setStatus("active")}
            >
              Restore
            </button>
          ) : family.canDelete ? (
            <button
              type="button"
              className="action-btn action-btn-delete"
              disabled={lifecycleBusy}
              onClick={() => void deleteFamily()}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="action-btn action-btn-archive"
              disabled={lifecycleBusy}
              onClick={() => void setStatus("archived")}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(family.displayName)}</span>
        <div className="family-record-hero-copy">
          <div className="family-record-hero-title">
            <h2>{family.displayName}</h2>
            <span className={`pill ${statusTone(family.status)}`}>{formatStatusLabel(family.status)}</span>
          </div>
          <p>
            {[family.billingOwnerName ? `Billing: ${family.billingOwnerName}` : null, billingCue]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {inviteMessage ? <p style={{ fontSize: 14, marginBottom: 12 }}>{inviteMessage}</p> : null}
      {savedMessage ? (
        <p style={{ color: "var(--mint, #2f6b4f)", fontSize: 14, marginBottom: 12 }}>{savedMessage}</p>
      ) : null}

      {editingHousehold && householdForm ? (
        <Panel title="Edit household">
          <form onSubmit={saveHousehold} className="input-grid" style={{ gap: 12 }}>
            <label>
              Household name
              <input
                value={householdForm.displayName}
                onChange={(e) => setHouseholdForm({ ...householdForm, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Primary phone
              <input
                type="tel"
                value={householdForm.primaryPhone}
                onChange={(e) => setHouseholdForm({ ...householdForm, primaryPhone: e.target.value })}
              />
            </label>
            <label>
              Address line 1
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
              Postal code
              <input
                value={householdForm.postalCode}
                onChange={(e) => setHouseholdForm({ ...householdForm, postalCode: e.target.value })}
              />
            </label>
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
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
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
        <Panel title="Household summary">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Status</small>
              <strong>{family.status}</strong>
            </span>
            <span>
              <small>Billing owner</small>
              <strong>{family.billingOwnerName || "—"}</strong>
            </span>
            <span>
              <small>Primary phone</small>
              <strong>{family.primaryPhone || "—"}</strong>
            </span>
            <span>
              <small>Card on file</small>
              <strong>{billingCue}</strong>
            </span>
            <span>
              <small>Address</small>
              <strong>{address || "—"}</strong>
            </span>
            <span>
              <small>Students</small>
              <strong>{family.students.length}</strong>
            </span>
          </div>
        </Panel>

        <Panel title="Guardians" className="family-equal-panel">
          <FamilyListPreview
            total={family.guardians.length}
            empty={<p style={{ color: "var(--muted)", fontSize: 14 }}>No guardians yet.</p>}
            onViewMore={() => setListModal("guardians")}
          >
            <div className="guardian-access-preview family-preview-guardians">
              {previewGuardians.map(renderGuardianArticle)}
            </div>
          </FamilyListPreview>
        </Panel>
      </div>

      <Panel title="Students" className="family-equal-panel">
        <FamilyListPreview
          total={family.students.length}
          empty={<p style={{ color: "var(--muted)", fontSize: 14 }}>No students yet.</p>}
          onViewMore={() => setListModal("students")}
        >
          <div className="staff-detail-list">{previewStudents.map(renderStudentRow)}</div>
        </FamilyListPreview>
      </Panel>

      <div className="family-activity-band">
        <Panel title="Course enrollments" className="family-equal-panel">
          <FamilyListPreview
            total={family.activity.enrollments.length}
            empty={<p style={{ color: "var(--muted)", fontSize: 14 }}>No course enrollments yet.</p>}
            onViewMore={() => setListModal("enrollments")}
          >
            <div className="staff-detail-list">{previewEnrollments.map(renderEnrollmentRow)}</div>
          </FamilyListPreview>
        </Panel>
        <Panel title="Bookings" className="family-equal-panel">
          <FamilyListPreview
            total={family.activity.bookings.length}
            empty={<p style={{ color: "var(--muted)", fontSize: 14 }}>No tutoring bookings yet.</p>}
            onViewMore={() => setListModal("bookings")}
          >
            <div className="staff-detail-list">{previewBookings.map(renderBookingRow)}</div>
          </FamilyListPreview>
        </Panel>
      </div>

      <div className="family-notes-layout">
        <Panel title="Add note" className="family-notes-panel family-equal-panel">
          <div className="family-add-note-stretch">
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
              Internal notes only. Not visible in the family portal.
            </p>
            <form onSubmit={addNote}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--muted)" }}>
                Note
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={3}
                />
              </label>
              <button
                type="submit"
                className="primary-button"
                style={{ marginTop: 8 }}
                disabled={savingNotes || !noteDraft.trim()}
              >
                {savingNotes ? "Adding…" : "Add note"}
              </button>
            </form>
          </div>
        </Panel>

        <Panel title="Notes" className="family-notes-panel family-equal-panel">
          <FamilyListPreview
            total={family.notes.length}
            empty={<p style={{ color: "var(--muted)", fontSize: 14 }}>No notes yet.</p>}
            onViewMore={() => setListModal("notes")}
          >
            {renderNotesTable(previewNotes)}
          </FamilyListPreview>
        </Panel>
      </div>

      {listModal === "guardians" ? (
        <FamilyListModal title="Guardians" onClose={() => setListModal(null)}>
          <div className="guardian-access-preview family-preview-guardians">
            {family.guardians.map(renderGuardianArticle)}
          </div>
        </FamilyListModal>
      ) : null}
      {listModal === "students" ? (
        <FamilyListModal title="Students" onClose={() => setListModal(null)}>
          <div className="staff-detail-list">{family.students.map(renderStudentRow)}</div>
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
            <h3 id="guardian-edit-title">
              Edit guardian · {guardianForm.firstName} {guardianForm.lastName}
            </h3>
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
