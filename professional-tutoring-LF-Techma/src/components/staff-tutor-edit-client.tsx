"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import { StaffEditSectionLabel, StaffRecordEditShell } from "@/components/staff-record-edit-shell";

type TutorDetail = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

type ProfileForm = {
  displayName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

function toProfileForm(tutor: TutorDetail): ProfileForm {
  return {
    displayName: tutor.displayName,
    email: tutor.email ?? "",
    phone: tutor.phone ?? "",
    addressLine1: tutor.addressLine1 ?? "",
    addressLine2: tutor.addressLine2 ?? "",
    city: tutor.city ?? "",
    state: tutor.state ?? "",
    postalCode: tutor.postalCode ?? "",
  };
}

export function StaffTutorEditClient({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const toast = useAppToast();
  const detailHref = `/staff/tutors/${tutorId}`;
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load tutor.");
        return;
      }
      const next = data.tutor as TutorDetail;
      setTutor(next);
      setProfileForm(toProfileForm(next));
    } catch {
      setError("Unable to load tutor.");
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goBack() {
    router.push(detailHref);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileForm.displayName,
          email: profileForm.email || null,
          phone: profileForm.phone || null,
          addressLine1: profileForm.addressLine1 || null,
          addressLine2: profileForm.addressLine2 || null,
          city: profileForm.city || null,
          state: profileForm.state || null,
          postalCode: profileForm.postalCode || null,
          country: "United States",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save tutor.");
        toast.error(data.error || "Unable to save tutor.");
        return;
      }
      toast.success("Tutor saved.");
      router.push(detailHref);
    } catch {
      setError("Unable to save tutor.");
      toast.error("Unable to save tutor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading tutor…</p>;
  if (error && !profileForm) return <p className="form-error">{error}</p>;
  if (!tutor || !profileForm) return null;

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <StaffRecordEditShell
        backHref={detailHref}
        backLabel="← Tutor detail"
        title={`Edit ${tutor.displayName}`}
        saving={saving}
        saveLabel="Save profile"
        error={error}
        onCancel={goBack}
        onSubmit={(event) => void saveProfile(event)}
      >
        <StaffEditSectionLabel>Profile</StaffEditSectionLabel>
        <div className="staff-edit-field-row staff-edit-field-row--3">
          <label>
            Display name
            <input
              value={profileForm.displayName}
              onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
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
        </div>

        <StaffEditSectionLabel>Mailing address</StaffEditSectionLabel>
        <div className="staff-edit-field-row staff-edit-field-row--3">
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
        </div>
        <div className="staff-edit-field-row staff-edit-field-row--3">
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
            <input value="United States" readOnly />
          </label>
        </div>
      </StaffRecordEditShell>
    </>
  );
}
