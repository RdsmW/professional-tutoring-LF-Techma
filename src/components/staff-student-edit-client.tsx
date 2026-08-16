"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  StaffEditSectionLabel,
  StaffMultilineField,
  StaffRecordEditShell,
} from "@/components/staff-record-edit-shell";
import {
  composeLearningNeeds,
  learningNeedsToEditState,
} from "@/lib/family/learning-needs";
import {
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
  ACADEMIC_SUBJECTS,
  GENDER,
  GRADE_LABELS,
  GRADUATION_YEARS,
} from "@/lib/forms/options";

type CatalogSubject = { id: string; code: string; name: string; category: string | null };

type StudentDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  listLabel: string;
  gender: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  gradeLabel: string | null;
  lifecycle: string;
  cellPhone: string | null;
  birthdate: string | null;
  learningNeeds: string | null;
  availabilityNotes: string | null;
  description: string | null;
  zohoDealId: string | null;
  zohoDealUrl: string | null;
  academicYear: string | null;
  preferredSchedule: string | null;
  hoursRatePackage: string | null;
  advancedHoursRatePackage: string | null;
  paymentPlan: string | null;
  depositCents: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  subjects: CatalogSubject[];
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  birthdate: string;
  gradeLabel: string;
  graduationYear: string;
  schoolName: string;
  cellPhone: string;
  learningNeedSubjectIds: string[];
  learningNeedNotes: string;
  availabilityNotes: string;
  description: string;
  zohoDealId: string;
  zohoDealUrl: string;
  academicYear: string;
  preferredScheduleIds: string[];
  hoursRatePackage: string;
  advancedHoursRatePackage: string;
  paymentPlan: string;
  depositDollars: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  subjectIds: string[];
  lifecycle: string;
};

const LIFECYCLE_OPTIONS = ["prospect", "active", "paused", "completed", "archived"];

function parseScheduleIds(value: string | null | undefined) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function centsToDollarsInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function dollarsInputToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;
  return Math.round(amount * 100);
}

function toProfileForm(student: StudentDetail): ProfileForm {
  const learningEdit = learningNeedsToEditState(student.learningNeeds);
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    displayName: student.displayName,
    gender: student.gender ?? "",
    birthdate: student.birthdate ?? "",
    gradeLabel: student.gradeLabel ?? "",
    graduationYear: student.graduationYear != null ? String(student.graduationYear) : "",
    schoolName: student.schoolName ?? "",
    cellPhone: student.cellPhone ?? "",
    learningNeedSubjectIds: learningEdit.subjectIds,
    learningNeedNotes: learningEdit.notes,
    availabilityNotes: student.availabilityNotes ?? "",
    description: student.description ?? "",
    zohoDealId: student.zohoDealId ?? "",
    zohoDealUrl: student.zohoDealUrl ?? "",
    academicYear: student.academicYear ?? "",
    preferredScheduleIds: parseScheduleIds(student.preferredSchedule),
    hoursRatePackage: student.hoursRatePackage ?? "",
    advancedHoursRatePackage: student.advancedHoursRatePackage ?? "",
    paymentPlan: student.paymentPlan ?? "",
    depositDollars: centsToDollarsInput(student.depositCents),
    addressLine1: student.addressLine1 ?? "",
    addressLine2: student.addressLine2 ?? "",
    city: student.city ?? "",
    state: student.state ?? "",
    postalCode: student.postalCode ?? "",
    subjectIds: student.subjects.map((subject) => subject.id),
    lifecycle: student.lifecycle,
  };
}

