"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  StaffEditSectionLabel,
  StaffMultilineField,
  StaffRecordEditShell,
} from "@/components/staff-record-edit-shell";
import type { GuardianRelationshipRole, StaffGuardianDetail } from "@/lib/staff/guardian-shared";
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

export function StaffGuardianEditClient({ guardianId }: { guardianId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const fromFamily = searchParams.get("from") === "family";
  const detailHref = fromFamily
    ? `/staff/guardians/${guardianId}?from=family`
    : `/staff/guardians/${guardianId}`;
  const [guardian, setGuardian] = useState<StaffGuardianDetail | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/guardians/${guardianId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load guardian.");
        return;
      }
      const next = data.guardian as StaffGuardianDetail;
      setGuardian(next);
      setProfileForm(toProfileForm(next));
    } catch {
      setError("Unable to load guardian.");
    } finally {
      setLoading(false);
    }
  }, [guardianId]);

  useEffect(() => {
    void load();
  }, [load]);

  const takenRoles = useMemo(() => {
    if (!guardian) return new Set<GuardianRelationshipRole>();
    const roles = new Set(
      guardian.householdGuardians
        .map((row) => row.relationshipRole)
        .filter((role): role is GuardianRelationshipRole => role === "parent_1" || role === "parent_2"),
    );
    if (guardian.relationshipRole) roles.delete(guardian.relationshipRole);
    return roles;
  }, [guardian]);

  function goBack() {
    router.push(detailHref);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || saving) return;

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setError("First and last name are required.");
      toast.error("First and last name are required.");
      return;
    }
    if (!isValidEmail(profileForm.email)) {
      setError("Enter a valid email address.");
      toast.error("Enter a valid email address.");
      return;
    }
    if (profileForm.phone.trim() && !isValidPhone(profileForm.phone)) {
      setError("Enter a valid phone number.");
      toast.error("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    setError(null);
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
        setError(data.error || "Unable to save guardian.");
        toast.error(data.error || "Unable to save guardian.");
        return;
      }
      toast.success("Guardian updated.");
      router.push(detailHref);
    } catch {
      setError("Unable to save guardian.");
      toast.error("Unable to save guardian.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading guardian…</p>;
  if (error && !profileForm) return <p className="form-error">{error}</p>;
  if (!guardian || !profileForm) return null;

  const fullName = `${guardian.firstName} ${guardian.lastName}`.trim();

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <StaffRecordEditShell
        backHref={detailHref}
        backLabel="← Guardian detail"
        title={`Edit ${fullName}`}
        saving={saving}
        saveLabel="Save guardian"
        error={error}
        onCancel={goBack}
        onSubmit={(event) => void saveProfile(event)}
      >
        <StaffEditSectionLabel>Identity</StaffEditSectionLabel>
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

        <StaffEditSectionLabel>Mailing address</StaffEditSectionLabel>
        <label>
          Street
          <AddressAutocompleteInput
            value={profileForm.addressLine1}
            onChange={(addressLine1) => setProfileForm({ ...profileForm, addressLine1 })}
            onSelect={(suggestion) =>
              setProfileForm({
                ...profileForm,
                addressLine1: suggestion.addressLine1,
                city: suggestion.city || profileForm.city,
                state: suggestion.state || profileForm.state,
                postalCode: suggestion.postalCode || profileForm.postalCode,
              })
            }
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

        <StaffEditSectionLabel>Household role</StaffEditSectionLabel>
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
            onChange={(e) => setProfileForm({ ...profileForm, isBillingOwner: e.target.value === "yes" })}
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
            To remove payment responsibility, set another household guardian as payer on the Family page first.
          </p>
        ) : null}

        <StaffEditSectionLabel>Other information</StaffEditSectionLabel>
        <StaffMultilineField
          label="Other information"
          value={profileForm.otherInformation}
          onChange={(otherInformation) => setProfileForm({ ...profileForm, otherInformation })}
          rows={2}
          placeholder="Optional context about this guardian…"
          hideLabel
        />
      </StaffRecordEditShell>
    </>
  );
}
