"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { StaffNotesSection, type StaffNoteItem } from "@/components/staff-notes-section";
import { PageIntro, Panel } from "@/components/ui";
import {
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
  GENDER,
  GRADE_LABELS,
  GRADUATION_YEARS,
} from "@/lib/forms/options";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type CatalogSubject = { id: string; code: string; name: string; category: string | null };

type StudentDetail = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  listLabel: string;
  gender: string | null;
  schoolName: string | null;
  graduationYear: number | null;
  gradeLabel: string | null;
  lifecycle: string;
  cellPhone: string | null;
  email: string | null;
  birthdate: string | null;
  learningNeeds: string | null;
  supportNotesRestricted: string | null;
  availabilityNotes: string | null;
  emergencyContact: string | null;
  changeRequestStatus: string | null;
  pendingIntakeNote: string | null;
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
  country: string | null;
  canDelete: boolean;
  subjects: CatalogSubject[];
  notes: StaffNoteItem[];
  household: {
    id: string;
    displayName: string;
    billingEmail: string | null;
    payerName: string | null;
    cardOnFile: boolean;
    cardBrand: string | null;
    cardLast4: string | null;
    autoCharge: boolean;
  } | null;
  enrollments: Array<{
    id: string;
    status: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    createdAt: string;
  }>;
  bookings: Array<{
    id: string;
    status: string;
    tutorName: string | null;
    subjectName: string | null;
    createdAt: string;
  }>;
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
  email: string;
  cellPhone: string;
  learningNeeds: string;
  availabilityNotes: string;
  emergencyContact: string;
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
  supportNotesRestricted: string;
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

function optionLabel(list: { options: Array<{ id: string; label: string }> }, id: string | null | undefined) {
  if (!id) return "—";
  return list.options.find((option) => option.id === id)?.label ?? id;
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
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    displayName: student.displayName,
    gender: student.gender ?? "",
    birthdate: student.birthdate ?? "",
    gradeLabel: student.gradeLabel ?? "",
    graduationYear: student.graduationYear != null ? String(student.graduationYear) : "",
    schoolName: student.schoolName ?? "",
    email: student.email ?? "",
    cellPhone: student.cellPhone ?? "",
    learningNeeds: student.learningNeeds ?? "",
    availabilityNotes: student.availabilityNotes ?? "",
    emergencyContact: student.emergencyContact ?? "",
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
    supportNotesRestricted: student.supportNotesRestricted ?? "",
    lifecycle: student.lifecycle,
  };
}

