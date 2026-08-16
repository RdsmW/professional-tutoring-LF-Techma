"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { DirectoryViewToggle } from "@/components/directory-view-toggle";
import { StaffDirectoryCard } from "@/components/staff-directory-card";
import { StaffDirectoryFilters, StaffRowActions, lifecycleActions } from "@/components/staff-row-actions";
import { useDirectoryView } from "@/lib/ui/directory-view";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type TutorRow = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  maxSeatsPerSlot: number;
  notesPreview: string | null;
  canDelete: boolean;
};

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Archived" },
  { value: "", label: "All" },
] as const;

export function StaffTutorsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { view, setView } = useDirectoryView("pt.dirView.staff.tutors", "table");
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    notes: "",
    maxSeatsPerSlot: "1",
  });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("true");
  const [applied, setApplied] = useState({ q: "", active: "true" });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.active) params.set("active", applied.active);
      const query = params.toString();
      const response = await fetch(`/api/staff/tutors${query ? `?${query}` : ""}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load tutors.");
        return;
      }
      setTutors(data.tutors ?? []);
    } catch {
      setError("Unable to load tutors.");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const showStaffRetry =
    Boolean(error) &&
    (error!.toLowerCase().includes("staff profile") || error!.toLowerCase().includes("database not configured"));

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreating(true);
  }, [searchParams]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setApplied({ q: q.trim(), active });
  }

  function clearFilters() {
    setQ("");
    setActive("true");
    setApplied({ q: "", active: "true" });
  }

  async function setTutorActive(id: string, nextActive: boolean) {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update tutor.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to update tutor.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTutor(id: string) {
    if (busyId) return;
    if (!window.confirm("Permanently delete this tutor? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/tutors/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete tutor.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to delete tutor.");
    } finally {
      setBusyId(null);
    }
  }

  async function createTutor(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const seats = Number.parseInt(form.maxSeatsPerSlot, 10);
      const response = await fetch("/api/staff/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
          maxSeatsPerSlot: Number.isFinite(seats) ? seats : 1,
          active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create tutor.");
        return;
      }
      router.push(`/staff/tutors/${data.tutorId}`);
    } catch {
      setError("Unable to create tutor.");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <section className="wizard-shell panel">
        <button
          type="button"
          className="page-back"
          onClick={() => {
            setCreating(false);
            router.replace("/staff/tutors");
          }}
        >
          ← Tutors
        </button>
        <h2>Add tutor</h2>
        <form className="wizard-stage" onSubmit={createTutor}>
          <div className="input-grid">
            <label>
              Display name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Phone (optional)
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Max seats per slot
              <input
                type="number"
                min={1}
                value={form.maxSeatsPerSlot}
                onChange={(e) => setForm({ ...form, maxSeatsPerSlot: e.target.value })}
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="secondary-button" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Creating…" : "Add tutor"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <PageIntro
        title="Tutors"
        action={
          <button type="button" className="primary-button" onClick={() => setCreating(true)}>
            + Add Tutor
          </button>
        }
      />
      {error ? (
        <p className="form-error">
          {error}
          {showStaffRetry ? (
            <>
              {" "}
              <button type="button" className="text-button" onClick={() => void reload()} disabled={loading}>
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="directory-toolbar">
        <StaffDirectoryFilters>
          <form
            className="student-filter-panel"
            onSubmit={applyFilters}
            style={{ gridTemplateColumns: "1.6fr 1fr auto auto" }}
          >
            <label className="student-search">
              Search name, email, or phone
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tutor name, email, or phone"
              />
            </label>
            <label>
              Status
              <select value={active} onChange={(e) => setActive(e.target.value)}>
                {ACTIVE_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="filter-btn">
              Filter
            </button>
            <button type="button" className="clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </form>
        </StaffDirectoryFilters>
        <DirectoryViewToggle view={view} onChange={setView} label="Tutors layout" />
      </div>

      <Panel>
        {loading ? <p className="dashboard-empty">Loading tutors…</p> : null}
        {tutors.length === 0 && !loading ? (
          <p className="dashboard-empty">No tutors match these filters.</p>
        ) : view === "cards" ? (
          <div className="staff-dir-card-grid">
            {tutors.map((row) => {
              const actions = lifecycleActions({
                isArchived: !row.active,
                canDelete: Boolean(row.canDelete),
                busy: busyId === row.id,
                onEdit: () => router.push(`/staff/tutors/${row.id}/edit`),
                onArchive: () => void setTutorActive(row.id, false),
                onRestore: () => void setTutorActive(row.id, true),
                onDelete: () => void deleteTutor(row.id),
              });
              return (
                <StaffDirectoryCard
                  key={row.id}
                  title={row.displayName}
                  subtitle={row.email || undefined}
                  status={
                    <span className={`pill ${statusTone(row.active ? "active" : "inactive")}`}>
                      {formatStatusLabel(row.active ? "active" : "archived")}
                    </span>
                  }
                  fields={[
                    { label: "Email", value: row.email || "—" },
                    { label: "Phone", value: row.phone || "—" },
                  ]}
                  actions={actions}
                  onOpen={() => router.push(`/staff/tutors/${row.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-tutors">
              <span>Name</span>
              <span>Email</span>
              <span className="staff-dir-col-status">Status</span>
              <span className="staff-dir-col-actions" aria-label="Actions" />
            </div>
            {tutors.map((row) => (
              <div
                key={row.id}
                className="table-row staff-dir-cols-tutors"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/staff/tutors/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/staff/tutors/${row.id}`);
                  }
                }}
              >
                <strong>{row.displayName}</strong>
                <span>{row.email || "—"}</span>
                <span className="staff-dir-col-status">
                  <span className={`pill ${statusTone(row.active ? "active" : "inactive")}`}>
                    {formatStatusLabel(row.active ? "active" : "archived")}
                  </span>
                </span>
                <span className="staff-dir-col-actions">
                  <StaffRowActions
                    label="Row actions"
                    actions={lifecycleActions({
                      isArchived: !row.active,
                      canDelete: Boolean(row.canDelete),
                      busy: busyId === row.id,
                      onEdit: () => router.push(`/staff/tutors/${row.id}/edit`),
                      onArchive: () => void setTutorActive(row.id, false),
                      onRestore: () => void setTutorActive(row.id, true),
                      onDelete: () => void deleteTutor(row.id),
                    })}
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
