"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  StaffEditSectionLabel,
  StaffMultilineField,
  StaffRecordEditShell,
  StaffWrapSelect,
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

function capitalizeLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
        <div className="staff-edit-field-row staff-edit-field-row--5">
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
              type="date"
              className="staff-edit-date-input"
              value={profileForm.birthdate}
              onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
              onClick={(e) => {
                const input = e.currentTarget;
                if (typeof input.showPicker === "function") {
                  try {
                    input.showPicker();
                  } catch {
                    /* browser may block if not user-activated; native control still works */
                  }
                }
              }}
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
        </div>
        <div className="staff-edit-field-row staff-edit-field-row--5">
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
          <label>
            Availability
            <input
              value={profileForm.availabilityNotes}
              onChange={(e) => setProfileForm({ ...profileForm, availabilityNotes: e.target.value })}
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
                  {capitalizeLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <StaffEditSectionLabel>Address</StaffEditSectionLabel>
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
        <div className="staff-edit-field-row staff-edit-field-row--2">
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
        </div>

        <StaffEditSectionLabel>Description</StaffEditSectionLabel>
        <StaffMultilineField
          label="Description"
          value={profileForm.description}
          onChange={(description) => setProfileForm({ ...profileForm, description })}
          rows={3}
          hideLabel
        />

        <div className="staff-edit-payment-tutoring-band">
          <div className="staff-edit-payment-pane">
            <StaffEditSectionLabel>Payment</StaffEditSectionLabel>
            <StaffWrapSelect
              label="Payment plan"
              value={profileForm.paymentPlan}
              onChange={(paymentPlan) => setProfileForm({ ...profileForm, paymentPlan })}
              options={ACADEMIC_PAYMENT_PLANS.options}
            />
            <label>
              Deposit ($)
              <input
                value={profileForm.depositDollars}
                onChange={(e) => setProfileForm({ ...profileForm, depositDollars: e.target.value })}
                inputMode="decimal"
                placeholder="0.00"
              />
            </label>
          </div>
          <div className="staff-edit-tutoring-pane">
            <StaffEditSectionLabel>Tutoring</StaffEditSectionLabel>
            <div className="staff-edit-field-row staff-edit-field-row--2">
              <label>
                Academic year
                <input
                  value={profileForm.academicYear}
                  onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                  placeholder="2025-2026"
                />
              </label>
              <label className="staff-edit-subjects-field">
                Subjects
                <div className="staff-edit-subjects-control" role="group" aria-label="Subjects">
                  {profileForm.subjectIds.map((subjectId) => {
                    const subject =
                      catalogSubjects.find((row) => row.id === subjectId) ||
                      student.subjects.find((row) => row.id === subjectId);
                    return (
                      <button
                        key={subjectId}
                        type="button"
                        className="staff-edit-subjects-chip"
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
                  <select
                    id="student-subject-add"
                    className="staff-edit-subjects-add"
                    defaultValue=""
                    aria-label="Add subject"
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
              </label>
            </div>
            <div className="staff-edit-field-row staff-edit-field-row--2">
              <StaffWrapSelect
                label="Hours/Rates"
                value={profileForm.hoursRatePackage}
                onChange={(hoursRatePackage) => setProfileForm({ ...profileForm, hoursRatePackage })}
                options={ACADEMIC_RATE_PACKAGES.options}
              />
              <StaffWrapSelect
                label="Advanced Subjects Hours/Rates"
                value={profileForm.advancedHoursRatePackage}
                onChange={(advancedHoursRatePackage) =>
                  setProfileForm({ ...profileForm, advancedHoursRatePackage })
                }
                options={ACADEMIC_ADVANCED_RATE_PACKAGES.options}
              />
            </div>
          </div>
        </div>

        <div className="staff-edit-schedule-needs-band">
          <div className="staff-edit-schedule-pane staff-edit-chip-block">
            <span className="staff-edit-inline-label">Preferred schedule</span>
            <div
              className="subject-multi-select staff-edit-chip-control"
              role="group"
              aria-label="Preferred schedule"
            >
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
          <div className="staff-edit-needs-pane staff-edit-chip-block">
            <span className="staff-edit-inline-label">Learning needs</span>
            <div
              className="subject-multi-select staff-edit-chip-control"
              role="group"
              aria-label="Learning needs"
            >
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
          </div>
        </div>
      </StaffRecordEditShell>
    </>
  );
}
