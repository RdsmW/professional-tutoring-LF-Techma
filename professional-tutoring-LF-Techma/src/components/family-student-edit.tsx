"use client";

import { useState } from "react";
import { GRADE_LABELS, GRADUATION_YEARS } from "@/lib/forms/options";
import type { StudentDetailModel } from "@/components/family-student-detail";

type EditForm = {
  preferredName: string;
  schoolName: string;
  gradeLabel: string;
  graduationYear: string;
  availabilityNotes: string;
  emergencyContact: string;
  intakeUpdate: string;
};

export function FamilyStudentEdit({
  student,
  guardianLabel,
  onCancel,
  onSaved,
}: {
  student: StudentDetailModel;
  guardianLabel: string;
  onCancel: () => void;
  onSaved: (student: StudentDetailModel, staffReviewNeeded: boolean) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    preferredName: student.displayName,
    schoolName: student.schoolName ?? "",
    gradeLabel: student.gradeLabel ?? "",
    graduationYear: student.graduationYear ? String(student.graduationYear) : "",
    availabilityNotes: student.availabilityNotes?.trim() || "No active schedule",
    emergencyContact: student.emergencyContact ?? "",
    intakeUpdate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [staffReviewNeeded, setStaffReviewNeeded] = useState(false);

  const canSave = form.preferredName.trim() && form.availabilityNotes.trim() && !saving;

  const staffReviewPreview =
    form.schoolName.trim() !== (student.schoolName ?? "") ||
    form.gradeLabel.trim() !== (student.gradeLabel ?? "") ||
    Boolean(form.intakeUpdate.trim());

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/family/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName: form.preferredName,
          schoolName: form.schoolName,
          gradeLabel: form.gradeLabel,
          graduationYear: form.graduationYear,
          availabilityNotes: form.availabilityNotes,
          emergencyContact: form.emergencyContact,
          intakeUpdate: form.intakeUpdate,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Unable to save profile update.");
        return;
      }
      setStaffReviewNeeded(Boolean(data.staffReviewNeeded));
      setSaved(true);
      onSaved(
        {
          ...student,
          ...data.student,
        },
        Boolean(data.staffReviewNeeded),
      );
    } catch {
      setError("Unable to save profile update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="wizard-shell panel">
      <button type="button" className="page-back" onClick={onCancel}>
        ← Student Detail
      </button>
      <span className="eyebrow">Authorized guardian update</span>
      <h2>Edit {student.displayName}</h2>
      <p>
        Guardians may update general profile, preference, and contact information. Placement, tutor
        assignment, attendance, billing, internal assessments/notes, and historical records remain
        staff-managed.
      </p>

      <div className="input-grid">
        <label>
          Preferred name
          <input
            value={form.preferredName}
            onChange={(event) => setForm({ ...form, preferredName: event.target.value })}
          />
        </label>
        <label>
          School
          <input
            value={form.schoolName}
            onChange={(event) => setForm({ ...form, schoolName: event.target.value })}
          />
        </label>
        <label>
          Grade
          <select
            value={form.gradeLabel}
            onChange={(event) => setForm({ ...form, gradeLabel: event.target.value })}
          >
            <option value="">Select grade</option>
            {GRADE_LABELS.options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Graduation year
          <select
            value={form.graduationYear}
            onChange={(event) => setForm({ ...form, graduationYear: event.target.value })}
          >
            <option value="">Select year</option>
            {GRADUATION_YEARS.options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Availability / preferences
          <input
            value={form.availabilityNotes}
            onChange={(event) => setForm({ ...form, availabilityNotes: event.target.value })}
          />
        </label>
        <label>
          Emergency / contact update
          <input
            value={form.emergencyContact}
            onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })}
            placeholder={`${guardianLabel} — guardian`}
          />
        </label>
      </div>

      <label className="full-input">
        Intake update requiring staff context
        <textarea
          value={form.intakeUpdate}
          onChange={(event) => setForm({ ...form, intakeUpdate: event.target.value })}
          placeholder="Optional change request; protected staff notes are not shown or editable"
        />
      </label>

      <section className="privacy-callout">
        <span>i</span>
        <div>
          <strong>Guardian permission and review boundary</strong>
          <p>
            {guardianLabel} may update this child’s general profile. School/grade or intake-context
            changes are submitted for staff review; service assignments and protected records cannot
            be overwritten.
          </p>
        </div>
      </section>

      {staffReviewPreview ? (
        <div className="validation-hint">
          This update includes school, grade, or intake context and will be marked Pending staff
          review.
        </div>
      ) : null}
      {error ? <div className="validation-hint">{error}</div> : null}

      <div className="wizard-footer">
        <button type="button" className="wizard-back" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="family-primary" disabled={!canSave} onClick={() => void save()}>
          {saving ? "Saving…" : "Save profile update"}
        </button>
      </div>

      {saved ? (
        <div className="validation-line">
          <span>✓</span>
          {staffReviewNeeded
            ? "Change request submitted · Pending staff review"
            : "Authorized fields updated"}{" "}
          · guardian and timestamp added to history{" "}
          <button type="button" className="text-button" onClick={onCancel}>
            Return to Student Detail
          </button>
        </div>
      ) : null}
    </section>
  );
}
