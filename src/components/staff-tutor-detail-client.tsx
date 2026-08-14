"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type TutorDetail = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  maxSeatsPerSlot: number;
  notes: string | null;
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

export function StaffTutorDetailClient({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [maxSeatsPerSlot, setMaxSeatsPerSlot] = useState("1");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingSeats, setSavingSeats] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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

      setTutor(tutorData.tutor);
      setNotes(tutorData.tutor.notes ?? "");
      setMaxSeatsPerSlot(String(tutorData.tutor.maxSeatsPerSlot ?? 1));

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

  async function patchTutor(body: Record<string, unknown>, mode: "notes" | "seats" | "active") {
    setError(null);
    setMessage(null);
    if (mode === "notes") setSavingNotes(true);
    if (mode === "seats") setSavingSeats(true);
    if (mode === "active") setTogglingActive(true);
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
      await reload();
    } catch {
      setError("Unable to update tutor.");
    } finally {
      setSavingNotes(false);
      setSavingSeats(false);
      setTogglingActive(false);
    }
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
      <Link href="/staff/tutors" className="page-back" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Tutors
      </Link>
      <PageIntro
        title={tutor.displayName}
        action={
          <span className={`pill ${statusTone(tutor.active ? "active" : "archived")}`}>
            {formatStatusLabel(tutor.active ? "active" : "archived")}
          </span>
        }
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          type="button"
          className="secondary-button"
          disabled={togglingActive}
          onClick={() => void patchTutor({ active: !tutor.active }, "active")}
        >
          {togglingActive ? "Updating…" : tutor.active ? "Archive" : "Restore"}
        </button>
        {tutor.canDelete ? (
          <button
            type="button"
            className="secondary-button"
            disabled={togglingActive}
            onClick={() => void deleteTutor()}
          >
            Delete
          </button>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p style={{ fontSize: 14, marginBottom: 12 }}>{message}</p> : null}

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

      <Panel title="Notes" eyebrow="Internal">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 12 }}
          disabled={savingNotes}
          onClick={() => void patchTutor({ notes }, "notes")}
        >
          {savingNotes ? "Saving…" : "Save notes"}
        </button>
      </Panel>

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
