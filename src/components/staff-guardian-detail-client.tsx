"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui";
import { IconPencil, StaffIconButton } from "@/components/staff-action-icons";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  formatGuardianRelationshipRole,
  type GuardianRelationshipRole,
  type StaffGuardianDetail,
} from "@/lib/staff/guardian-shared";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationshipRole: "" | GuardianRelationshipRole;
  isBillingOwner: boolean;
};

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
    relationshipRole: guardian.relationshipRole ?? "",
    isBillingOwner: guardian.isBillingOwner,
  };
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
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
          {roleLabel ? <p className="family-record-hero-meta">{roleLabel}</p> : null}
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

      <div className="profile-layout">
        <Panel title="Identity" eyebrow="Guardian" className="family-equal-panel">
          <div className="family-detail-grid profile-detail-grid">
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
        </Panel>

        <Panel title="Role" eyebrow="Household" className="family-equal-panel">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Parent role</small>
              <strong>{roleLabel || "—"}</strong>
            </span>
            <span>
              <small>Responsible for payment</small>
              <strong>{yesNo(guardian.isBillingOwner)}</strong>
            </span>
            <span>
              <small>Portal</small>
              <strong>{formatStatusLabel(statusKey)}</strong>
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="Family" className="family-equal-panel">
        {guardian.household ? (
          <>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              <Link
                href={`/staff/families/${guardian.household.id}`}
                style={{ color: "var(--blue)", fontWeight: 700 }}
              >
                {guardian.household.displayName}
              </Link>
            </p>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--muted)" }}>
              Open the family record for students, enrollments, and billing card settings.
            </p>
            <button
              type="button"
              className="secondary-button"
              disabled={unassignBusy}
              onClick={() => setConfirmUnassign(true)}
            >
              Unassign from family
            </button>
          </>
        ) : (
          <p className="family-empty" style={{ margin: 0 }}>
            Unassigned — assign this guardian from a Family record.
          </p>
        )}
      </Panel>
    </>
  );
}
