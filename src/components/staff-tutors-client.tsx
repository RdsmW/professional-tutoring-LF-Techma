"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";

type TutorRow = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  maxSeatsPerSlot: number;
  notesPreview: string | null;
};

export function StaffTutorsClient() {
  const router = useRouter();
  const [tutors, setTutors] = useState<TutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    notes: "",
    maxSeatsPerSlot: "1",
  });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/tutors");
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
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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
        <button type="button" className="page-back" onClick={() => setCreating(false)}>
          ← Tutors
        </button>
        <span className="eyebrow">Staff · New Tutor</span>
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
            <button type="button" className="wizard-back" onClick={() => setCreating(false)}>
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
        eyebrow="Staff Operations · Tutors"
        title="Tutors"
        description="Operational tutor records with capacity and coverage. Best Fit is a staff assist later — parent choice remains final in booking."
        action={
          <button type="button" className="primary-button" onClick={() => setCreating(true)}>
            + Add Tutor
          </button>
        }
      />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading tutors…</p> : null}
      <Panel title="Tutor directory" eyebrow="Live database">
        {tutors.length === 0 && !loading ? (
          <p style={{ color: "var(--muted)" }}>No tutors yet.</p>
        ) : (
          <div className="table-panel">
            {tutors.map((row) => (
              <Link key={row.id} href={`/staff/tutors/${row.id}`} className="family-row">
                <span
                  className="avatar"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--blue-soft)",
                    color: "var(--blue)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  {row.displayName.slice(0, 1)}
                </span>
                <span>
                  <strong>{row.displayName}</strong>
                  <small>
                    {row.email || "No email"} · {row.phone || "No phone"} · {row.maxSeatsPerSlot}{" "}
                    seat{row.maxSeatsPerSlot === 1 ? "" : "s"}/slot
                    {row.notesPreview ? ` · ${row.notesPreview}` : ""}
                  </small>
                </span>
                <span className="pill">{row.active ? "Active" : "Inactive"}</span>
                <b>Detail →</b>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
