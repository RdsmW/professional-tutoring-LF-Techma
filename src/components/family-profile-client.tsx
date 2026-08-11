"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { useFamilyPortal } from "@/components/family-portal-context";
import { US_STATES } from "@/lib/forms/options";

type Mode = "view" | "edit" | "security";

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isBillingOwner: boolean;
  linked: boolean;
  invitePending: boolean;
};

type ProfileData = {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    isBillingOwner: boolean;
  };
  household: {
    id: string;
    displayName: string;
    status: string;
    primaryPhone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  guardians: GuardianRow[];
  studentCount: number;
  hasStudents: boolean;
};

type EditForm = {
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
  primaryPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

const clerkFamilyAppearance = {
  variables: {
    colorPrimary: "#ca6d52",
    colorText: "#172133",
    colorTextSecondary: "#697486",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#172133",
    colorNeutral: "#24382f",
    borderRadius: "2px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontFamilyButtons: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  elements: {
    rootBox: "family-clerk-root",
    cardBox: "family-clerk-card",
    navbar: "family-clerk-navbar",
    scrollBox: "family-clerk-scroll",
  },
} as const;

function emptyForm(): EditForm {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    displayName: "",
    primaryPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  };
}

function formFromProfile(data: ProfileData): EditForm {
  return {
    firstName: data.guardian.firstName,
    lastName: data.guardian.lastName,
    phone: data.guardian.phone,
    displayName: data.household.displayName,
    primaryPhone: data.household.primaryPhone,
    addressLine1: data.household.addressLine1,
    addressLine2: data.household.addressLine2,
    city: data.household.city,
    state: data.household.state,
    postalCode: data.household.postalCode,
  };
}

function formatAddress(household: ProfileData["household"]) {
  const line = [household.addressLine1, household.addressLine2].filter(Boolean).join(", ");
  const cityLine = [household.city, household.state, household.postalCode].filter(Boolean).join(", ");
  return [line, cityLine].filter(Boolean).join(" · ") || "—";
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
}

function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Guardian";
}

function parseProfilePayload(data: Record<string, unknown>): ProfileData {
  return {
    guardian: data.guardian as ProfileData["guardian"],
    household: data.household as ProfileData["household"],
    guardians: Array.isArray(data.guardians) ? (data.guardians as GuardianRow[]) : [],
    studentCount: Number(data.studentCount ?? 0),
    hasStudents: Boolean(data.hasStudents ?? Number(data.studentCount ?? 0) > 0),
  };
}

function householdProfileComplete(household: ProfileData["household"]) {
  return Boolean(
    household.status === "active" &&
      household.primaryPhone.trim() &&
      household.addressLine1.trim() &&
      household.city.trim() &&
      household.state.trim() &&
      household.postalCode.trim(),
  );
}

