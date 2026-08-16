"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { StaffEditSectionLabel, StaffRecordEditShell } from "@/components/staff-record-edit-shell";
import { isValidPhone } from "@/lib/validation/contact";

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type FamilyDetail = {
  id: string;
  displayName: string;
  primaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  zohoCrmId: string | null;
  zohoCrmUrl: string | null;
  billingOwnerGuardianId: string | null;
  cardOnFile: boolean;
  autoCharge: boolean;
  guardians: GuardianRow[];
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
  cardOnFile: boolean;
  autoCharge: boolean;
};

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
    cardOnFile: next.cardOnFile,
    autoCharge: next.autoCharge,
  };
}

export function StaffFamilyEditClient({ familyId }: { familyId: string }) {
  const router = useRouter();
  const toast = useAppToast();
  const detailHref = `/staff/families/${familyId}`;
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [householdForm, setHouseholdForm] = useState<HouseholdEdit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${familyId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load family.");
        return;
      }
      const next = data.family as FamilyDetail;
      setFamily(next);
      setHouseholdForm(householdFormFromFamily(next));
    } catch {
      setError("Unable to load family.");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goBack() {
    router.push(detailHref);
  }

  async function saveHousehold(event: FormEvent) {
    event.preventDefault();
    if (!householdForm || !family || saving) return;
    if (!householdForm.displayName.trim()) {
      setError("Household name is required.");
      toast.error("Household name is required.");
      return;
    }
    if (householdForm.primaryPhone.trim() && !isValidPhone(householdForm.primaryPhone)) {
      setError("Enter a valid household phone number.");
      toast.error("Enter a valid household phone number.");
      return;
    }
    if (family.guardians.length > 0 && !householdForm.billingOwnerGuardianId) {
      setError("Select who is responsible for payment.");
      toast.error("Select who is responsible for payment.");
      return;
    }
    setSaving(true);
    setError(null);
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
          cardOnFile: householdForm.cardOnFile,
          autoCharge: householdForm.autoCharge,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save household.");
        toast.error(data.error || "Unable to save household.");
        return;
      }
      toast.success("Household updated.");
      router.push(detailHref);
    } catch {
      setError("Unable to save household.");
      toast.error("Unable to save household.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading family…</p>;
  if (error && !householdForm) return <p className="form-error">{error}</p>;
  if (!family || !householdForm) return null;

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <StaffRecordEditShell
        backHref={detailHref}
        backLabel="← Family detail"
        title={`Edit ${family.displayName}`}
        saving={saving}
        saveLabel="Save household"
        error={error}
        onCancel={goBack}
        onSubmit={(event) => void saveHousehold(event)}
      >
        <StaffEditSectionLabel>Household</StaffEditSectionLabel>
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
          <AddressAutocompleteInput
            value={householdForm.addressLine1}
            onChange={(addressLine1) => setHouseholdForm({ ...householdForm, addressLine1 })}
            onSelect={(suggestion) =>
              setHouseholdForm({
                ...householdForm,
                addressLine1: suggestion.addressLine1,
                city: suggestion.city || householdForm.city,
                state: suggestion.state || householdForm.state,
                postalCode: suggestion.postalCode || householdForm.postalCode,
              })
            }
          />
        </label>
        <label>
          Billing address line 2
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
          Responsible for payment
          <select
            value={householdForm.billingOwnerGuardianId}
            onChange={(e) => setHouseholdForm({ ...householdForm, billingOwnerGuardianId: e.target.value })}
            required={family.guardians.length > 0}
          >
            <option value="">{family.guardians.length > 0 ? "Select guardian…" : "Unassigned"}</option>
            {family.guardians.map((g) => (
              <option key={g.id} value={g.id}>
                {g.firstName} {g.lastName} ({g.email})
              </option>
            ))}
          </select>
        </label>
        <label>
          Card on file
          <select
            value={householdForm.cardOnFile ? "yes" : "no"}
            onChange={(e) => setHouseholdForm({ ...householdForm, cardOnFile: e.target.value === "yes" })}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          Auto-charge
          <select
            value={householdForm.autoCharge ? "yes" : "no"}
            onChange={(e) => setHouseholdForm({ ...householdForm, autoCharge: e.target.value === "yes" })}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </StaffRecordEditShell>
    </>
  );
}
