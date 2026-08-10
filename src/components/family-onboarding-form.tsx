"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilyPortal } from "@/components/family-portal-context";
import { US_STATES } from "@/lib/forms/options";

type OnboardingForm = {
  displayName: string;
  primaryPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

type BillingOwner = {
  firstName: string;
  lastName: string;
  email: string;
};

const emptyForm: OnboardingForm = {
  displayName: "",
  primaryPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

export function FamilyOnboardingForm() {
  const router = useRouter();
  const { setHouseholdName, setHouseholdStatus, setDisplayName } = useFamilyPortal();
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [billingOwner, setBillingOwner] = useState<BillingOwner | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/family/onboarding");
        const data = await response.json();
        if (!response.ok || !data.ok) {
          setError(data.error || "Unable to load household.");
          return;
        }
        setForm({
          displayName: data.household.displayName ?? "",
          primaryPhone: data.household.primaryPhone ?? "",
          addressLine1: data.household.addressLine1 ?? "",
          addressLine2: data.household.addressLine2 ?? "",
          city: data.household.city ?? "",
          state: data.household.state ?? "",
          postalCode: data.household.postalCode ?? "",
        });
        setBillingOwner(data.billingOwner);
        setStatus(data.household.status);
        if (data.household.status === "active") setDone(true);
      } catch {
        setError("Unable to load household.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const valid =
    form.displayName.trim() &&
    form.primaryPhone.trim() &&
    form.addressLine1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save onboarding.");
        return;
      }
      setStatus(data.householdStatus);
      setDone(true);
      setHouseholdStatus(data.householdStatus ?? "active");
      if (data.householdName) {
        setHouseholdName(data.householdName);
        setDisplayName(data.householdName);
      }
      void fetch("/api/bootstrap", { method: "POST" });
    } catch {
      setError("Unable to save onboarding.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading household…</p>;
  }

  if (done) {
    return (
      <div className="success-state">
        <span>✓</span>
        <h3>Family account ready</h3>
        <p>
          Your household profile is active{status === "active" ? "" : ""}. Add one or more Student
          profiles, then choose tutoring or a cohort course.
        </p>
        <div className="success-actions">
          <button
            type="button"
            className="family-primary"
            onClick={() => router.push("/family/students?add=1")}
          >
            + Add first student
          </button>
          <button type="button" className="secondary-button" onClick={() => router.push("/family")}>
            Enter family dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="wizard-stage" onSubmit={submit}>
      <h3>Complete the initial Family profile</h3>
      <p>
        Confirm one shared household. Billing owner is the signed-in guardian from account creation.
        Credentials are never shared between adults.
      </p>
      <div className="input-grid">
        <label>
          Family account name
          <input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            required
          />
        </label>
        <label>
          Billing owner
          <input
            value={
              billingOwner
                ? `${billingOwner.firstName} ${billingOwner.lastName} · ${billingOwner.email}`
                : "Signed-in guardian"
            }
            readOnly
          />
        </label>
        <label>
          Primary phone
          <input
            value={form.primaryPhone}
            onChange={(event) => setForm({ ...form, primaryPhone: event.target.value })}
            required
          />
        </label>
        <label>
          Address line 1
          <input
            value={form.addressLine1}
            onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
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
      {!valid ? (
        <div className="validation-hint">Complete household name, phone, and address to unlock.</div>
      ) : (
        <div className="validation-line">
          <span>✓</span> Required profile details are ready
        </div>
      )}
      {error ? <div className="validation-hint">{error}</div> : null}
      <div className="wizard-footer">
        <button type="button" className="wizard-back" onClick={() => router.push("/family")}>
          ← Home
        </button>
        <button type="submit" className="family-primary" disabled={!valid || saving}>
          {saving ? "Saving…" : "Unlock portal"}
        </button>
      </div>
    </form>
  );
}
