"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui";

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
  notes: string;
  billingOwnerName: string | null;
  cardOnFile: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  guardians: Array<{
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
  }>;
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "F";
}

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

export function StaffFamilyDetailClient({ familyId }: { familyId: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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
      setNotesDraft(data.family.notes || "");
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

  async function saveNotes(event: React.FormEvent) {
    event.preventDefault();
    if (!family || savingNotes) return;
    setSavingNotes(true);
    setSavedMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save notes.");
        return;
      }
      setFamily({ ...family, notes: data.family.notes || "" });
      setSavedMessage("Household notes saved.");
    } catch {
      setError("Unable to save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading family…</p>;
  if (error && !family) return <p className="form-error">{error}</p>;
  if (!family) return null;

  const address = [family.addressLine1, family.addressLine2, family.city, family.state, family.postalCode]
    .filter(Boolean)
    .join(", ");
  const nextAction = family.guardians.some((g) => !g.linked)
    ? "Complete guardian invite"
    : family.students.length === 0
      ? "Add first student"
      : "Review service activity";

  return (
    <>
      <Link href="/staff/families" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Families
      </Link>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(family.displayName)}</span>
        <div>
          <span className="eyebrow">Staff · Family Detail</span>
          <h2>{family.displayName}</h2>
          <p>
            Next action: {nextAction}
            {family.billingOwnerName ? ` · Billing: ${family.billingOwnerName}` : ""}
          </p>
        </div>
        <span className="pill">{family.status}</span>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {inviteMessage ? <p style={{ fontSize: 11, marginBottom: 12 }}>{inviteMessage}</p> : null}
      {savedMessage ? (
        <p style={{ color: "var(--mint, #2f6b4f)", fontSize: 11, marginBottom: 12 }}>{savedMessage}</p>
      ) : null}

      <div className="family-detail-layout">
        <Panel title="Household summary" eyebrow="Account">
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
              <strong>
                {family.cardOnFile
                  ? `${family.cardBrand || "Card"} ···· ${family.cardLast4 || "????"}`
                  : "Not on file"}
              </strong>
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

        <Panel title="Guardians" eyebrow="Adults">
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
                  <span className="mini-avatar">
                    {initials(`${g.firstName} ${g.lastName}`)}
                  </span>
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
                    {g.invitePath ? (
                      <small>
                        Accept path: <code>{g.invitePath}</code>
                      </small>
                    ) : null}
                    {!g.linked ? (
                      <button
                        type="button"
                        className="text-button"
                        style={{ marginTop: 4, padding: 0 }}
                        onClick={() => void refreshInvite(g.id)}
                      >
                        {g.invitePath ? "Regenerate invite →" : "Create invite →"}
                      </button>
                    ) : null}
                  </span>
                  <span className={`pill ${g.linked ? "green" : "amber"}`}>
                    {g.linked ? "Active" : g.invitePending ? "Invite pending" : "Unlinked"}
                  </span>
                </article>
              );
            })}
          </div>
          <div className="privacy-callout compact">
            <span>i</span>
            <div>
              <strong>Guardian access is individual</strong>
              <p>Invite links are token paths for now — no outbound email send from this screen.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Staff notes" eyebrow="Household">
          <form onSubmit={saveNotes}>
            <label style={{ display: "block", fontSize: 9, fontWeight: 800, color: "var(--muted)" }}>
              Internal notes
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                rows={5}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 6,
                  border: "1px solid var(--line)",
                  background: "#fbfcfa",
                  padding: 11,
                  fontSize: 11,
                  fontFamily: "inherit",
                }}
              />
            </label>
            <button type="submit" className="secondary-button" style={{ marginTop: 10 }} disabled={savingNotes}>
              {savingNotes ? "Saving…" : "Save notes"}
            </button>
          </form>
        </Panel>
      </div>

      <Panel title="Students" eyebrow="Children">
        {family.students.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 11 }}>No students yet.</p>
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
        <Panel title="Bookings" eyebrow="Service activity">
          {family.activity.bookings.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 11 }}>No tutoring bookings yet.</p>
          ) : (
            family.activity.bookings.map((row) => (
              <div key={row.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
                <strong style={{ fontSize: 11 }}>
                  {row.studentName} · {row.tutorName}
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--muted)" }}>
                  {row.status} · {formatWhen(row.createdAt)}
                </p>
              </div>
            ))
          )}
        </Panel>
        <Panel title="Course enrollments" eyebrow="Service activity">
          {family.activity.enrollments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 11 }}>No course enrollments yet.</p>
          ) : (
            family.activity.enrollments.map((row) => (
              <div key={row.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
                <strong style={{ fontSize: 11 }}>
                  {row.studentName} · {row.courseName}
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--muted)" }}>
                  {row.status} · {formatWhen(row.createdAt)}
                </p>
              </div>
            ))
          )}
        </Panel>
      </div>
    </>
  );
}
