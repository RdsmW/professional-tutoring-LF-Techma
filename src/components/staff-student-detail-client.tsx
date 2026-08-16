"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  IconArchive,
  IconPencil,
  IconRestore,
  IconTrash,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { StaffNotesSection, type StaffNoteItem } from "@/components/staff-notes-section";
import { Panel } from "@/components/ui";
import { learningNeedNotes, parseLearningNeeds } from "@/lib/family/learning-needs";
import {
  ACADEMIC_ADVANCED_RATE_PACKAGES,
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_RATE_PACKAGES,
  ACADEMIC_SCHEDULE_WINDOWS,
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
    billingOwnerGuardianId: string | null;
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

const LEARNING_CHIP_PREVIEW = 8;
const PREVIEW_LIMIT = 3;

type StudentLifecycleConfirm = "archive" | "restore" | "delete";

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

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "ST"
  );
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatMailingAddressLines(student: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}): string[] {
  const hasLocalAddress = Boolean(
    student.addressLine1 || student.addressLine2 || student.city || student.state || student.postalCode,
  );
  if (!hasLocalAddress) return [];

  const lines: string[] = [];
  const line1 = (student.addressLine1 || "").trim();
  const line2 = (student.addressLine2 || "").trim();
  if (line1 && line2) lines.push(`${line1}, ${line2}`);
  else if (line1 || line2) lines.push(line1 || line2);

  const city = (student.city || "").trim();
  const state = (student.state || "").trim();
  const postal = (student.postalCode || "").trim();
  const cityStateZip = [city, [state, postal].filter(Boolean).join(" ").trim()].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);

  return lines;
}

