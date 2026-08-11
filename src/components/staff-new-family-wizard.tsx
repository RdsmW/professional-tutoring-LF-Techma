"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";

const STEPS = ["Match", "Household", "Guardians", "Students", "Review"] as const;

type MatchCandidate = {
  householdId: string;
  householdName: string;
  householdStatus: string;
  guardian: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    matchOn: Array<"email" | "phone">;
  };
};

type Draft = {
  matchEmail: string;
  matchPhone: string;
  displayName: string;
  primaryPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  secondFirstName: string;
  secondLastName: string;
  secondEmail: string;
  secondPhone: string;
  studentDisplayName: string;
  secondStudentDisplayName: string;
  provenanceNotes: string;
};

const emptyDraft: Draft = {
  matchEmail: "",
  matchPhone: "",
  displayName: "",
  primaryPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  billingFirstName: "",
  billingLastName: "",
  billingEmail: "",
  billingPhone: "",
  secondFirstName: "",
  secondLastName: "",
  secondEmail: "",
  secondPhone: "",
  studentDisplayName: "",
  secondStudentDisplayName: "",
  provenanceNotes: "",
};

export function StaffNewFamilyWizard({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondGuardianOpen, setSecondGuardianOpen] = useState(false);
  const [secondStudentOpen, setSecondStudentOpen] = useState(false);
  const [secondMatchCandidates, setSecondMatchCandidates] = useState<MatchCandidate[]>([]);
  const [secondMatchChecked, setSecondMatchChecked] = useState(false);

  const hasMatches = candidates.length > 0;

  const householdValid = Boolean(draft.displayName.trim());
  const secondGuardianComplete =
    Boolean(draft.secondFirstName.trim()) &&
    Boolean(draft.secondLastName.trim()) &&
    Boolean(draft.secondEmail.trim());
  const secondGuardianEmpty =
    !draft.secondFirstName.trim() && !draft.secondLastName.trim() && !draft.secondEmail.trim();
  const guardiansValid = Boolean(
    draft.billingFirstName.trim() &&
      draft.billingLastName.trim() &&
      draft.billingEmail.trim() &&
      (!secondGuardianOpen || secondGuardianComplete || secondGuardianEmpty),
  );

  const reviewLines = useMemo(() => {
    const lines = [
      `Household → ${draft.displayName.trim() || "(unnamed)"}`,
      `Guardian → ${draft.billingFirstName.trim()} ${draft.billingLastName.trim()} · ${draft.billingEmail.trim()} · Billing owner`,
    ];
    if (draft.secondEmail.trim()) {
      lines.push(
        `Guardian → ${draft.secondFirstName.trim()} ${draft.secondLastName.trim()} · ${draft.secondEmail.trim()}`,
      );
    }
    if (draft.studentDisplayName.trim()) {
      lines.push(`Student → ${draft.studentDisplayName.trim()}`);
    }
    if (draft.secondStudentDisplayName.trim()) {
      lines.push(`Student → ${draft.secondStudentDisplayName.trim()}`);
    }
    if (draft.provenanceNotes.trim()) {
      lines.push(`Source → ${draft.provenanceNotes.trim()}`);
    }
    return lines;
  }, [draft]);

  function patch(partial: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  async function runMatch() {
    if (matching) return;
    setMatching(true);
    setError(null);
    setSearched(false);
    try {
      const params = new URLSearchParams();
      if (draft.matchEmail.trim()) params.set("email", draft.matchEmail.trim());
      if (draft.matchPhone.trim()) params.set("phone", draft.matchPhone.trim());
      const response = await fetch(`/api/staff/families/match?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to search for matches.");
        return;
      }
      setCandidates(data.candidates ?? []);
      setSearched(true);
      if (draft.matchEmail.trim() && !draft.billingEmail.trim()) {
        patch({ billingEmail: draft.matchEmail.trim() });
      }
      if (draft.matchPhone.trim() && !draft.primaryPhone.trim()) {
        patch({ primaryPhone: draft.matchPhone.trim(), billingPhone: draft.matchPhone.trim() });
      }
    } catch {
      setError("Unable to search for matches.");
    } finally {
      setMatching(false);
    }
  }

  function continueAsNew() {
    if (draft.matchEmail.trim() && !draft.billingEmail.trim()) {
      patch({ billingEmail: draft.matchEmail.trim() });
    }
    if (draft.matchPhone.trim()) {
      patch({
        primaryPhone: draft.primaryPhone.trim() || draft.matchPhone.trim(),
        billingPhone: draft.billingPhone.trim() || draft.matchPhone.trim(),
      });
    }
    setStep(2);
  }

  async function checkSecondGuardianMatch() {
    const email = draft.secondEmail.trim();
    const phone = draft.secondPhone.trim();
    if (!email && !phone) {
      setSecondMatchCandidates([]);
      setSecondMatchChecked(true);
      return;
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (phone) params.set("phone", phone);
      const response = await fetch(`/api/staff/families/match?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to check second guardian.");
        return;
      }
      setSecondMatchCandidates(data.candidates ?? []);
      setSecondMatchChecked(true);
    } catch {
      setError("Unable to check second guardian.");
    }
  }

  async function createFamily() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draft.displayName,
          primaryPhone: draft.primaryPhone,
          addressLine1: draft.addressLine1,
          addressLine2: draft.addressLine2,
          city: draft.city,
          state: draft.state,
          postalCode: draft.postalCode,
          notes: draft.provenanceNotes,
          billingFirstName: draft.billingFirstName,
          billingLastName: draft.billingLastName,
          billingEmail: draft.billingEmail,
          billingPhone: draft.billingPhone,
          secondFirstName: secondGuardianOpen && secondGuardianComplete ? draft.secondFirstName : "",
          secondLastName: secondGuardianOpen && secondGuardianComplete ? draft.secondLastName : "",
          secondEmail: secondGuardianOpen && secondGuardianComplete ? draft.secondEmail : "",
          secondPhone: secondGuardianOpen && secondGuardianComplete ? draft.secondPhone : "",
          studentDisplayName: draft.studentDisplayName,
          secondStudentDisplayName: secondStudentOpen ? draft.secondStudentDisplayName : "",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create family.");
        return;
      }
      router.push(`/staff/families/${data.familyId}`);
    } catch {
      setError("Unable to create family.");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!searched) {
        setError("Run the identity search before continuing.");
        return;
      }
      continueAsNew();
      return;
    }
    if (step === 2 && !householdValid) {
      setError("Household name is required.");
      return;
    }
    if (step === 3) {
      if (!guardiansValid) {
        setError("Billing guardian name and email are required.");
        return;
      }
      if (secondGuardianOpen && !secondGuardianEmpty && !secondGuardianComplete) {
        setError("Complete second guardian name and email, or clear those fields.");
        return;
      }
      setStep(4);
      return;
    }
    if (step < 5) {
      setStep((prev) => prev + 1);
    }
  }

  return (
    <section className="wizard-shell panel staff-family-wizard">
      <button type="button" className="wizard-close" aria-label="Close" onClick={onCancel}>
        ×
      </button>
      <span className="eyebrow">Staff Operations · New Family</span>
      <h2>Create a connected household</h2>
      <p className="wizard-lead">
        Search existing households by guardian email or phone before creating a new Family account.
      </p>

      <div className="wizard-progress" aria-label={`Step ${step} of ${STEPS.length}`}>
        {STEPS.map((label, index) => {
          const number = index + 1;
          const complete = number < step;
          const active = number === step;
          return (
            <div key={label} className={complete || active ? "complete" : undefined}>
              <span>{complete ? "✓" : number}</span>
              <small>{label}</small>
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="wizard-stage">
          <h3>Search before creating</h3>
          <p>Normalize guardian email and mobile against existing households before advancing.</p>
          <div className="input-grid">
            <label>
              Guardian email
              <input
                type="email"
                value={draft.matchEmail}
                onChange={(e) => {
                  setSearched(false);
                  setCandidates([]);
                  patch({ matchEmail: e.target.value });
                }}
              />
            </label>
            <label>
              Mobile phone
              <input
                value={draft.matchPhone}
                onChange={(e) => {
                  setSearched(false);
                  setCandidates([]);
                  patch({ matchPhone: e.target.value });
                }}
              />
            </label>
          </div>
          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <button
              type="button"
              className="secondary-button"
              disabled={matching || (!draft.matchEmail.trim() && !draft.matchPhone.trim())}
              onClick={() => void runMatch()}
            >
              {matching ? "Searching…" : "Search identity"}
            </button>
          </div>

          {searched && !hasMatches ? (
            <div className="identity-protection-banner">
              <span>✓</span>
              <div>
                <strong>No exact account match</strong>
                <p>Email and mobile do not match an existing household. Safe to continue as a new Family.</p>
              </div>
            </div>
          ) : null}

          {searched && hasMatches ? (
            <>
              <div className="identity-protection-banner" style={{ background: "#f8efe6", borderColor: "#e4d0b8" }}>
                <span>!</span>
                <div>
                  <strong>Possible existing household</strong>
                  <p>
                    Open the existing Family if this is a duplicate, or continue as new if staff confirms these are
                    different people. Full merge queue is a later phase.
                  </p>
                </div>
              </div>
              <div className="table-panel" style={{ marginBottom: 14 }}>
                {candidates.map((candidate) => (
                  <div key={`${candidate.householdId}-${candidate.guardian.id}`} className="family-row" style={{ cursor: "default" }}>
                    <span
                      className="avatar"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "var(--blue-soft)",
                        color: "var(--blue)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                      }}
                    >
                      {candidate.householdName.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{candidate.householdName}</strong>
                      <small>
                        {candidate.householdStatus} · {candidate.guardian.name} · {candidate.guardian.email}
                        {candidate.guardian.phone ? ` · ${candidate.guardian.phone}` : ""} · matched on{" "}
                        {candidate.guardian.matchOn.join(" + ")}
                      </small>
                    </span>
                    <span className="pill">{candidate.householdStatus}</span>
                    <Link href={`/staff/families/${candidate.householdId}`} className="secondary-button" style={{ textDecoration: "none" }}>
                      Open existing
                    </Link>
                  </div>
                ))}
              </div>
              <p style={{ color: "var(--muted)", fontSize: 11, marginBottom: 12 }}>
                Attach / full merge is not available in this slice — use Open existing, or Continue as new below.
              </p>
            </>
          ) : null}

          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={onCancel}>
              ← Cancel
            </button>
            <button type="button" className="family-primary" disabled={!searched} onClick={goNext}>
              {hasMatches ? "Continue as new" : "Continue to household"}
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-stage">
          <h3>Create the shared household</h3>
          <p>The household is the shared container. Guardians receive separate adult accounts.</p>
          <div className="input-grid">
            <label>
              Canonical household name
              <input
                value={draft.displayName}
                onChange={(e) => patch({ displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Primary phone
              <input value={draft.primaryPhone} onChange={(e) => patch({ primaryPhone: e.target.value })} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Address line 1
              <AddressAutocompleteInput
                value={draft.addressLine1}
                onChange={(value) => patch({ addressLine1: value })}
                onSelect={(suggestion) =>
                  patch({
                    addressLine1: suggestion.addressLine1,
                    city: suggestion.city,
                    state: suggestion.state,
                    postalCode: suggestion.postalCode,
                  })
                }
              />
            </label>
            <label>
              Address line 2
              <input value={draft.addressLine2} onChange={(e) => patch({ addressLine2: e.target.value })} />
            </label>
            <label>
              City
              <input value={draft.city} onChange={(e) => patch({ city: e.target.value })} />
            </label>
            <label>
              State
              <input value={draft.state} onChange={(e) => patch({ state: e.target.value })} />
            </label>
            <label>
              Postal code
              <input value={draft.postalCode} onChange={(e) => patch({ postalCode: e.target.value })} />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button type="button" className="family-primary" disabled={!householdValid} onClick={goNext}>
              Add guardians
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-stage">
          <h3>Add guardian / adult accounts</h3>
          <p>Every adult is invited separately. Billing ownership never implies shared credentials. No email is sent from this wizard.</p>
          <div className="input-grid">
            <label>
              Billing guardian first name
              <input
                value={draft.billingFirstName}
                onChange={(e) => patch({ billingFirstName: e.target.value })}
                required
              />
            </label>
            <label>
              Billing guardian last name
              <input
                value={draft.billingLastName}
                onChange={(e) => patch({ billingLastName: e.target.value })}
                required
              />
            </label>
            <label>
              Billing guardian email
              <input
                type="email"
                value={draft.billingEmail}
                onChange={(e) => patch({ billingEmail: e.target.value })}
                required
              />
            </label>
            <label>
              Billing guardian phone
              <input value={draft.billingPhone} onChange={(e) => patch({ billingPhone: e.target.value })} />
            </label>
          </div>

          {!secondGuardianOpen ? (
            <button
              type="button"
              className="text-button"
              style={{ marginTop: 12 }}
              onClick={() => setSecondGuardianOpen(true)}
            >
              + Add another guardian
            </button>
          ) : (
            <>
              <h3 style={{ marginTop: 18 }}>Second guardian (optional)</h3>
              <div className="input-grid">
                <label>
                  First name
                  <input
                    value={draft.secondFirstName}
                    onChange={(e) => {
                      setSecondMatchChecked(false);
                      patch({ secondFirstName: e.target.value });
                    }}
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={draft.secondLastName}
                    onChange={(e) => {
                      setSecondMatchChecked(false);
                      patch({ secondLastName: e.target.value });
                    }}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={draft.secondEmail}
                    onChange={(e) => {
                      setSecondMatchChecked(false);
                      setSecondMatchCandidates([]);
                      patch({ secondEmail: e.target.value });
                    }}
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={draft.secondPhone}
                    onChange={(e) => {
                      setSecondMatchChecked(false);
                      setSecondMatchCandidates([]);
                      patch({ secondPhone: e.target.value });
                    }}
                  />
                </label>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="secondary-button" onClick={() => void checkSecondGuardianMatch()}>
                  Check for existing household
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSecondGuardianOpen(false);
                    setSecondMatchChecked(false);
                    setSecondMatchCandidates([]);
                    patch({
                      secondFirstName: "",
                      secondLastName: "",
                      secondEmail: "",
                      secondPhone: "",
                    });
                  }}
                >
                  Remove second guardian
                </button>
              </div>
              {secondMatchChecked && secondMatchCandidates.length > 0 ? (
                <div className="privacy-callout" style={{ marginTop: 14 }}>
                  <span>i</span>
                  <div>
                    <strong>Second guardian matches another household</strong>
                    <p>
                      Full merge is next phase. Open the existing Family instead of attaching here, or keep creating
                      this new household with a different email.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      {secondMatchCandidates.map((candidate) => (
                        <Link
                          key={candidate.householdId}
                          href={`/staff/families/${candidate.householdId}`}
                          className="secondary-button"
                          style={{ textDecoration: "none" }}
                        >
                          Open {candidate.householdName}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              {secondMatchChecked && secondMatchCandidates.length === 0 ? (
                <div className="validation-line" style={{ marginTop: 12 }}>
                  <span>✓</span> No other household match for the second guardian
                </div>
              ) : null}
            </>
          )}

          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button type="button" className="family-primary" disabled={!guardiansValid} onClick={goNext}>
              Add students
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="wizard-stage">
          <h3>Add and link Student profiles</h3>
          <p>Students are optional at create time. You can add more from the Family detail later.</p>
          <div className="input-grid">
            <label>
              First student name (optional)
              <input
                value={draft.studentDisplayName}
                onChange={(e) => patch({ studentDisplayName: e.target.value })}
                placeholder="Avery Nguyen"
              />
            </label>
            {secondStudentOpen ? (
              <label>
                Second student name (optional)
                <input
                  value={draft.secondStudentDisplayName}
                  onChange={(e) => patch({ secondStudentDisplayName: e.target.value })}
                />
              </label>
            ) : null}
          </div>
          <button
            type="button"
            className="text-button"
            style={{ marginTop: 12 }}
            onClick={() => {
              if (secondStudentOpen) {
                setSecondStudentOpen(false);
                patch({ secondStudentDisplayName: "" });
              } else {
                setSecondStudentOpen(true);
              }
            }}
          >
            {secondStudentOpen ? "Remove second student" : "+ Add another Student"}
          </button>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button type="button" className="family-primary" onClick={goNext}>
              Review
            </button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="wizard-stage">
          <h3>Review household graph</h3>
          <p>Confirm relationships, then save. Provenance is stored on the household notes field.</p>
          <div className="input-grid" style={{ marginBottom: 16 }}>
            <label style={{ gridColumn: "1 / -1" }}>
              Source / provenance notes
              <textarea
                rows={3}
                value={draft.provenanceNotes}
                onChange={(e) => patch({ provenanceNotes: e.target.value })}
                placeholder="Manual staff entry · CRM import · phone call…"
              />
            </label>
          </div>
          <div className="household-graph" style={{ marginBottom: 14 }}>
            {reviewLines.map((line) => (
              <span key={line} style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                {line}
              </span>
            ))}
          </div>
          <div className="validation-line">
            <span>✓</span> No invite email will be sent from this create flow
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setStep(4)}>
              ← Back
            </button>
            <button type="button" className="family-primary" disabled={saving} onClick={() => void createFamily()}>
              {saving ? "Creating…" : "Create family"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
