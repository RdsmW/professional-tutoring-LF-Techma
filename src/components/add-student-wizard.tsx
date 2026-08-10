"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  firstName: string;
  lastName: string;
  schoolName: string;
  gradeLabel: string;
  graduationYear: string;
  learningNeeds: string;
};

const emptyDraft: Draft = {
  firstName: "",
  lastName: "",
  schoolName: "",
  gradeLabel: "",
  graduationYear: "",
  learningNeeds: "",
};

const steps = ["Student profile", "Learning needs", "Complete"];

export function AddStudentWizard({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Valid = Boolean(
    draft.firstName.trim() &&
      draft.lastName.trim() &&
      draft.schoolName.trim() &&
      draft.gradeLabel.trim() &&
      /^\d{4}$/.test(draft.graduationYear.trim()),
  );
  const step2Valid = Boolean(draft.learningNeeds.trim());

  const initials = useMemo(() => {
    const a = draft.firstName.trim()[0] ?? "";
    const b = draft.lastName.trim()[0] ?? "";
    return `${a}${b}`.toUpperCase() || "ST";
  }, [draft.firstName, draft.lastName]);

  if (!open) return null;

  function resetAndClose() {
    setStep(1);
    setDraft(emptyDraft);
    setError(null);
    onClose();
  }

  async function createStudent() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          graduationYear: Number.parseInt(draft.graduationYear, 10),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create student.");
        return;
      }
      setDraft(emptyDraft);
      setStep(1);
      onCreated();
      onClose();
      router.refresh();
    } catch {
      setError("Unable to create student.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="wizard-shell panel" style={{ marginBottom: 18 }}>
      <button type="button" className="wizard-close" aria-label="Close" onClick={resetAndClose}>
        ×
      </button>
      <span className="eyebrow">Family account · Add child</span>
      <h2>Add a Student profile</h2>
      <p className="wizard-lead">Student records are children owned by the parent’s Family account.</p>

      <div className="wizard-progress" aria-label={`Step ${step} of 3`}>
        {steps.map((label, index) => {
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
          <h3>Student details</h3>
          <div className="input-grid">
            <label>
              First name
              <input
                value={draft.firstName}
                onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                value={draft.lastName}
                onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
              />
            </label>
            <label>
              School
              <input
                value={draft.schoolName}
                placeholder="Type school name"
                onChange={(event) => setDraft({ ...draft, schoolName: event.target.value })}
              />
            </label>
            <label>
              Grade
              <input
                value={draft.gradeLabel}
                placeholder="e.g. Grade 8"
                onChange={(event) => setDraft({ ...draft, gradeLabel: event.target.value })}
              />
            </label>
            <label>
              Graduation year
              <input
                value={draft.graduationYear}
                placeholder="e.g. 2031"
                onChange={(event) => setDraft({ ...draft, graduationYear: event.target.value })}
              />
            </label>
          </div>
          {!step1Valid ? (
            <div className="validation-hint">Complete all profile fields to continue.</div>
          ) : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={resetAndClose}>
              ← Cancel
            </button>
            <button
              type="button"
              className="family-primary"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-stage">
          <h3>Learning needs</h3>
          <label className="full-input">
            Subjects or learning goals
            <textarea
              value={draft.learningNeeds}
              placeholder="Example: Algebra I, writing organization"
              onChange={(event) => setDraft({ ...draft, learningNeeds: event.target.value })}
            />
          </label>
          <div className="privacy-callout">
            <span>⌾</span>
            <div>
              <strong>Restricted education details</strong>
              <p>
                Accommodations, 504/IEP, birthdate, and testing notes require approved staff access and
                are not collected in this step.
              </p>
            </div>
          </div>
          {!step2Valid ? (
            <div className="validation-hint">Add at least one learning need to continue.</div>
          ) : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="family-primary"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="success-state">
          <span>✓</span>
          <h3>Student profile ready</h3>
          <p>Review the record, then add it beneath your Family account.</p>
          <div className="review-summary">
            <div>
              <small>Student</small>
              <strong>
                {draft.firstName} {draft.lastName} ({initials})
              </strong>
            </div>
            <div>
              <small>School / grade</small>
              <strong>
                {draft.schoolName} · {draft.gradeLabel}
              </strong>
            </div>
            <div>
              <small>Graduation</small>
              <strong>{draft.graduationYear}</strong>
            </div>
            <div>
              <small>Learning needs</small>
              <strong>{draft.learningNeeds}</strong>
            </div>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="success-actions">
            <button type="button" className="wizard-back" onClick={() => setStep(2)}>
              ← Edit
            </button>
            <button
              type="button"
              className="family-primary"
              disabled={saving}
              onClick={() => void createStudent()}
            >
              {saving ? "Saving…" : "Add student to Family account"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