export function FamilyProfileClient() {
  const { setDisplayName, setHouseholdName } = useFamilyPortal();
  const [mode, setMode] = useState<Mode>("view");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family/profile");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load profile.");
        return;
      }
      const next = parseProfilePayload(data);
      setProfile(next);
      setForm(formFromProfile(next));
    } catch {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.displayName.trim() &&
    form.primaryPhone.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim();

  const billingOwnerName = useMemo(() => {
    if (!profile) return "—";
    const owner = profile.guardians.find((row) => row.isBillingOwner);
    if (owner) return fullName(owner.firstName, owner.lastName);
    if (profile.guardian.isBillingOwner) {
      return fullName(profile.guardian.firstName, profile.guardian.lastName);
    }
    return "—";
  }, [profile]);

  const completionItems = useMemo(() => {
    if (!profile) return [];
    const active = profile.household.status === "active";
    const householdDone = householdProfileComplete(profile.household);
    const hasBillingOwner =
      profile.guardians.some((row) => row.isBillingOwner) || profile.guardian.isBillingOwner;
    const studentLabel = `${profile.studentCount} student profile${profile.studentCount === 1 ? "" : "s"} added`;

    return [
      { label: "Primary adult account created", done: true },
      { label: "Shared household profile complete", done: householdDone },
      { label: "Guardian permissions assigned", done: hasBillingOwner },
      { label: "Communication consent", done: false, note: "Not collected yet" },
      { label: "Full portal available", done: active },
      { label: studentLabel, done: profile.studentCount > 0 },
    ];
  }, [profile]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const response = await fetch("/api/family/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save profile.");
        return;
      }
      const next = parseProfilePayload(data);
      setProfile(next);
      setForm(formFromProfile(next));
      if (data.displayName) setDisplayName(data.displayName);
      if (data.householdName) setHouseholdName(data.householdName);
      setSavedMessage("Profile saved.");
      setMode("view");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    if (!profile) return;
    setSavedMessage(null);
    setError(null);
    setForm(formFromProfile(profile));
    setMode("edit");
  }

  if (mode === "security") {
    return (
      <section className="wizard-shell panel family-clerk-profile">
        <button type="button" className="page-back" onClick={() => setMode("view")}>
          ← Family profile
        </button>
        <span className="eyebrow">Account & security</span>
        <h2>Sign-in and password</h2>
        <p className="wizard-lead" style={{ fontSize: 11, color: "var(--muted)" }}>
          Email, password, and sessions are managed securely for this adult account. Credentials are
          individual — never share a sign-in between guardians.
        </p>
        <div className="privacy-callout compact">
          <span>i</span>
          <div>
            <strong>Guardian access is individual</strong>
            <p>Separate invites and passwords apply per adult. No shared credentials.</p>
          </div>
        </div>
        <div className="family-clerk-profile-widget">
          <UserProfile routing="hash" appearance={clerkFamilyAppearance} />
        </div>
      </section>
    );
  }

  if (mode === "edit") {
    return (
      <section className="wizard-shell panel">
        <button
          type="button"
          className="page-back"
          onClick={() => {
            if (profile) setForm(formFromProfile(profile));
            setError(null);
            setMode("view");
          }}
        >
          ← Family profile
        </button>
        <span className="eyebrow">My guardian profile</span>
        <h2>Edit your information</h2>
        <p style={{ maxWidth: 640, fontSize: 11, color: "var(--muted)" }}>
          Update your own identity and shared household contact details. Another guardian’s identity
          and billing ownership are not changed here.
        </p>
        <form className="wizard-stage" onSubmit={saveProfile}>
          <div className="input-grid">
            <label>
              First name
              <input
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </label>
            <label>
              Mobile phone
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <label>
              Family account name
              <input
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                required
              />
            </label>
            <label>
              Household primary phone
              <input
                value={form.primaryPhone}
                onChange={(event) => setForm({ ...form, primaryPhone: event.target.value })}
                required
              />
            </label>
            <label>
              Address line 1
              <AddressAutocompleteInput
                value={form.addressLine1}
                onChange={(addressLine1) => setForm({ ...form, addressLine1 })}
                onSelect={(suggestion) =>
                  setForm({
                    ...form,
                    addressLine1: suggestion.addressLine1,
                    city: suggestion.city || form.city,
                    state: suggestion.state || form.state,
                    postalCode: suggestion.postalCode || form.postalCode,
                  })
                }
                required
              />
            </label>
            <label>
              Address line 2
              <input
                value={form.addressLine2}
                onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
              />
            </label>
            <label>
              City
              <input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                required
              />
            </label>
            <label>
              State
              <select
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
                required
              >
                <option value="">Select state</option>
                {US_STATES.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Postal code
              <input
                value={form.postalCode}
                onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                required
              />
            </label>
          </div>
          <div className="privacy-callout">
            <span>i</span>
            <div>
              <strong>Restricted changes require staff</strong>
              <p>
                Billing ownership, another guardian’s identity/permissions, consent history, staff notes,
                and protected Student records are outside this form.
              </p>
            </div>
          </div>
          {!valid ? (
            <div className="validation-hint">Complete name, household phone, and address to save.</div>
          ) : null}
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-back"
              onClick={() => {
                if (profile) setForm(formFromProfile(profile));
                setError(null);
                setMode("view");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="family-primary" disabled={!valid || saving}>
              {saving ? "Saving…" : "Save my profile"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  const isActive = profile?.household.status === "active";

  return (
    <>
      <section className="view-intro">
        <div>
          <span className="eyebrow">Separate adult accounts · shared household</span>
          <h2>Family profile</h2>
          <p>
            Manage guardian access, billing ownership, and household details; student records remain
            the children beneath this shared family account.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary-button" onClick={openEdit} disabled={!profile}>
            Edit my profile
          </button>
          <Link href="/family/students?add=1" className="family-primary" style={{ textDecoration: "none" }}>
            + Add student
          </Link>
        </div>
      </section>

      {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading profile…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {savedMessage ? (
        <p style={{ color: "var(--mint, #2f6b4f)", fontSize: 11, marginBottom: 12 }}>{savedMessage}</p>
      ) : null}

      {profile ? (
        <section className="profile-layout">
          <article className="panel booking-form">
            {isActive ? (
              <div className="form-step">
                <span>✓</span>
                <div>
                  <strong>Initial family onboarding complete</strong>
                  <small>Full Family Portal access is available.</small>
                </div>
              </div>
            ) : (
              <div className="form-step pending">
                <span>○</span>
                <div>
                  <strong>Family onboarding in progress</strong>
                  <small>
                    <Link href="/family/onboarding" style={{ color: "var(--blue)", fontWeight: 800 }}>
                      Complete onboarding to unlock the portal →
                    </Link>
                  </small>
                </div>
              </div>
            )}

            <div className="input-grid profile-readonly-grid">
              <label>
                Primary guardian
                <input
                  value={fullName(profile.guardian.firstName, profile.guardian.lastName)}
                  readOnly
                />
              </label>
              <label>
                Preferred / first name
                <input value={profile.guardian.firstName || "—"} readOnly />
              </label>
              <label>
                Sign-in email
                <input value={profile.guardian.email || "—"} readOnly />
              </label>
              <label>
                Mobile
                <input value={profile.guardian.phone?.trim() || "Not set"} readOnly />
              </label>
              <label>
                Billing contact
                <input value={billingOwnerName} readOnly />
              </label>
              <label>
                Household phone
                <input value={profile.household.primaryPhone || "—"} readOnly />
              </label>
              <label>
                Household address
                <input value={formatAddress(profile.household)} readOnly />
              </label>
              <label>
                Portal policy
                <input value="Portal policy · in effect" readOnly />
              </label>
            </div>

            <div className="guardian-access-preview">
              {(profile.guardians.length ? profile.guardians : [
                {
                  id: profile.guardian.id,
                  firstName: profile.guardian.firstName,
                  lastName: profile.guardian.lastName,
                  email: profile.guardian.email,
                  phone: profile.guardian.phone,
                  isBillingOwner: profile.guardian.isBillingOwner,
                  linked: true,
                  invitePending: false,
                },
              ]).map((row) => {
                const pills = [
                  row.linked ? "Own login" : null,
                  row.isBillingOwner ? "Billing owner" : null,
                  !row.linked && !row.invitePending ? "Listed" : null,
                ].filter(Boolean);
                return (
                  <article key={row.id}>
                    <span className="mini-avatar">{initials(row.firstName, row.lastName)}</span>
                    <span>
                      <strong>{fullName(row.firstName, row.lastName)}</strong>
                      <small>{pills.join(" · ") || "Guardian"}</small>
                    </span>
                    <span className={`pill ${row.invitePending ? "amber" : "green"}`}>
                      {row.invitePending ? "Invite pending" : "Active"}
                    </span>
                  </article>
                );
              })}
            </div>

            <div className="privacy-callout compact">
              <span>i</span>
              <div>
                <strong>Guardian access is individual</strong>
                <p>
                  Additional guardians receive their own invitation and password. Permissions can
                  differ; no adult shares another guardian’s credentials.
                </p>
              </div>
            </div>

            <div className="profile-actions profile-actions-equal">
              <button type="button" className="family-primary" onClick={openEdit}>
                Edit my profile
              </button>
              <button type="button" className="secondary-button" onClick={() => setMode("security")}>
                Account & security
              </button>
              <Link href="/family/students" className="secondary-button" style={{ textDecoration: "none", textAlign: "center" }}>
                Manage students
              </Link>
            </div>
          </article>

          <article className="panel onboarding-checklist">
            <span className="eyebrow">Account completion</span>
            <h3>Family onboarding</h3>
            {completionItems.map((item) => (
              <div key={item.label} className={item.done ? "complete" : "pending"}>
                <span>{item.done ? "✓" : "○"}</span>
                <span>
                  {item.label}
                  {"note" in item && item.note ? (
                    <small style={{ display: "block", color: "var(--muted)", fontWeight: 600 }}>
                      {item.note}
                    </small>
                  ) : null}
                </span>
              </div>
            ))}
            <Link href="/family/students" className="text-button" style={{ display: "block", marginTop: 10 }}>
              Manage students →
            </Link>
            {!isActive ? (
              <Link href="/family/onboarding" className="text-button" style={{ display: "block" }}>
                Complete onboarding →
              </Link>
            ) : null}
            <p className="profile-invite-note">
              Inviting another guardian is handled by staff for now.
            </p>
          </article>
        </section>
      ) : null}
    </>
  );
}