export function StaffStudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkEdit = searchParams.get("edit") === "1";
  const editDeepLinkHandled = useRef(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [catalogSubjects, setCatalogSubjects] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  const reload = useCallback(async () => {
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
      setStudent(data.student as StudentDetail);
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
    void reload();
  }, [reload]);

  const availableSubjects = useMemo(() => {
    if (!profileForm) return catalogSubjects;
    const selected = new Set(profileForm.subjectIds);
    return catalogSubjects.filter((subject) => !selected.has(subject.id));
  }, [catalogSubjects, profileForm]);

  async function setLifecycleStatus(nextLifecycle: "active" | "archived") {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextLifecycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update status.");
        return;
      }
      setStudent(data.student as StudentDetail);
      setSaveMessage(nextLifecycle === "archived" ? "Student archived." : "Student restored.");
    } catch {
      setError("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function deleteStudent() {
    if (!student?.canDelete || lifecycleBusy) return;
    if (!window.confirm("Permanently delete this student? This cannot be undone.")) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete student.");
        return;
      }
      router.push("/staff/students");
    } catch {
      setError("Unable to delete student.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  function openEdit() {
    if (!student) return;
    setProfileForm(toProfileForm(student));
    setEditing(true);
    setError(null);
    setSaveMessage(null);
  }

  useEffect(() => {
    if (!student || !deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    setProfileForm(toProfileForm(student));
    setEditing(true);
    setError(null);
    setSaveMessage(null);
    router.replace(`/staff/students/${studentId}`, { scroll: false });
  }, [student, deepLinkEdit, studentId, router]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileForm || savingProfile) return;
    const depositCents = dollarsInputToCents(profileForm.depositDollars);
    if (Number.isNaN(depositCents)) {
      setError("Enter a valid deposit amount in dollars.");
      return;
    }
    setSavingProfile(true);
    setError(null);
    setSaveMessage(null);
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
          email: profileForm.email || null,
          cellPhone: profileForm.cellPhone || null,
          learningNeeds: profileForm.learningNeeds || null,
          availabilityNotes: profileForm.availabilityNotes || null,
          emergencyContact: profileForm.emergencyContact || null,
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
          supportNotesRestricted: profileForm.supportNotesRestricted || null,
          lifecycle: profileForm.lifecycle,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to save student.");
        return;
      }
      const next = data.student as StudentDetail;
      setStudent(next);
      setProfileForm(toProfileForm(next));
      setEditing(false);
      setSaveMessage("Student saved.");
    } catch {
      setError("Unable to save student.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function createNote(body: string): Promise<StaffNoteItem> {
    const response = await fetch(`/api/staff/students/${studentId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to add note.");
    setStudent((prev) => (prev ? { ...prev, notes: [data.note, ...prev.notes] } : prev));
    return data.note as StaffNoteItem;
  }

  async function updateNote(noteId: string, body: string): Promise<StaffNoteItem> {
    const response = await fetch(`/api/staff/students/${studentId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to update note.");
    setStudent((prev) =>
      prev
        ? { ...prev, notes: prev.notes.map((note) => (note.id === noteId ? (data.note as StaffNoteItem) : note)) }
        : prev,
    );
    return data.note as StaffNoteItem;
  }

  async function deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/staff/students/${studentId}/notes/${noteId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to delete note.");
    setStudent((prev) => (prev ? { ...prev, notes: prev.notes.filter((note) => note.id !== noteId) } : prev));
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading student…</p>;
  if (error && !student) return <p className="form-error">{error}</p>;
  if (!student) return null;

  const isArchived = student.lifecycle === "archived";
  const scheduleLabels = parseScheduleIds(student.preferredSchedule).map((id) =>
    optionLabel(ACADEMIC_SCHEDULE_WINDOWS, id),
  );
  const cardLabel = student.household?.cardOnFile
    ? [student.household.cardBrand, student.household.cardLast4 ? `•••• ${student.household.cardLast4}` : null]
        .filter(Boolean)
        .join(" ") || "Yes"
    : "No card on file";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <Link href="/staff/students" className="page-back">
          ← Students
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {student.household ? (
            <Link href={`/staff/families/${student.household.id}`} className="secondary-button">
              Family
            </Link>
          ) : null}
          <button type="button" className="action-btn action-btn-edit" onClick={openEdit}>
            Edit
          </button>
          {isArchived ? (
            <button
              type="button"
              className="action-btn action-btn-restore"
              disabled={lifecycleBusy}
              onClick={() => void setLifecycleStatus("active")}
            >
              Restore
            </button>
          ) : student.canDelete ? (
            <button
              type="button"
              className="action-btn action-btn-delete"
              disabled={lifecycleBusy}
              onClick={() => void deleteStudent()}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="action-btn action-btn-archive"
              disabled={lifecycleBusy}
              onClick={() => void setLifecycleStatus("archived")}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      <PageIntro
        title={student.listLabel}
        description={`${student.gradeLabel || "Grade pending"} · ${student.schoolName || "School pending"}`}
        action={<span className={`pill ${statusTone(student.lifecycle)}`}>{formatStatusLabel(student.lifecycle)}</span>}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {saveMessage ? <p style={{ fontSize: 14, marginBottom: 12, color: "var(--mint)" }}>{saveMessage}</p> : null}

      {editing && profileForm ? (
        <Panel title="Edit student">
          <form onSubmit={(e) => void saveProfile(e)} className="input-grid" style={{ gap: 12 }}>
            <p className="guardian-edit-section-label">Identity</p>
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
              Preferred name
              <input
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                required
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
              Grad year
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
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </label>
            <label>
              Cell phone
              <input
                type="tel"
                value={profileForm.cellPhone}
                onChange={(e) => setProfileForm({ ...profileForm, cellPhone: e.target.value })}
              />
            </label>

            <p className="guardian-edit-section-label">Mailing address</p>
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

            <p className="guardian-edit-section-label">CRM</p>
            <label style={{ gridColumn: "1 / -1" }}>
              Description
              <textarea
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              Zoho Deal ID
              <input
                value={profileForm.zohoDealId}
                onChange={(e) => setProfileForm({ ...profileForm, zohoDealId: e.target.value })}
              />
            </label>
            <label>
              Zoho Deal URL
              <input
                value={profileForm.zohoDealUrl}
                onChange={(e) => setProfileForm({ ...profileForm, zohoDealUrl: e.target.value })}
              />
            </label>

            <p className="guardian-edit-section-label">Tutoring</p>
            <label>
              Academic year
              <input
                value={profileForm.academicYear}
                onChange={(e) => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                placeholder="2025-2026"
              />
            </label>
            <label>
              Hours/rates (standard)
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
              Hours/rates (advanced)
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
            <label style={{ gridColumn: "1 / -1" }}>
              Preferred schedule
              <select
                multiple
                value={profileForm.preferredScheduleIds}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    preferredScheduleIds: Array.from(e.target.selectedOptions).map((option) => option.value),
                  })
                }
                style={{ minHeight: 120 }}
              >
                {ACADEMIC_SCHEDULE_WINDOWS.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {profileForm.subjectIds.map((subjectId) => {
                  const subject =
                    catalogSubjects.find((row) => row.id === subjectId) ||
                    student.subjects.find((row) => row.id === subjectId);
                  return (
                    <button
                      key={subjectId}
                      type="button"
                      className="secondary-button"
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

            <p className="guardian-edit-section-label">Payment (student)</p>
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

            <label style={{ gridColumn: "1 / -1" }}>
              Learning needs
              <textarea
                value={profileForm.learningNeeds}
                onChange={(e) => setProfileForm({ ...profileForm, learningNeeds: e.target.value })}
                rows={3}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Availability
              <textarea
                value={profileForm.availabilityNotes}
                onChange={(e) => setProfileForm({ ...profileForm, availabilityNotes: e.target.value })}
                rows={3}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Emergency contact
              <textarea
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                rows={2}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Restricted support notes
              <textarea
                value={profileForm.supportNotesRestricted}
                onChange={(e) => setProfileForm({ ...profileForm, supportNotesRestricted: e.target.value })}
                rows={3}
              />
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="primary-button" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save student"}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={savingProfile}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="profile-layout">
        <Panel title="Profile" eyebrow="Student">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Legal name</small>
              <strong>
                {student.firstName} {student.lastName}
              </strong>
            </span>
            <span>
              <small>Preferred name</small>
              <strong>{student.displayName}</strong>
            </span>
            <span>
              <small>Gender</small>
              <strong>{student.gender || "—"}</strong>
            </span>
            <span>
              <small>Birthdate</small>
              <strong>{student.birthdate || "—"}</strong>
            </span>
            <span>
              <small>Grade</small>
              <strong>{student.gradeLabel || "—"}</strong>
            </span>
            <span>
              <small>Grad year</small>
              <strong>{student.graduationYear ?? "—"}</strong>
            </span>
            <span>
              <small>School</small>
              <strong>{student.schoolName || "—"}</strong>
            </span>
            <span>
              <small>Email</small>
              <strong>{student.email || "—"}</strong>
            </span>
            <span>
              <small>Cell phone</small>
              <strong>{student.cellPhone || "—"}</strong>
            </span>
          </div>
        </Panel>

        <Panel title="Mailing address">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Street</small>
              <strong>{student.addressLine1 || "—"}</strong>
            </span>
            <span>
              <small>Line 2</small>
              <strong>{student.addressLine2 || "—"}</strong>
            </span>
            <span>
              <small>City</small>
              <strong>{student.city || "—"}</strong>
            </span>
            <span>
              <small>State</small>
              <strong>{student.state || "—"}</strong>
            </span>
            <span>
              <small>ZIP</small>
              <strong>{student.postalCode || "—"}</strong>
            </span>
            <span>
              <small>Country</small>
              <strong>{student.country || "United States"}</strong>
            </span>
          </div>
        </Panel>
      </div>

      <div className="profile-layout">
        <Panel title="CRM">
          <div className="family-detail-grid profile-detail-grid">
            <span style={{ gridColumn: "1 / -1" }}>
              <small>Description</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.description || "—"}</strong>
            </span>
            <span>
              <small>Zoho Deal ID</small>
              <strong>{student.zohoDealId || "—"}</strong>
            </span>
            <span>
              <small>Zoho Deal URL</small>
              <strong>
                {student.zohoDealUrl ? (
                  <a href={student.zohoDealUrl} target="_blank" rel="noreferrer">
                    Open deal
                  </a>
                ) : (
                  "—"
                )}
              </strong>
            </span>
          </div>
        </Panel>

        <Panel title="Tutoring">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Academic year</small>
              <strong>{student.academicYear || "—"}</strong>
            </span>
            <span>
              <small>Subjects</small>
              <strong>
                {student.subjects.length > 0 ? student.subjects.map((subject) => subject.name).join(", ") : "—"}
              </strong>
            </span>
            <span style={{ gridColumn: "1 / -1" }}>
              <small>Preferred schedule</small>
              <strong>{scheduleLabels.length > 0 ? scheduleLabels.join(" · ") : "—"}</strong>
            </span>
            <span>
              <small>Hours/rates (standard)</small>
              <strong>{optionLabel(ACADEMIC_RATE_PACKAGES, student.hoursRatePackage)}</strong>
            </span>
            <span>
              <small>Hours/rates (advanced)</small>
              <strong>{optionLabel(ACADEMIC_ADVANCED_RATE_PACKAGES, student.advancedHoursRatePackage)}</strong>
            </span>
          </div>
        </Panel>
      </div>

      <div className="profile-layout">
        <Panel title="Payment">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Payer (Family)</small>
              <strong>{student.household?.payerName || "—"}</strong>
            </span>
            <span>
              <small>Billing email (Family)</small>
              <strong>{student.household?.billingEmail || "—"}</strong>
            </span>
            <span>
              <small>Card on file (Family)</small>
              <strong>{cardLabel}</strong>
            </span>
            <span>
              <small>Auto-charge (Family)</small>
              <strong>{student.household ? (student.household.autoCharge ? "Yes" : "No") : "—"}</strong>
            </span>
            <span>
              <small>Payment plan</small>
              <strong>{optionLabel(ACADEMIC_PAYMENT_PLANS, student.paymentPlan)}</strong>
            </span>
            <span>
              <small>Deposit</small>
              <strong>
                {student.depositCents == null ? "—" : `$${(student.depositCents / 100).toFixed(2)}`}
              </strong>
            </span>
          </div>
          {student.household ? (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Payer, card, and auto-charge are read-only from{" "}
              <Link href={`/staff/families/${student.household.id}`}>{student.household.displayName}</Link>.
            </p>
          ) : (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Assign a family to show payer and card details.
            </p>
          )}
        </Panel>

        <Panel title="Learning & emergency">
          <div className="family-detail-grid profile-detail-grid">
            <span style={{ gridColumn: "1 / -1" }}>
              <small>Learning needs</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.learningNeeds || "—"}</strong>
            </span>
            <span>
              <small>Availability</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.availabilityNotes || "—"}</strong>
            </span>
            <span>
              <small>Emergency contact</small>
              <strong style={{ whiteSpace: "pre-wrap" }}>{student.emergencyContact || "—"}</strong>
            </span>
            {student.supportNotesRestricted ? (
              <span style={{ gridColumn: "1 / -1" }}>
                <small>Restricted support notes</small>
                <strong style={{ whiteSpace: "pre-wrap" }}>{student.supportNotesRestricted}</strong>
              </span>
            ) : null}
          </div>
        </Panel>
      </div>

      <StaffNotesSection
        notes={student.notes}
        onCreate={createNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onSuccess={(message) => setSaveMessage(message)}
        onError={(message) => setError(message)}
      />

      <div className="profile-layout">
        <Panel title="Enrollments">
          {student.enrollments.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>No enrollments yet.</p>
          ) : (
            <div className="table-panel">
              {student.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="family-row" style={{ cursor: "default" }}>
                  <span>
                    <strong>{enrollment.courseName}</strong>
                    <small>
                      {enrollment.courseCode} · {new Date(enrollment.createdAt).toLocaleString()}
                    </small>
                  </span>
                  <span className={`pill ${statusTone(enrollment.status)}`}>
                    {formatStatusLabel(enrollment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Bookings">
          {student.bookings.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>No bookings yet.</p>
          ) : (
            <div className="table-panel">
              {student.bookings.map((booking) => (
                <div key={booking.id} className="family-row" style={{ cursor: "default" }}>
                  <span>
                    <strong>{booking.subjectName || booking.status}</strong>
                    <small>
                      {booking.tutorName ? `Tutor: ${booking.tutorName}` : "Tutor unassigned"} ·{" "}
                      {new Date(booking.createdAt).toLocaleString()}
                    </small>
                  </span>
                  <span className={`pill ${statusTone(booking.status)}`}>{formatStatusLabel(booking.status)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
