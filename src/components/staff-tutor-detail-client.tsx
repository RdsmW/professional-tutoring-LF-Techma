"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppToastHost, useAppToast } from "@/components/app-toast";
import {
  IconArchive,
  IconNote,
  IconPencil,
  IconRestore,
  IconTrash,
  StaffIconButton,
} from "@/components/staff-action-icons";
import { StaffNotesSection, type StaffNoteItem } from "@/components/staff-notes-section";
import {
  STAFF_RECORD_INFO_CARD_CLASS,
  StaffRecordIntegrationsCard,
  StaffRecordPrimaryRow,
} from "@/components/staff-record-integrations-card";
import { StaffDetailField, StaffDetailFieldGroup } from "@/components/staff-detail-fields";
import { Panel } from "@/components/ui";
import { formatTime12hEnglish } from "@/lib/ui/datetime";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type TutorDetail = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  maxSeatsPerSlot: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notesList: StaffNoteItem[];
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    priority: number;
  }>;
  workloadCount: number;
  canDelete: boolean;
};

type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  category: string | null;
};

type OpenHourSlot = {
  id: string;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  capacitySeats: number;
  heldSeats: number;
  bookedSeats: number;
  label: string | null;
  seats?: Array<{
    seat: number;
    studentId: string | null;
    studentName: string | null;
    bookingId: string | null;
    state: string;
  }>;
};

type TutorLifecycleConfirm = "archive" | "restore" | "delete";

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
] as const;

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTimeLabel(value: string) {
  return formatTime12hEnglish(value);
}

function isRedundantHourLabel(label: string | null, range: string) {
  if (!label?.trim()) return true;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/[.–—]/g, "-");
  if (norm(label) === norm(range)) return true;
  return /^\d/.test(label.trim()) && /(am|pm|\d:\d)/i.test(label);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TU"
  );
}

function formatMailingAddressLines(tutor: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}): string[] {
  const hasLocalAddress = Boolean(
    tutor.addressLine1 || tutor.addressLine2 || tutor.city || tutor.state || tutor.postalCode,
  );
  if (!hasLocalAddress) return [];

  const lines: string[] = [];
  const line1 = (tutor.addressLine1 || "").trim();
  const line2 = (tutor.addressLine2 || "").trim();
  if (line1 && line2) lines.push(`${line1}, ${line2}`);
  else if (line1 || line2) lines.push(line1 || line2);

  const city = (tutor.city || "").trim();
  const state = (tutor.state || "").trim();
  const postal = (tutor.postalCode || "").trim();
  const cityStateZip = [city, [state, postal].filter(Boolean).join(" ").trim()].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);

  const country = (tutor.country || "").trim();
  if (country && country !== "United States" && country !== "US") lines.push(country);

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
        aria-labelledby="staff-tutor-confirm-modal-title"
      >
        <h3 id="staff-tutor-confirm-modal-title">{title}</h3>
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

