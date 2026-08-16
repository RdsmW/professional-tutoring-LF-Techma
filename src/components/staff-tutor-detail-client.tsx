"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AddressAutocompleteInput } from "@/components/address-autocomplete-input";
import { StaffNotesSection, type StaffNoteItem } from "@/components/staff-notes-section";
import { PageIntro, Panel } from "@/components/ui";
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

type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  category: string | null;
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

export function StaffTutorDetailClient({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkEdit = searchParams.get("edit") === "1";
  const editDeepLinkHandled = useRef(false);
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSeatsPerSlot, setMaxSeatsPerSlot] = useState("1");
  const [savingSeats, setSavingSeats] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tutorRes, subjectsRes] = await Promise.all([
        fetch(`/api/staff/tutors/${tutorId}`),
        fetch("/api/staff/subjects"),
      ]);
      const tutorData = await tutorRes.json();
      const subjectsData = await subjectsRes.json();

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
    if (!tutor || !deepLinkEdit || editDeepLinkHandled.current) return;
    editDeepLinkHandled.current = true;
    setProfileForm(toProfileForm(tutor));
    setEditing(true);
    setError(null);
    setMessage(null);
    router.replace(`/staff/tutors/${tutorId}`, { scroll: false });
  }, [tutor, deepLinkEdit, tutorId, router]);

  const availableSubjects = useMemo(() => {
    if (!tutor) return catalog;
    const assigned = new Set(tutor.subjects.map((s) => s.id));
    return catalog.filter((s) => !assigned.has(s.id));
  }, [catalog, tutor]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    if (!availableSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId("");
    }
  }, [availableSubjects, selectedSubjectId]);

  async function patchTutor(body: Record<string, unknown>, mode: "seats" | "active" | "profile") {
    setError(null);
    setMessage(null);
    if (mode === "seats") setSavingSeats(true);
    if (mode === "active") setTogglingActive(true);
    if (mode === "profile") setSavingProfile(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update tutor.");
        return;
      }
      setMessage("Saved.");
      if (mode === "profile") setEditing(false);
      await reload();
    } catch {
      setError("Unable to update tutor.");
    } finally {
      setSavingSeats(false);
      setTogglingActive(false);
      setSavingProfile(false);
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

  async function assignSubject() {
    if (!selectedSubjectId) {
      setError("Select a subject to assign.");
      return;
    }
    setError(null);
    setMessage(null);
    setAssigning(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubjectId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to assign subject.");
        return;
      }
      setSelectedSubjectId("");
      setMessage("Subject assigned.");
      await reload();
    } catch {
      setError("Unable to assign subject.");
    } finally {
      setAssigning(false);
    }
  }

  async function removeSubject(subjectId: string) {
    setError(null);
    setMessage(null);
    setRemovingId(subjectId);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}/subjects/${subjectId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to remove subject.");
        return;
      }
      setMessage("Subject removed.");
      await reload();
    } catch {
      setError("Unable to remove subject.");
    } finally {
      setRemovingId(null);
    }
  }

  async function deleteTutor() {
    if (!tutor?.canDelete || togglingActive) return;
    if (!window.confirm("Permanently delete this tutor? This cannot be undone.")) return;
    setError(null);
    setMessage(null);
    setTogglingActive(true);
    try {
      const response = await fetch(`/api/staff/tutors/${tutorId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete tutor.");
        return;
      }
      router.push("/staff/tutors");
    } catch {
      setError("Unable to delete tutor.");
    } finally {
      setTogglingActive(false);
    }
  }

  if (loading) return <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading tutor…</p>;
  if (error && !tutor) return <p className="form-error">{error}</p>;
  if (!tutor) return null;

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
        <Link href="/staff/tutors" className="page-back">
          ← Tutors
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="action-btn action-btn-edit"
            onClick={() => {
              setProfileForm(toProfileForm(tutor));
              setEditing(true);
              setError(null);
              setMessage(null);
            }}
          >
            Edit
          </button>
          {!tutor.active ? (
            <button
              type="button"
              className="action-btn action-btn-restore"
              disabled={togglingActive}
              onClick={() => void patchTutor({ active: true }, "active")}
            >
              {togglingActive ? "Updating…" : "Restore"}
            </button>
          ) : tutor.canDelete ? (
            <button
              type="button"
              className="action-btn action-btn-delete"
              disabled={togglingActive}
              onClick={() => void deleteTutor()}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="action-btn action-btn-archive"
              disabled={togglingActive}
              onClick={() => void patchTutor({ active: false }, "active")}
            >
              {togglingActive ? "Updating…" : "Archive"}
            </button>
          )}
        </div>
      </div>
      <PageIntro
        title={tutor.displayName}
        action={
          <span className={`pill ${statusTone(tutor.active ? "active" : "archived")}`}>
            {formatStatusLabel(tutor.active ? "active" : "archived")}
          </span>
        }
      />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p style={{ fontSize: 14, marginBottom: 12 }}>{message}</p> : null}

      {editing && profileForm ? (
        <Panel title="Edit tutor">
          <form
            className="input-grid"
            style={{ gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              void patchTutor(
                {
                  displayName: profileForm.displayName,
                  email: profileForm.email || null,
                  phone: profileForm.phone || null,
                  addressLine1: profileForm.addressLine1 || null,
                  addressLine2: profileForm.addressLine2 || null,
                  city: profileForm.city || null,
                  state: profileForm.state || null,
                  postalCode: profileForm.postalCode || null,
                  country: "United States",
                },
                "profile",
              );
            }}
          >
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

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="primary-button" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save profile"}
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
        <Panel title="Profile" eyebrow="Tutor">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Email</small>
              <strong>{tutor.email || "—"}</strong>
            </span>
            <span>
              <small>Phone</small>
              <strong>{tutor.phone || "—"}</strong>
            </span>
            <span>
              <small>Status</small>
              <strong>{tutor.active ? "Active" : "Archived"}</strong>
            </span>
            <span>
              <small>Workload</small>
              <strong>
                {tutor.workloadCount} open booking{tutor.workloadCount === 1 ? "" : "s"}
              </strong>
            </span>
          </div>
        </Panel>

        <Panel title="Mailing address">
          <div className="family-detail-grid profile-detail-grid">
            <span>
              <small>Street</small>
              <strong>{tutor.addressLine1 || "—"}</strong>
            </span>
            <span>
              <small>Line 2</small>
              <strong>{tutor.addressLine2 || "—"}</strong>
            </span>
            <span>
              <small>City</small>
              <strong>{tutor.city || "—"}</strong>
            </span>
            <span>
              <small>State</small>
              <strong>{tutor.state || "—"}</strong>
            </span>
            <span>
              <small>ZIP</small>
              <strong>{tutor.postalCode || "—"}</strong>
            </span>
            <span>
              <small>Country</small>
              <strong>{tutor.country || "United States"}</strong>
            </span>
          </div>
        </Panel>
      </div>

      <div className="profile-layout">
        <Panel title="Capacity">
          <label>
            Max seats per slot
            <input
              type="number"
              min={1}
              value={maxSeatsPerSlot}
              onChange={(e) => setMaxSeatsPerSlot(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 12 }}
            disabled={savingSeats}
            onClick={() => {
              const seats = Number.parseInt(maxSeatsPerSlot, 10);
              void patchTutor({ maxSeatsPerSlot: seats }, "seats");
            }}
          >
            {savingSeats ? "Saving…" : "Save seats"}
          </button>
        </Panel>
      </div>

      <StaffNotesSection
        notes={tutor.notesList}
        onCreate={createNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onSuccess={(text) => setMessage(text)}
        onError={(text) => setError(text)}
      />

      <Panel title="Subjects">
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ flex: "1 1 220px", margin: 0 }}>
            Assign subject
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={assigning || availableSubjects.length === 0}
            >
              <option value="">
                {availableSubjects.length === 0 ? "No subjects available" : "Select subject…"}
              </option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                  {subject.code ? ` (${subject.code})` : ""}
                  {subject.category ? ` · ${subject.category}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="primary-button"
            disabled={assigning || !selectedSubjectId}
            onClick={() => void assignSubject()}
          >
            {assigning ? "Adding…" : "Add"}
          </button>
        </div>

        {tutor.subjects.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No subjects linked yet.</p>
        ) : (
          tutor.subjects.map((subject) => (
            <div
              key={subject.id}
              style={{
                borderTop: "1px solid var(--line)",
                padding: "10px 0",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <strong>{subject.name}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
                  {subject.code}
                  {subject.priority ? ` · priority ${subject.priority}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                style={{ height: 32, flexShrink: 0 }}
                disabled={removingId === subject.id}
                onClick={() => void removeSubject(subject.id)}
              >
                {removingId === subject.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}
