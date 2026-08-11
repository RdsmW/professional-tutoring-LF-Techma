"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";

type FamilyDetail = {
  id: string;
  displayName: string;
  status: string;
  primaryPhone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  guardians: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isBillingOwner: boolean;
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
};

export function StaffFamilyDetailClient({ familyId }: { familyId: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

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

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading family…</p>;
  if (error && !family) return <p className="form-error">{error}</p>;
  if (!family) return null;

  const address = [family.addressLine1, family.city, family.state, family.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Link href="/staff/families" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Families
      </Link>
      <PageIntro
        eyebrow="Staff · Family Detail"
        title={family.displayName}
        description="Household record with guardians, students, and invite status."
        action={<span className="pill">{family.status}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {inviteMessage ? <p style={{ fontSize: 11, marginBottom: 12 }}>{inviteMessage}</p> : null}

      <div className="profile-layout">
        <Panel title="Household" eyebrow="Account">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Status</small>
              <strong>{family.status}</strong>
            </span>
            <span>
              <small>Primary phone</small>
              <strong>{family.primaryPhone || "—"}</strong>
            </span>
            <span>
              <small>Address</small>
              <strong>{address || "—"}</strong>
            </span>
          </div>
        </Panel>

        <Panel title="Guardians" eyebrow="Adults">
          {family.guardians.map((g) => (
            <div key={g.id} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
              <strong>
                {g.firstName} {g.lastName}
                {g.isBillingOwner ? " · Billing owner" : ""}
              </strong>
              <p style={{ margin: "4px 0", fontSize: 11 }}>{g.email}</p>
              <p style={{ margin: 0, fontSize: 10, color: "var(--muted)" }}>
                {g.linked ? "Linked to Clerk" : g.invitePending ? "Invite pending" : "Not linked"}
              </p>
              {g.invitePath ? (
                <p style={{ margin: "6px 0 0", fontSize: 10 }}>
                  Accept path: <code>{g.invitePath}</code>
                </p>
              ) : null}
              {!g.linked ? (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginTop: 8 }}
                  onClick={() => void refreshInvite(g.id)}
                >
                  {g.invitePath ? "Regenerate invite" : "Create invite"}
                </button>
              ) : null}
            </div>
          ))}
        </Panel>
      </div>

      <Panel title="Students" eyebrow="Children">
        {family.students.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 11 }}>No students yet.</p>
        ) : (
          family.students.map((s) => (
            <div key={s.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
              <strong>{s.displayName}</strong>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--muted)" }}>
                {s.gradeLabel || "Grade pending"} · {s.schoolName || "School pending"} · {s.lifecycle}
              </p>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}