export function StaffTutorDetailClient({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAppToast();
  const deepLinkEdit = searchParams.get("edit") === "1";
  const editDeepLinkHandled = useRef(false);
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSeatsPerSlot, setMaxSeatsPerSlot] = useState("1");
  const [savingSeats, setSavingSeats] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<TutorLifecycleConfirm | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [openHours, setOpenHours] = useState<OpenHourSlot[]>([]);
  const [openDay, setOpenDay] = useState("1");
  const [openStart, setOpenStart] = useState("15:15");
  const [openEnd, setOpenEnd] = useState("17:15");
  const [addingHour, setAddingHour] = useState(false);
  const [removingHourId, setRemovingHourId] = useState<string | null>(null);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tutorRes, subjectsRes, hoursRes] = await Promise.all([
        fetch(`/api/staff/tutors/${tutorId}`),
        fetch("/api/staff/subjects"),
        fetch(`/api/staff/tutors/${tutorId}/availability`),
      ]);
      const tutorData = await tutorRes.json();
      const subjectsData = await subjectsRes.json();
      const hoursData = await hoursRes.json();

      if (!tutorRes.ok || !tutorData.ok) {
        setError(tutorData.error || "Unable to load tutor.");
        return;
      }

      const next = tutorData.tutor as TutorDetail;
      setTutor({
        ...next,
        notesList: next.notesList ?? [],
      });
      setMaxSeatsPerSlot(String(next.maxSeatsPerSlot ?? 1));

      if (subjectsRes.ok && subjectsData.ok) {
        setCatalog(subjectsData.subjects ?? []);
      }

      if (hoursRes.ok && hoursData.ok) {
        setOpenHours((hoursData.slots as OpenHourSlot[]) ?? []);
      } else {
        setOpenHours([]);
      }
    } catch {
      setError("Unable to load tutor.");
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    router.replace(`/staff/tutors/${tutorId}/edit`);
  }, [deepLinkEdit, tutorId, router]);

  const availableSubjects = useMemo(() => {
    if (!tutor) return catalog;
    const assigned = new Set(tutor.subjects.map((s) => s.id));
    return catalog.filter((s) => !assigned.has(s.id));
  }, [catalog, tutor]);

  async function saveSeats() {
    const seats = Number.parseInt(maxSeatsPerSlot, 10);
    setError(null);
    setSavingSeats(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxSeatsPerSlot: seats }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to update capacity.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Capacity saved.");
      await reload();
    } catch {
      setError("Unable to update capacity.");
      toast.error("Unable to update capacity.");
    } finally {
      setSavingSeats(false);
    }
  }

  async function setActiveStatus(active: boolean) {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to update status.";
        setError(msg);
        toast.error(msg);
        return;
      }
      setLifecycleConfirm(null);
      toast.success(active ? "Tutor restored." : "Tutor archived.");
      await reload();
    } catch {
      setError("Unable to update status.");
      toast.error("Unable to update status.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  async function createNote(body: string): Promise<StaffNoteItem> {
    const response = await fetch(`/api/staff/tutors/${tutorId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to add note.");
    setTutor((prev) =>
      prev ? { ...prev, notesList: [data.note as StaffNoteItem, ...prev.notesList] } : prev,
    );
    return data.note as StaffNoteItem;
  }

  async function updateNote(noteId: string, body: string): Promise<StaffNoteItem> {
    const response = await fetch(`/api/staff/tutors/${tutorId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to update note.");
    setTutor((prev) =>
      prev
        ? {
            ...prev,
            notesList: prev.notesList.map((note) =>
              note.id === noteId ? (data.note as StaffNoteItem) : note,
            ),
          }
        : prev,
    );
    return data.note as StaffNoteItem;
  }

  async function deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/staff/tutors/${tutorId}/notes/${noteId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to delete note.");
    setTutor((prev) =>
      prev ? { ...prev, notesList: prev.notesList.filter((note) => note.id !== noteId) } : prev,
    );
  }

  async function assignSubject(subjectId: string) {
    if (!subjectId || assigning) return;
    setError(null);
    setAssigning(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to assign subject.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Subject assigned.");
      await reload();
    } catch {
      setError("Unable to assign subject.");
      toast.error("Unable to assign subject.");
    } finally {
      setAssigning(false);
    }
  }

  async function removeSubject(subjectId: string) {
    setError(null);
    setRemovingId(subjectId);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/subjects/${subjectId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to remove subject.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Subject removed.");
      await reload();
    } catch {
      setError("Unable to remove subject.");
      toast.error("Unable to remove subject.");
    } finally {
      setRemovingId(null);
    }
  }

  async function addOpenHour() {
    if (addingHour) return;
    const dayOfWeek = Number.parseInt(openDay, 10);
    setError(null);
    setAddingHour(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          startTimeLocal: openStart,
          endTimeLocal: openEnd,
          capacitySeats: Number.parseInt(maxSeatsPerSlot, 10) || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to add open hour.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Open hour added.");
      await reload();
    } catch {
      setError("Unable to add open hour.");
      toast.error("Unable to add open hour.");
    } finally {
      setAddingHour(false);
    }
  }

  async function removeOpenHour(slotId: string) {
    if (removingHourId) return;
    setError(null);
    setRemovingHourId(slotId);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/availability/${slotId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to remove open hour.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Open hour removed.");
      setOpenHours((prev) => prev.filter((slot) => slot.id !== slotId));
    } catch {
      setError("Unable to remove open hour.");
      toast.error("Unable to remove open hour.");
    } finally {
      setRemovingHourId(null);
    }
  }

  async function deleteTutor() {
    if (!tutor?.canDelete || lifecycleBusy) return;
    setLifecycleBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const msg = data.error || "Unable to delete tutor.";
        setError(msg);
        toast.error(msg);
        return;
      }
      router.push("/staff/tutors");
    } catch {
      setError("Unable to delete tutor.");
      toast.error("Unable to delete tutor.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading tutor…</p>;
  if (error && !tutor) return <p className="form-error">{error}</p>;
  if (!tutor) return null;

  const statusKey = tutor.active ? "active" : "archived";
  const addressLines = formatMailingAddressLines(tutor);

  const lifecycleButtons: Array<{
    id: string;
    label: string;
    tone: "archive" | "restore" | "danger";
    onClick: () => void;
    icon: "archive" | "restore" | "delete";
  }> = [];
  if (!tutor.active) {
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
  if (tutor.canDelete) {
    lifecycleButtons.push({
      id: "delete",
      label: "Delete",
      tone: "danger",
      onClick: () => setLifecycleConfirm("delete"),
      icon: "delete",
    });
  }

  const lifecycleConfirmCopy: Record<
    TutorLifecycleConfirm,
    { title: string; body: string; confirmLabel: string; destructive?: boolean }
  > = {
    archive: {
      title: "Archive this tutor?",
      body: "Archived tutors are hidden from the default Tutors list. You can restore them later.",
      confirmLabel: "Archive",
    },
    restore: {
      title: "Restore this tutor?",
      body: "This tutor will appear in the active Tutors list again.",
      confirmLabel: "Restore",
    },
    delete: {
      title: "Permanently delete this tutor?",
      body: "This cannot be undone. Only tutors with no open bookings can be deleted.",
      confirmLabel: "Delete",
      destructive: true,
    },
  };

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
            if (lifecycleConfirm === "archive") void setActiveStatus(false);
            else if (lifecycleConfirm === "restore") void setActiveStatus(true);
            else void deleteTutor();
          }}
        />
      ) : null}

      <div className="family-detail-topbar">
        <Link href="/staff/tutors" className="page-back">
          ← Tutors
        </Link>
        <div className="family-detail-topbar-actions">
          <StaffIconButton
            label="Add note"
            title="Add note"
            tone="note"
            onClick={() => setNoteComposerOpen(true)}
          >
            <IconNote size={15} />
          </StaffIconButton>
          <Link
            href={`/staff/tutors/${tutorId}/edit`}
            className="staff-icon-btn staff-icon-btn-edit staff-icon-btn--labeled"
          >
            <IconPencil size={15} />
            <span>Edit</span>
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
        <span className="avatar navy">{initials(tutor.displayName)}</span>
        <div className="family-record-hero-copy">
          <h2>{tutor.displayName}</h2>
        </div>
        <span className={`pill family-record-hero-status-pill ${statusTone(statusKey)}`}>
          {formatStatusLabel(statusKey)}
        </span>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <StaffRecordPrimaryRow className="staff-equal-cards">
        <Panel className={STAFF_RECORD_INFO_CARD_CLASS}>
          <div className="family-panel-heading">
            <h2>Profile</h2>
          </div>
          <div className="family-household-summary">
            <div className="family-household-dense tutor-profile-dense">
              <StaffDetailFieldGroup className="family-household-upper tutor-profile-fields">
                <StaffDetailField label="Name" showEmpty>{tutor.displayName}</StaffDetailField>
                <StaffDetailField label="Email" showEmpty>{tutor.email}</StaffDetailField>
                <StaffDetailField label="Phone" showEmpty>{tutor.phone}</StaffDetailField>
                <StaffDetailField label="Open bookings">{tutor.workloadCount}</StaffDetailField>
              </StaffDetailFieldGroup>
              <StaffDetailFieldGroup className="family-household-lower">
                <StaffDetailField label="Mailing address" className="family-household-field-address" showEmpty>
                  {addressLines.length ? (
                    <div className="family-household-address-lines">
                      {addressLines.map((line, index) => (
                        <span key={`${index}-${line}`}>{line}</span>
                      ))}
                    </div>
                  ) : null}
                </StaffDetailField>
              </StaffDetailFieldGroup>
            </div>
          </div>
        </Panel>

        <Panel className="family-equal-panel tutor-subjects-panel">
          <div className="family-panel-heading">
            <h2>Subjects</h2>
          </div>
          <div className="tutor-subjects-body">
            <div className="tutor-subjects-control" role="group" aria-label="Assigned subjects">
              {tutor.subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className="tutor-subjects-chip"
                  disabled={removingId === subject.id || assigning}
                  aria-label={`Remove ${subject.name}`}
                  title={`Remove ${subject.name}`}
                  onClick={() => void removeSubject(subject.id)}
                >
                  {removingId === subject.id ? "…" : `${subject.name} ×`}
                </button>
              ))}
              <select
                id="tutor-add-subject"
                className="tutor-subjects-add"
                defaultValue=""
                aria-label="Add subject"
                disabled={assigning || availableSubjects.length === 0}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  e.target.value = "";
                  void assignSubject(value);
                }}
              >
                <option value="">
                  {availableSubjects.length === 0 ? "All subjects assigned" : "Add subject…"}
                </option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                    {subject.code ? ` (${subject.code})` : ""}
                    {subject.category ? ` · ${subject.category}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {tutor.subjects.length === 0 ? (
              <p className="tutor-subjects-empty">No subjects linked yet.</p>
            ) : null}
          </div>
        </Panel>

        <StaffRecordIntegrationsCard stackFields />
      </StaffRecordPrimaryRow>

      <div className="family-detail-layout family-detail-stack">
        <Panel className="family-equal-panel tutor-capacity-panel">
          <div className="family-panel-heading">
            <h2>Capacity</h2>
          </div>
          <div className="tutor-capacity-body">
            <label className="tutor-capacity-label" htmlFor="tutor-max-seats">
              Max seats per slot
            </label>
            <div className="tutor-capacity-row">
              <input
                id="tutor-max-seats"
                type="number"
                min={1}
                className="tutor-capacity-input"
                value={maxSeatsPerSlot}
                onChange={(e) => setMaxSeatsPerSlot(e.target.value)}
              />
              <button
                type="button"
                className="primary-button tutor-capacity-save"
                disabled={savingSeats}
                onClick={() => void saveSeats()}
              >
                {savingSeats ? "Saving…" : "Save"}
              </button>
            </div>
            <p className="tutor-capacity-helper">How many students can share one time.</p>
          </div>
        </Panel>
      </div>

      <Panel className="family-equal-panel tutor-open-hours-panel">
        <div className="family-panel-heading">
          <h2>Open hours</h2>
        </div>
        <div className="tutor-open-hours-body">
          <p className="tutor-open-hours-helper">
            Weekly times this tutor can be booked. Capacity above sets seats per slot for new hours.
          </p>

          <div className="tutor-open-hours-add" role="group" aria-label="Add open hour">
            <label className="tutor-open-hours-field">
              <span>Day</span>
              <select
                value={openDay}
                aria-label="Day of week"
                disabled={addingHour}
                onChange={(e) => setOpenDay(e.target.value)}
              >
                {WEEKDAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="tutor-open-hours-field">
              <span>Start</span>
              <input
                type="time"
                value={openStart}
                aria-label="Start time"
                disabled={addingHour}
                onChange={(e) => setOpenStart(e.target.value)}
              />
            </label>
            <label className="tutor-open-hours-field">
              <span>End</span>
              <input
                type="time"
                value={openEnd}
                aria-label="End time"
                disabled={addingHour}
                onChange={(e) => setOpenEnd(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="primary-button tutor-open-hours-add-btn"
              disabled={addingHour || !openStart || !openEnd}
              onClick={() => void addOpenHour()}
            >
              {addingHour ? "Adding…" : "Add"}
            </button>
          </div>

          {openHours.length === 0 ? (
            <p className="tutor-open-hours-empty">No open hours yet. Add a weekly time above.</p>
          ) : (
            <ul className="tutor-open-hours-list">
              {openHours.map((slot) => {
                const day = DAY_LABELS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`;
                const range = `${formatTimeLabel(slot.startTimeLocal)} – ${formatTimeLabel(slot.endTimeLocal)}`;
                const seatsUsed = slot.heldSeats + slot.bookedSeats;
                const showLabel = !isRedundantHourLabel(slot.label, range);
                return (
                  <li key={slot.id} className="tutor-open-hours-row">
                    <div className="tutor-open-hours-row-main">
                      <strong className="tutor-open-hours-day">{day}</strong>
                      <span className="tutor-open-hours-range">{range}</span>
                      {showLabel ? <span className="tutor-open-hours-label">{slot.label}</span> : null}
                    </div>
                    <div className="tutor-open-hours-row-meta">
                      <span className="tutor-open-hours-seats">
                        {seatsUsed} of {slot.capacitySeats} booked
                      </span>
                      <button
                        type="button"
                        className="tutor-open-hours-remove"
                        disabled={removingHourId === slot.id || addingHour}
                        aria-label={`Remove ${day} ${range}`}
                        title="Remove"
                        onClick={() => void removeOpenHour(slot.id)}
                      >
                        {removingHourId === slot.id ? "…" : "Remove"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      <Panel className="family-equal-panel tutor-seat-grid-panel">
        <div className="tutor-seat-grid-heading">
          <div className="family-panel-heading">
            <h2>Seat grid</h2>
          </div>
          <p className="tutor-seat-grid-helper">
            Per-window seat assignments for this tutor&apos;s open hours.
          </p>
        </div>
        {openHours.length === 0 ? (
          <p className="tutor-open-hours-empty tutor-seat-grid-empty">No open hours yet. Add a weekly time above.</p>
        ) : (
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-seats">
              <span>Window</span>
              <span>Seat</span>
              <span>Student</span>
              <span className="staff-dir-col-status">State</span>
            </div>
            {openHours.flatMap((slot) => {
              const dayShort = DAY_SHORT[slot.dayOfWeek] ?? `D${slot.dayOfWeek}`;
              const windowLabel = `${dayShort} · ${formatTimeLabel(slot.startTimeLocal)}`;
              const seats =
                slot.seats && slot.seats.length > 0
                  ? slot.seats
                  : Array.from({ length: slot.capacitySeats }, (_, index) => ({
                      seat: index + 1,
                      studentId: null as string | null,
                      studentName: null as string | null,
                      bookingId: null as string | null,
                      state: "open",
                    }));
              return seats.map((seat) => {
                const isOpen = seat.state === "open";
                const studentLabel = isOpen ? "Available" : seat.studentName?.trim() || "Booked";
                const rowKey = `${slot.id}-${seat.seat}`;
                const rowClass = `table-row staff-dir-cols-seats${isOpen ? " tutor-seat-row-static" : ""}`;
                const cells = (
                  <>
                    <span>{windowLabel}</span>
                    <span>{seat.seat}</span>
                    <span className={isOpen ? "tutor-seat-open" : undefined}>{studentLabel}</span>
                    <span className="staff-dir-col-status">
                      <span className={`pill ${isOpen ? "amber" : statusTone(seat.state)}`}>
                        {isOpen ? "Available" : formatStatusLabel(seat.state)}
                      </span>
                    </span>
                  </>
                );
                if (!isOpen && seat.studentId) {
                  return (
                    <Link key={rowKey} href={`/staff/students/${seat.studentId}`} className={rowClass}>
                      {cells}
                    </Link>
                  );
                }
                return (
                  <div key={rowKey} className={rowClass}>
                    {cells}
                  </div>
                );
              });
            })}
          </div>
        )}
      </Panel>

      <StaffNotesSection
        layout="list"
        composerOpen={noteComposerOpen}
        onComposerOpenChange={setNoteComposerOpen}
        notes={tutor.notesList}
        onCreate={createNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onSuccess={(text) => toast.success(text)}
        onError={(text) => {
          setError(text);
          toast.error(text);
        }}
      />
    </>
  );
}