function ConfirmActionModal({
  title,
  body,
  confirmLabel,
  destructive,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="staff-modal staff-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-confirm-modal-title"
      >
        <h3 id="staff-confirm-modal-title">{title}</h3>
        <div className="staff-confirm-modal-body">
          <p>{body}</p>
        </div>
        <div className="staff-modal-actions">
          <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={destructive ? "danger-button" : "primary-button"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListPreview({
  total,
  empty,
  onViewMore,
  children,
}: {
  total: number;
  empty: ReactNode;
  onViewMore: () => void;
  children: ReactNode;
}) {
  if (total === 0) return <>{empty}</>;
  return (
    <div className="family-list-preview-shell">
      <div className="family-list-preview">{children}</div>
      {total > PREVIEW_LIMIT ? (
        <button type="button" className="text-button family-view-more" onClick={onViewMore}>
          View more
        </button>
      ) : null}
    </div>
  );
}

function ListModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="staff-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="staff-modal family-list-modal" role="dialog" aria-modal="true">
        <div className="family-list-modal-header">
          <h3>{title}</h3>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="family-list-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function StaffStudentDetailClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const deepLinkEdit = searchParams.get("edit") === "1";
  const editDeepLinkHandled = useRef(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<StudentLifecycleConfirm | null>(null);
  const [listModal, setListModal] = useState<"enrollments" | "bookings" | null>(null);
  const [learningChipsExpanded, setLearningChipsExpanded] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentRes = await fetch(`/api/staff/students/${studentId}`);
      const data = await studentRes.json();
      if (!studentRes.ok || !data.ok) {
        setError(data.error || "Unable to load student.");
        return;
      }
      setStudent(data.student as StudentDetail);
    } catch {
      setError("Unable to load student.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    router.replace(`/staff/students/${studentId}/edit`);
  }, [deepLinkEdit, studentId, router]);

  async function setLifecycleStatus(nextLifecycle: "active" | "archived") {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle: nextLifecycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update status.");
        toast.error(data.error || "Unable to update status.");
        return;
      }
      setStudent(data.student as StudentDetail);
      setLifecycleConfirm(null);
      toast.success(nextLifecycle === "archived" ? "Student archived." : "Student restored.");
    } catch {
      setError("Unable to update status.");
      toast.error("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function deleteStudent() {
    if (!student?.canDelete || lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/students/${studentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete student.");
        toast.error(data.error || "Unable to delete student.");
        return;
      }
      router.push("/staff/students");
    } catch {
      setError("Unable to delete student.");
      toast.error("Unable to delete student.");
    } finally {
      setLifecycleBusy(false);
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
  const addressLines = formatMailingAddressLines(student);
  const learningParsed = parseLearningNeeds(student.learningNeeds);
  const learningNotesText = learningNeedNotes(student.learningNeeds);
  const visibleLearningChips = learningChipsExpanded
    ? learningParsed.chips
    : learningParsed.chips.slice(0, LEARNING_CHIP_PREVIEW);
  const learningChipRemaining = learningParsed.chips.length - visibleLearningChips.length;
  const zohoUrl = (student.zohoDealUrl || "").trim();
  const payerHref = student.household?.billingOwnerGuardianId
    ? `/staff/guardians/${student.household.billingOwnerGuardianId}`
    : student.household
      ? `/staff/families/${student.household.id}`
      : null;

  const lifecycleButtons: Array<{
    id: string;
    label: string;
    tone: "archive" | "restore" | "danger";
    onClick: () => void;
    icon: "archive" | "restore" | "delete";
  }> = [];
  if (isArchived) {
    lifecycleButtons.push({
      id: "restore",
      label: "Restore",
      tone: "restore",
      onClick: () => setLifecycleConfirm("restore"),
      icon: "restore",
    });
  } else {
    lifecycleButtons.push({
      id: "archive",
      label: "Archive",
      tone: "archive",
      onClick: () => setLifecycleConfirm("archive"),
      icon: "archive",
    });
  }
  if (student.canDelete) {
    lifecycleButtons.push({
      id: "delete",
      label: "Delete",
      tone: "danger",
      onClick: () => setLifecycleConfirm("delete"),
      icon: "delete",
    });
  }

  const lifecycleConfirmCopy: Record<
    StudentLifecycleConfirm,
    { title: string; body: string; confirmLabel: string; destructive?: boolean }
  > = {
    archive: {
      title: "Archive this student?",
      body: "Archived students are hidden from the default Students list. You can restore them later.",
      confirmLabel: "Archive",
    },
    restore: {
      title: "Restore this student?",
      body: "This student will appear in the active Students list again.",
      confirmLabel: "Restore",
    },
    delete: {
      title: "Permanently delete this student?",
      body: "This cannot be undone. Only students with no enrollments or bookings can be deleted.",
      confirmLabel: "Delete",
      destructive: true,
    },
  };

  const previewEnrollments = student.enrollments.slice(0, PREVIEW_LIMIT);
  const previewBookings = student.bookings.slice(0, PREVIEW_LIMIT);

  function renderEnrollmentRow(enrollment: StudentDetail["enrollments"][number]) {
    return (
      <div key={enrollment.id} className="staff-detail-list-row" style={{ cursor: "default" }}>
        <span>
          <strong>{enrollment.courseName}</strong>
          <small>
            {enrollment.courseCode} · {new Date(enrollment.createdAt).toLocaleString()}
          </small>
        </span>
        <span className={`pill ${statusTone(enrollment.status)}`}>{formatStatusLabel(enrollment.status)}</span>
      </div>
    );
  }

  function renderBookingRow(booking: StudentDetail["bookings"][number]) {
    return (
      <div key={booking.id} className="staff-detail-list-row" style={{ cursor: "default" }}>
        <span>
          <strong>{booking.subjectName || booking.status}</strong>
          <small>
            {booking.tutorName ? `Tutor: ${booking.tutorName}` : "Tutor unassigned"} ·{" "}
            {new Date(booking.createdAt).toLocaleString()}
          </small>
        </span>
        <span className={`pill ${statusTone(booking.status)}`}>{formatStatusLabel(booking.status)}</span>
      </div>
    );
  }

  return (
    <>
      <AppToastHost toasts={toast.toasts} onDismiss={toast.dismiss} />

      {lifecycleConfirm ? (
        <ConfirmActionModal
          title={lifecycleConfirmCopy[lifecycleConfirm].title}
          body={lifecycleConfirmCopy[lifecycleConfirm].body}
          confirmLabel={lifecycleConfirmCopy[lifecycleConfirm].confirmLabel}
          destructive={lifecycleConfirmCopy[lifecycleConfirm].destructive}
          busy={lifecycleBusy}
          onCancel={() => {
            if (!lifecycleBusy) setLifecycleConfirm(null);
          }}
          onConfirm={() => {
            if (lifecycleConfirm === "archive") void setLifecycleStatus("archived");
            else if (lifecycleConfirm === "restore") void setLifecycleStatus("active");
            else void deleteStudent();
          }}
        />
      ) : null}

      <div className="family-detail-topbar">
        <Link href="/staff/students" className="page-back">
          ← Students
        </Link>
        <div className="family-detail-topbar-actions">
          <Link
            href={`/staff/students/${studentId}/edit`}
            className="staff-icon-btn staff-icon-btn-edit"
            aria-label="Edit"
            title="Edit"
          >
            <IconPencil size={15} />
          </Link>
          {lifecycleButtons.map((action) => (
            <StaffIconButton
              key={action.id}
              label={action.label}
              title={action.label}
              tone={action.tone}
              disabled={lifecycleBusy}
              onClick={action.onClick}
            >
              {action.icon === "archive" ? (
                <IconArchive size={15} />
              ) : action.icon === "restore" ? (
                <IconRestore size={15} />
              ) : (
                <IconTrash size={15} />
              )}
            </StaffIconButton>
          ))}
        </div>
      </div>

      <section className="family-record-hero">
        <span className="avatar navy">{initials(student.fullName || student.displayName)}</span>
        <div className="family-record-hero-copy">
          <h2>{student.listLabel}</h2>
        </div>
        <span className={`pill family-record-hero-status-pill ${statusTone(student.lifecycle)}`}>
          {formatStatusLabel(student.lifecycle)}
        </span>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="family-detail-layout family-detail-stack">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Profile</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense student-profile-dense">
              <div className="family-household-upper">
                <span>
                  <small>Legal name</small>
                  <strong>
                    {[student.firstName, student.lastName].filter(Boolean).join(" ") || "—"}
                  </strong>
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
                  <small>Phone</small>
                  <strong>{student.cellPhone || "—"}</strong>
                </span>
              </div>
              <div className="family-household-upper">
                <span>
                  <small>Grade</small>
                  <strong>{student.gradeLabel || "—"}</strong>
                </span>
                <span>
                  <small>Grade Year</small>
                  <strong>{student.graduationYear ?? "—"}</strong>
                </span>
                <span>
                  <small>School</small>
                  <strong>{student.schoolName || "—"}</strong>
                </span>
                <span>
                  <small>Availability</small>
                  <strong style={{ whiteSpace: "pre-wrap" }}>{student.availabilityNotes || "—"}</strong>
                </span>
              </div>
              <div className="family-household-lower">
                <span className="family-household-field-address">
                  <small>Mailing address</small>
                  {addressLines.length ? (
                    <div className="family-household-address-lines">
                      {addressLines.map((line, index) => (
                        <span key={`${index}-${line}`}>{line}</span>
                      ))}
                    </div>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
                <span className="family-household-field-zoho-id">
                  <small>Zoho CRM ID</small>
                  <strong>{student.zohoDealId || "—"}</strong>
                </span>
                <span className="family-household-field-zoho-url">
                  <small>Zoho CRM URL</small>
                  {zohoUrl ? (
                    <a href={zohoUrl} target="_blank" rel="noreferrer" className="family-zoho-url-link" title={zohoUrl}>
                      {zohoUrl}
                    </a>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
              </div>
              <div className="family-household-lower student-profile-family-description-row">
                <span>
                  <small>Family</small>
                  {student.household ? (
                    <Link href={`/staff/families/${student.household.id}`} className="family-household-payer-link">
                      {student.household.displayName}
                    </Link>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
                <span>
                  <small>Description</small>
                  <strong style={{ whiteSpace: "pre-wrap" }}>{student.description || "—"}</strong>
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Tutoring</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense">
              <div className="family-household-upper" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <span>
                  <small>Academic year</small>
                  <strong>{student.academicYear || "—"}</strong>
                </span>
                <span>
                  <small>Subjects</small>
                  {student.subjects.length > 0 ? (
                    <div className="field-cloud" style={{ marginTop: 4 }}>
                      {student.subjects.map((subject) => (
                        <span key={subject.id}>{subject.name}</span>
                      ))}
                    </div>
                  ) : (
                    <strong>—</strong>
                  )}
                </span>
                <span style={{ gridColumn: "1 / -1" }}>
                  <small>Preferred schedule</small>
                  <strong>{scheduleLabels.length > 0 ? scheduleLabels.join(" · ") : "—"}</strong>
                </span>
                <span>
                  <small>Hours/Rates</small>
                  <strong>{optionLabel(ACADEMIC_RATE_PACKAGES, student.hoursRatePackage)}</strong>
                </span>
                <span>
                  <small>Advanced Subjects Hours/Rates</small>
                  <strong>{optionLabel(ACADEMIC_ADVANCED_RATE_PACKAGES, student.advancedHoursRatePackage)}</strong>
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="student-payment-learning-band">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Payment</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense">
              <div className="family-household-upper" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                <span>
                  <small>Responsible for payment</small>
                  {student.household?.payerName && payerHref ? (
                    <Link href={payerHref} className="family-household-payer-link">
                      {student.household.payerName}
                    </Link>
                  ) : (
                    <strong>{student.household?.payerName || "—"}</strong>
                  )}
                </span>
                <span>
                  <small>Auto-charge (Family)</small>
                  <strong>{student.household ? yesNo(student.household.autoCharge) : "—"}</strong>
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
              {!student.household ? (
                <p className="family-empty" style={{ margin: 0 }}>
                  Assign a family to show payer and auto-charge.
                </p>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Learning needs</h2>
          </div>
          <div className="student-learning-needs-body">
            {learningParsed.chips.length > 0 ? (
              <div className="field-cloud">
                {visibleLearningChips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
                {learningChipRemaining > 0 ? (
                  <button
                    type="button"
                    className="student-chip-more"
                    onClick={() => setLearningChipsExpanded(true)}
                  >
                    +{learningChipRemaining} more
                  </button>
                ) : null}
                {learningChipsExpanded && learningParsed.chips.length > LEARNING_CHIP_PREVIEW ? (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setLearningChipsExpanded(false)}
                  >
                    Show less
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="family-empty" style={{ margin: 0 }}>
                No learning needs listed.
              </p>
            )}
            {learningNotesText ? <p className="student-learning-needs-notes">{learningNotesText}</p> : null}
          </div>
        </Panel>
      </div>

      <div className="family-activity-band">
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Enrollments</h2>
          </div>
          <ListPreview
            total={student.enrollments.length}
            empty={<p className="family-empty">No enrollments yet.</p>}
            onViewMore={() => setListModal("enrollments")}
          >
            <div className="staff-detail-list">{previewEnrollments.map(renderEnrollmentRow)}</div>
          </ListPreview>
        </Panel>
        <Panel className="family-equal-panel">
          <div className="family-panel-heading">
            <h2>Bookings</h2>
          </div>
          <ListPreview
            total={student.bookings.length}
            empty={<p className="family-empty">No bookings yet.</p>}
            onViewMore={() => setListModal("bookings")}
          >
            <div className="staff-detail-list">{previewBookings.map(renderBookingRow)}</div>
          </ListPreview>
        </Panel>
      </div>

      <StaffNotesSection
        notes={student.notes}
        onCreate={createNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onSuccess={toast.success}
        onError={toast.error}
      />

      {listModal === "enrollments" ? (
        <ListModal title="Enrollments" onClose={() => setListModal(null)}>
          <div className="staff-detail-list">{student.enrollments.map(renderEnrollmentRow)}</div>
        </ListModal>
      ) : null}
      {listModal === "bookings" ? (
        <ListModal title="Bookings" onClose={() => setListModal(null)}>
          <div className="staff-detail-list">{student.bookings.map(renderBookingRow)}</div>
        </ListModal>
      ) : null}
    </>
  );
}
