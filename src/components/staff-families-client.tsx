"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";

type FamilyRow = {
  id: string;
  displayName: string;
  status: string;
  studentCount: number;
  guardianCount: number;
};

export function StaffFamiliesClient() {
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    primaryPhone: "",
    billingFirstName: "",
    billingLastName: "",
    billingEmail: "",
    secondFirstName: "",
    secondLastName: "",
    secondEmail: "",
    studentDisplayName: "",
  });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/families");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load families.");
        return;
      }
      setFamilies(data.families ?? []);
    } catch {
      setError("Unable to load families.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createFamily(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create family.");
        return;
      }
      router.push(`/staff/families/${data.familyId}`);
    } catch {
      setError("Unable to create family.");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="page-back" onClick={() => setCreating(false)}>
          ← Families
        </button>
        <span className="eyebrow">Staff · New Family</span>
        <h2>Create household</h2>
        <form className="wizard-stage" onSubmit={createFamily}>
          <div className="input-grid">
            <label>
              Family account name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </label>
            <label>
              Primary phone
              <input
                value={form.primaryPhone}
                onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
              />
            </label>
            <label>
              Billing guardian first name
              <input
                value={form.billingFirstName}
                onChange={(e) => setForm({ ...form, billingFirstName: e.target.value })}
                required
              />
            </label>
            <label>
              Billing guardian last name
              <input
                value={form.billingLastName}
                onChange={(e) => setForm({ ...form, billingLastName: e.target.value })}
                required
              />
            </label>
            <label>
              Billing guardian email
              <input
                type="email"
                value={form.billingEmail}
                onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                required
              />
            </label>
            <label>
              Second guardian first name (optional)
              <input
                value={form.secondFirstName}
                onChange={(e) => setForm({ ...form, secondFirstName: e.target.value })}
              />
            </label>
            <label>
              Second guardian last name (optional)
              <input
                value={form.secondLastName}
                onChange={(e) => setForm({ ...form, secondLastName: e.target.value })}
              />
            </label>
            <label>
              Second guardian email (optional)
              <input
                type="email"
                value={form.secondEmail}
                onChange={(e) => setForm({ ...form, secondEmail: e.target.value })}
              />
            </label>
            <label>
              First student name (optional)
              <input
                value={form.studentDisplayName}
                onChange={(e) => setForm({ ...form, studentDisplayName: e.target.value })}
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="wizard-back" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Creating…" : "Create family"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Families"
        title="Families"
        description="Each Family account is owned by a parent/guardian. Students are children under the household."
        action={
          <button type="button" className="primary-button" onClick={() => setCreating(true)}>
            + New Family
          </button>
        }
      />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading families…</p> : null}
      <Panel title="Household directory" eyebrow="Live database">
        {families.length === 0 && !loading ? (
          <p style={{ color: "var(--muted)" }}>No households yet.</p>
        ) : (
          <div className="table-panel">
            {families.map((row) => (
              <Link key={row.id} href={`/staff/families/${row.id}`} className="family-row">
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
                    {row.status} · {row.studentCount} student{row.studentCount === 1 ? "" : "s"} ·{" "}
                    {row.guardianCount} guardian{row.guardianCount === 1 ? "" : "s"}
                  </small>
                </span>
                <span className="pill">{row.status}</span>
                <b>Detail →</b>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