export function StaffStudentEditClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const toast = useAppToast();
  const detailHref = `/staff/students/${studentId}`;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [catalogSubjects, setCatalogSubjects] = useState<CatalogSubject[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentRes, subjectsRes] = await Promise.all([
        fetch(`/api/staff/students/${studentId}`),
        fetch("/api/staff/subjects"),
      ]);
      const data = await studentRes.json();
      const subjectsData = await subjectsRes.json();
      if (!studentRes.ok || !data.ok) {
        setError(data.error || "Unable to load student.");
        return;
      }
      const next = data.student as StudentDetail;
      setStudent(next);
      setProfileForm(toProfileForm(next));
      if (subjectsRes.ok && subjectsData.ok) {
        setCatalogSubjects(subjectsData.subjects ?? []);
      }
    } catch {
      setError("Unable to load student.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableSubjects = useMemo(() => {
    if (!profileForm) return catalogSubjects;
    const selected = new Set(profileForm.subjectIds);
    return catalogSubjects.filter((subject) => !selected.has(subject.id));
  }, [catalogSubjects, profileForm]);

  function goBack() {
    router.push(detailHref);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || saving) return;
    const depositCents = dollarsInputToCents(profileForm.depositDollars);
    if (Number.isNaN(depositCents)) {
      setError("Enter a valid deposit amount in dollars.");
      toast.error("Enter a valid deposit amount in dollars.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          displayName: profileForm.displayName,
          gender: profileForm.gender || null,
          birthdate: profileForm.birthdate || null,
          gradeLabel: profileForm.gradeLabel || null,
          graduationYear: profileForm.graduationYear ? Number(profileForm.graduationYear) : null,
          schoolName: profileForm.schoolName || null,
          cellPhone: profileForm.cellPhone || null,
          learningNeeds:
            composeLearningNeeds(profileForm.learningNeedSubjectIds, profileForm.learningNeedNotes) || null,
          availabilityNotes: profileForm.availabilityNotes || null,
          description: profileForm.description || null,
          zohoDealId: profileForm.zohoDealId || null,
          zohoDealUrl: profileForm.zohoDealUrl || null,
          academicYear: profileForm.academicYear || null,
          preferredSchedule: profileForm.preferredScheduleIds.join(",") || null,
          hoursRatePackage: profileForm.hoursRatePackage || null,
          advancedHoursRatePackage: profileForm.advancedHoursRatePackage || null,
          paymentPlan: profileForm.paymentPlan || null,
          depositCents,
          addressLine1: profileForm.addressLine1 || null,
          addressLine2: profileForm.addressLine2 || null,
          city: profileForm.city || null,
          state: profileForm.state || null,
          postalCode: profileForm.postalCode || null,
          country: "United States",
          subjectIds: profileForm.subjectIds,
          lifecycle: profileForm.lifecycle,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save student.");
        toast.error(data.error || "Unable to save student.");
        return;
      }
      toast.success("Student saved.");
      router.push(detailHref);
    } catch {
      setError("Unable to save student.");
      toast.error("Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading student…</p>;
  if (error && !profileForm) return <p className="form-error">{error}</p>;
  if (!student || !profileForm) return null;

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />
      <StaffRecordEditShell
        backHref={detailHref}
        backLabel="← Student detail"
        title={`Edit ${student.listLabel}`}
        saving={saving}
        saveLabel="Save student"
        error={error}
        onCancel={goBack}
        onSubmit={(event) => void saveProfile(event)}
      >
        <StaffEditSectionLabel>Profile</StaffEditSectionLabel>
        <StaffEditSectionLabel>Legal name · Gender · Birthdate · Phone</StaffEditSectionLabel>
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
          Gender
          <select
            value={profileForm.gender}
            onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
          >
            <option value="">—</option>
            {GENDER.options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Birthdate
          <input
            value={profileForm.birthdate}
            onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
            placeholder="YYYY-MM-DD"
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={profileForm.cellPhone}
            onChange={(e) => setProfileForm({ ...profileForm, cellPhone: e.target.value })}
          />
        </label>
        <label>
          Lifecycle
          <select
            value={profileForm.lifecycle}
            onChange={(e) => setProfileForm({ ...profileForm, lifecycle: e.target.value })}
          >
            {LIFECYCLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <StaffEditSectionLabel>Grade · Grade Year · School · Availability</StaffEditSectionLabel>
        <label>
          Grade
          <select
            value={profileForm.gradeLabel}
            onChange={(e) => setProfileForm({ ...profileForm, gradeLabel: e.target.value })}
          >
            <option value="">—</option>
            {GRADE_LABELS.options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Grade Year
          <select
            value={profileForm.graduationYear}
            onChange={(e) => setProfileForm({ ...profileForm, graduationYear: e.target.value })}
          >
            <option value="">—</option>
            {GRADUATION_YEARS.options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          School
          <input
            value={profileForm.schoolName}
            onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
          />
        </label>
        <StaffMultilineField
          label="Availability"
          value={profileForm.availabilityNotes}
          onChange={(availabilityNotes) => setProfileForm({ ...profileForm, availabilityNotes })}
          rows={2}
        />

        <StaffEditSectionLabel>Mailing address · Zoho CRM ID · Zoho CRM URL</StaffEditSectionLabel>
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
          <input value="United States" readOnly />
        </label>
        <label>
          Zoho CRM ID
          <input
            value={profileForm.zohoDealId}
            onChange={(e) => setProfileForm({ ...profileForm, zohoDealId: e.target.value })}
          />
        </label>
        <label>
          Zoho CRM URL
          <input
            value={profileForm.zohoDealUrl}
            onChange={(e) => setProfileForm({ ...profileForm, zohoDealUrl: e.target.value })}
          />
        </label>

        <StaffEditSectionLabel>Description</StaffEditSectionLabel>
        <StaffMultilineField
          label="Description"
          value={profileForm.description}
          onChange={(description) => setProfileForm({ ...profileForm, description })}
          rows={2}
        />

        <StaffEditSectionLabel>Tutoring</StaffEditSectionLabel>
        <label>
          Academic year
          <input
            value={profileForm.academicYear}
            onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
            placeholder="2025-2026"
          />
        </label>
        <label>
          Hours/Rates
          <select
            value={profileForm.hoursRatePackage}
            onChange={(e) => setProfileForm({ ...profileForm, hoursRatePackage: e.target.value })}
          >
            <option value="">—</option>
            {ACADEMIC_RATE_PACKAGES.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Advanced Subjects Hours/Rates
          <select
            value={profileForm.advancedHoursRatePackage}
            onChange={(e) => setProfileForm({ ...profileForm, advancedHoursRatePackage: e.target.value })}
          >
            <option value="">—</option>
            {ACADEMIC_ADVANCED_RATE_PACKAGES.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div style={{ gridColumn: "1 / -1" }}>
          <strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Preferred schedule</strong>
          <div className="subject-multi-select" role="group" aria-label="Preferred schedule">
            {ACADEMIC_SCHEDULE_WINDOWS.options.map((option) => {
              const selected = profileForm.preferredScheduleIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? "selected" : undefined}
                  aria-pressed={selected}
                  onClick={() =>
                    setProfileForm({
                      ...profileForm,
                      preferredScheduleIds: selected
                        ? profileForm.preferredScheduleIds.filter((id) => id !== option.id)
                        : [...profileForm.preferredScheduleIds, option.id],
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <label style={{ gridColumn: "1 / -1" }}>
          Subjects
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <select
              id="student-subject-add"
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                if (!profileForm.subjectIds.includes(value)) {
                  setProfileForm({ ...profileForm, subjectIds: [...profileForm.subjectIds, value] });
                }
                e.target.value = "";
              }}
            >
              <option value="">Add subject…</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field-cloud" style={{ marginTop: 8 }}>
            {profileForm.subjectIds.map((subjectId) => {
              const subject =
                catalogSubjects.find((row) => row.id === subjectId) ||
                student.subjects.find((row) => row.id === subjectId);
              return (
                <button
                  key={subjectId}
                  type="button"
                  onClick={() =>
                    setProfileForm({
                      ...profileForm,
                      subjectIds: profileForm.subjectIds.filter((id) => id !== subjectId),
                    })
                  }
                >
                  {subject?.name ?? subjectId} ×
                </button>
              );
            })}
            {profileForm.subjectIds.length === 0 ? (
              <span style={{ color: "var(--muted)", fontSize: 14 }}>No subjects selected.</span>
            ) : null}
          </div>
        </label>

        <StaffEditSectionLabel>Payment</StaffEditSectionLabel>
        <label>
          Payment plan
          <select
            value={profileForm.paymentPlan}
            onChange={(e) => setProfileForm({ ...profileForm, paymentPlan: e.target.value })}
          >
            <option value="">—</option>
            {ACADEMIC_PAYMENT_PLANS.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Deposit ($)
          <input
            value={profileForm.depositDollars}
            onChange={(e) => setProfileForm({ ...profileForm, depositDollars: e.target.value })}
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>

        <StaffEditSectionLabel>Learning needs</StaffEditSectionLabel>
        <div style={{ gridColumn: "1 / -1" }}>
          <strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Subjects or learning goals</strong>
          <div className="subject-multi-select" role="group" aria-label="Learning needs">
            {ACADEMIC_SUBJECTS.options.map((option) => {
              const selected = profileForm.learningNeedSubjectIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={selected ? "selected" : undefined}
                  aria-pressed={selected}
                  onClick={() =>
                    setProfileForm({
                      ...profileForm,
                      learningNeedSubjectIds: selected
                        ? profileForm.learningNeedSubjectIds.filter((id) => id !== option.id)
                        : [...profileForm.learningNeedSubjectIds, option.id],
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <StaffMultilineField
              label="Additional notes (optional)"
              value={profileForm.learningNeedNotes}
              onChange={(learningNeedNotes) => setProfileForm({ ...profileForm, learningNeedNotes })}
              rows={2}
              placeholder="Optional context beyond the chips…"
              fullWidth={false}
            />
          </div>
        </div>
      </StaffRecordEditShell>
    </>
  );
}
