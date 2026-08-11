"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { useFamilyPortal } from "@/components/family-portal-context";
import { PageIntro, Panel } from "@/components/ui";
import { US_STATES } from "@/lib/forms/options";

type Mode = "view" | "edit" | "security";

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
  return [line, cityLine].filter(Boolean).join(" · ") || "Address not set";
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
      const next: ProfileData = {
        guardian: data.guardian,
        household: data.household,
      };
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
      const next: ProfileData = {
        guardian: data.guardian,
        household: data.household,
      };
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

  if (mode === "security") {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="page-back" onClick={() => setMode("view")}>
          ← Family profile
        </button>
        <span className="eyebrow">Account & security</span>
        <h2>Sign-in and password</h2>
        <p style={{ maxWidth: 640, fontSize: 11, color: "var(--muted)" }}>
          Email, password, and sessions are managed by Clerk. Credentials are individual — never share
          a sign-in between guardians.
        </p>
        <div className="privacy-callout" style={{ marginBottom: 16 }}>
          <span>i</span>
          <div>
            <strong>Guardian access is individual</strong>
            <p>Separate invites and passwords apply per adult. No shared credentials.</p>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <UserProfile routing="hash" />
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

  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Profile"
        title="Profile"
        description="Guardian contact and preferences for the signed-in adult. Credentials are never shared between guardians."
        action={
          <Link
            href="/family/students?add=1"
            className="primary-button family-primary"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              background: "var(--coral)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 11,
            }}
          >
            + Add student
          </Link>
        }
      />

      {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading profile…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {savedMessage ? (
        <p style={{ color: "var(--mint, #2f6b4f)", fontSize: 11, marginBottom: 12 }}>{savedMessage}</p>
      ) : null}

      {profile ? (
        <div className="profile-layout">
          <Panel title="Household profile" eyebrow="Family account">
            <div className="family-detail-grid profile-detail-grid" style={{ marginTop: 8 }}>
              <span>
                <small>Family account</small>
                <strong>{profile.household.displayName}</strong>
              </span>
              <span>
                <small>Status</small>
                <strong>{profile.household.status === "active" ? "Active" : "Pending onboarding"}</strong>
              </span>
              <span>
                <small>Primary phone</small>
                <strong>{profile.household.primaryPhone || "—"}</strong>
              </span>
              <span>
                <small>Address</small>
                <strong>{formatAddress(profile.household)}</strong>
              </span>
            </div>
            {profile.household.status !== "active" ? (
              <p style={{ marginTop: 12, fontSize: 10 }}>
                <Link href="/family/onboarding" style={{ color: "var(--blue)", fontWeight: 800 }}>
                  Complete onboarding to unlock the portal →
                </Link>
              </p>
            ) : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button
                type="button"
                className="family-primary"
                style={{ border: 0, padding: "10px 14px", cursor: "pointer" }}
                onClick={() => {
                  setSavedMessage(null);
                  setError(null);
                  setForm(formFromProfile(profile));
                  setMode("edit");
                }}
              >
                Edit profile
              </button>
              <Link
                href="/family/students"
                className="text-button"
                style={{ color: "var(--blue)", fontWeight: 800, fontSize: 10, alignSelf: "center" }}
              >
                Manage students →
              </Link>
            </div>
          </Panel>

          <Panel title="Guardian contact" eyebrow="Signed-in adult">
            <div className="family-detail-grid profile-detail-grid" style={{ marginTop: 8 }}>
              <span>
                <small>Name</small>
                <strong>
                  {profile.guardian.firstName} {profile.guardian.lastName}
                </strong>
              </span>
              <span>
                <small>Sign-in email</small>
                <strong>{profile.guardian.email || "—"}</strong>
              </span>
              <span>
                <small>Mobile</small>
                <strong>
                  {profile.guardian.phone?.trim()
                    ? profile.guardian.phone
                    : "Not set — add in Edit profile"}
                </strong>
              </span>
              <span>
                <small>Billing owner</small>
                <strong>{profile.guardian.isBillingOwner ? "Yes" : "No"}</strong>
              </span>
            </div>
            <button
              type="button"
              className="family-secondary"
              style={{ marginTop: 14 }}
              onClick={() => setMode("security")}
            >
              Account &amp; Security
            </button>
            <div className="privacy-callout profile-privacy-callout" style={{ marginTop: 14 }}>
              <span>i</span>
              <div>
                <strong>Restricted changes require staff</strong>
                <p>
                  Billing ownership, another guardian’s identity/permissions, consent history, and
                  protected Student records stay with staff.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
