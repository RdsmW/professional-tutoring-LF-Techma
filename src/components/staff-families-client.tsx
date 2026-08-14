"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { StaffNewFamilyWizard } from "@/components/staff-new-family-wizard";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

const STATUS_OPTIONS = [
  { value: "", label: "All (non-archived)" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All statuses" },
] as const;

export function StaffFamiliesClient({
  initialFamilies = [],
}: {
  initialFamilies?: StaffFamilyListRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [families, setFamilies] = useState<StaffFamilyListRow[]>(initialFamilies);
  const [householdOptions, setHouseholdOptions] = useState<StaffFamilyListRow[]>(initialFamilies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingGuardian, setAddingGuardian] = useState(false);
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState({ q: "", status: "" });
  const [guardianForm, setGuardianForm] = useState({
    householdId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isBillingOwner: false,
  });

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreating(true);
    if (searchParams.get("newGuardian") === "1") setAddingGuardian(true);
  }, [searchParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.status) params.set("status", applied.status);
      const query = params.toString();
      const response = await fetch(`/api/staff/families${query ? `?${query}` : ""}`);
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
  }, [applied]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const showStaffRetry =
    Boolean(error) &&
    (error!.toLowerCase().includes("staff profile") || error!.toLowerCase().includes("database not configured"));

  useEffect(() => {
    if (!addingGuardian) return;
    void (async () => {
      try {
        const response = await fetch("/api/staff/families?status=all");
        const data = await response.json();
        if (response.ok && data.ok) {
          setHouseholdOptions(data.families ?? []);
        }
      } catch {
        // keep existing options
      }
    })();
  }, [addingGuardian]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setApplied({ q: q.trim(), status });
  }

  function clearFilters() {
    setQ("");
    setStatus("");
    setApplied({ q: "", status: "" });
  }

  async function createGuardian(event: React.FormEvent) {
    event.preventDefault();
    if (savingGuardian) return;
    if (!isValidEmail(guardianForm.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (guardianForm.phone.trim() && !isValidPhone(guardianForm.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setSavingGuardian(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${guardianForm.householdId}/guardians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guardianForm),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create guardian.");
        return;
      }
      router.push(`/staff/families/${guardianForm.householdId}`);
    } catch {
      setError("Unable to create guardian.");
    } finally {
      setSavingGuardian(false);
    }
  }

  if (creating) {
    return (
      <StaffNewFamilyWizard
        onCancel={() => {
          setCreating(false);
          router.replace("/staff/families");
        }}
      />
    );
  }

  if (addingGuardian) {
    return (
      <section className="wizard-shell panel">
        <button
          type="button"
          className="page-back"
          onClick={() => {
            setAddingGuardian(false);
            router.replace("/staff/families");
          }}
        >
          ← Families
        </button>
        <h2>New guardian</h2>
        <form className="wizard-stage" onSubmit={createGuardian}>
          <div className="input-grid">
            <label>
              Household
              <select
                value={guardianForm.householdId}
                onChange={(e) => setGuardianForm({ ...guardianForm, householdId: e.target.value })}
                required
              >
                <option value="">Select family</option>
                {householdOptions.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              First name
              <input
                value={guardianForm.firstName}
                onChange={(e) => setGuardianForm({ ...guardianForm, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              Last name
              <input
                value={guardianForm.lastName}
                onChange={(e) => setGuardianForm({ ...guardianForm, lastName: e.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={guardianForm.email}
                onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={guardianForm.phone}
                onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={guardianForm.isBillingOwner}
                onChange={(e) =>
                  setGuardianForm({ ...guardianForm, isBillingOwner: e.target.checked })
                }
              />
              Billing owner
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-back"
              onClick={() => {
                setAddingGuardian(false);
                router.replace("/staff/families");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={savingGuardian}>
              {savingGuardian ? "Creating…" : "Create guardian"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <>
      <PageIntro
        title="Families"
        action={
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/staff/families/merges" className="secondary-button" style={{ textDecoration: "none" }}>
              Merge queue
            </Link>
            <button type="button" className="primary-button" onClick={() => setCreating(true)}>
              + New Family
            </button>
          </span>
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
      <Panel>
        <form
          className="student-filter-panel"
          onSubmit={applyFilters}
          style={{ gridTemplateColumns: "1.6fr 1fr auto auto" }}
        >
          <label className="student-search">
            Search name or phone
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Household name or phone"
            />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "default"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-button" style={{ height: 36, alignSelf: "end" }}>
            Filter
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ height: 36, alignSelf: "end" }}
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>

        {loading ? <p className="dashboard-empty">Loading families…</p> : null}
        {families.length === 0 && !loading ? (
          <p className="dashboard-empty">No households match these filters.</p>
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
                    {formatStatusLabel(row.status)} · {row.studentCount} student
                    {row.studentCount === 1 ? "" : "s"} · {row.guardianCount} guardian
                    {row.guardianCount === 1 ? "" : "s"}
                  </small>
                </span>
                <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
                <b>Detail →</b>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
