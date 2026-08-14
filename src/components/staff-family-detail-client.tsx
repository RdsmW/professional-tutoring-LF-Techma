"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function StaffFamilyDetailClient({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [householdForm, setHouseholdForm] = useState<HouseholdEdit | null>(null);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [guardianForm, setGuardianForm] = useState<GuardianRow | null>(null);
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

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
      await reload();
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
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to add note.");
        return;
      }
      setNoteDraft("");
      setSavedMessage("Note added.");
      await reload();
    } catch {
      setError("Unable to add note.");
    } finally {
      setSavingNotes(false);
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
      await reload();
    } catch {
      setError("Unable to save household.");
    } finally {
      setSavingHousehold(false);
    }
  }

  function openGuardianEdit(guardian: GuardianRow) {
    setGuardianForm({ ...guardian });
    setEditingGuardianId(guardian.id);
    setSavedMessage(null);
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
      setEditingGuardianId(null);
      setGuardianForm(null);
      setSavedMessage("Guardian updated.");
      await reload();
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
      await reload();
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
          <button type="button" className="secondary-button" onClick={openHouseholdEdit}>
            Edit
          </button>
          {isArchived ? (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void setStatus("active")}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void setStatus("archived")}
            >
              Archive
            </button>
          )}
          {family.canDelete ? (
            <button
              type="button"
              className="secondary-button"
              disabled={lifecycleBusy}
              onClick={() => void deleteFamily()}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(family.displayName)}</span>
        <div>
          <h2>{family.displayName}</h2>
          <p>
            {[family.billingOwnerName ? `Billing: ${family.billingOwnerName}` : null, billingCue]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className={`pill ${statusTone(family.status)}`}>{formatStatusLabel(family.status)}</span>
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

        <Panel title="Guardians">
          <div className="guardian-access-preview">
            {family.guardians.map((g) => {
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
                  <span className={`pill ${statusTone(g.linked ? "active" : g.invitePending ? "invite_pending" : "unlinked")}`}>
                    {formatStatusLabel(g.linked ? "active" : g.invitePending ? "invite_pending" : "unlinked")}
                  </span>
                </article>
              );
            })}
          </div>

          {editingGuardianId && guardianForm ? (
            <form
              onSubmit={saveGuardian}
              className="input-grid"
              style={{ marginTop: 14, gap: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}
            >
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
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={guardianForm.isBillingOwner}
                  onChange={(e) =>
                    setGuardianForm({ ...guardianForm, isBillingOwner: e.target.checked })
                  }
                />
                Billing owner
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={guardianForm.canManageStudents}
                  onChange={(e) =>
                    setGuardianForm({ ...guardianForm, canManageStudents: e.target.checked })
                  }
                />
                Can manage students
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={guardianForm.canRequestServices}
                  onChange={(e) =>
                    setGuardianForm({ ...guardianForm, canRequestServices: e.target.checked })
                  }
                />
                Can request services
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                <button type="submit" className="primary-button" disabled={savingGuardian}>
                  {savingGuardian ? "Saving…" : "Save guardian"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingGuardianId(null);
                    setGuardianForm(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </Panel>
      </div>

      <Panel title="Students">
        {family.students.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No students yet.</p>
        ) : (
          <div className="linked-student-list">
            {family.students.map((s) => (
              <Link key={s.id} href={`/staff/students/${s.id}`} className="family-row">
                <span className="mini-avatar">{initials(s.displayName)}</span>
                <span>
                  <strong>{s.displayName}</strong>
                  <small>
                    {s.gradeLabel || "Grade pending"} · {s.schoolName || "School pending"} · {s.lifecycle}
                  </small>
                </span>
                <b>Open →</b>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <div className="profile-layout" style={{ marginTop: 14 }}>
        <Panel title="Course enrollments">
          {family.activity.enrollments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No course enrollments yet.</p>
          ) : (
            family.activity.enrollments.map((row) => (
              <Link
                key={row.id}
                href={`/staff/families/${familyId}/enrollments/${row.id}`}
                style={{
                  display: "block",
                  borderTop: "1px solid var(--line)",
                  padding: "10px 0",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong style={{ fontSize: 14 }}>
                  {row.studentName} · {row.courseName}
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
                  {row.status} · {formatDate(row.createdAt)} · Open →
                </p>
              </Link>
            ))
          )}
        </Panel>
        <Panel title="Bookings">
          {family.activity.bookings.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>No tutoring bookings yet.</p>
          ) : (
            family.activity.bookings.map((row) => (
              <Link
                key={row.id}
                href={`/staff/families/${familyId}/bookings/${row.id}`}
                style={{
                  display: "block",
                  borderTop: "1px solid var(--line)",
                  padding: "10px 0",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong style={{ fontSize: 14 }}>
                  {row.studentName} · {row.tutorName}
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
                  {row.status} · {formatDate(row.createdAt)} · Open →
                </p>
              </Link>
            ))
          )}
        </Panel>
      </div>

      <Panel title="Staff notes">
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
          Append-only internal notes. Not visible in the family portal.
        </p>
        {family.notes.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No notes yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {family.notes.map((note) => (
              <article
                key={note.id}
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: 10,
                }}
              >
                <small style={{ color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>
                  {note.authorDisplayName} · {formatWhen(note.createdAt)}
                </small>
                <p style={{ margin: "4px 0 0", fontSize: 14, whiteSpace: "pre-wrap" }}>{note.body}</p>
              </article>
            ))}
          </div>
        )}
        <form onSubmit={addNote}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--muted)" }}>
            Add note
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={4}
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                border: "1px solid var(--line)",
                background: "#fbfcfa",
                padding: 11,
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
          </label>
          <button
            type="submit"
            className="secondary-button"
            style={{ marginTop: 10 }}
            disabled={savingNotes || !noteDraft.trim()}
          >
            {savingNotes ? "Adding…" : "Add note"}
          </button>
        </form>
      </Panel>
    </>
  );
}
