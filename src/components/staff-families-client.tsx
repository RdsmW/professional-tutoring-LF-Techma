"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { StaffNewFamilyWizard } from "@/components/staff-new-family-wizard";
import { StaffDirectoryFilters, StaffRowActions, lifecycleActions } from "@/components/staff-row-actions";
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
  const [busyId, setBusyId] = useState<string | null>(null);
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

  async function setFamilyStatus(id: string, next: "active" | "archived") {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update family.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to update family.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteFamily(id: string) {
    if (busyId) return;
    if (!window.confirm("Permanently delete this empty household? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/families/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to delete family.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to delete family.");
    } finally {
      setBusyId(null);
    }
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
              className="secondary-button"
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

      <StaffDirectoryFilters>
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
          <button type="submit" className="secondary-button" style={{ height: 36, alignSelf: "end" }}>
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
      </StaffDirectoryFilters>

      <Panel>
        {loading ? <p className="dashboard-empty">Loading families…</p> : null}
        {families.length === 0 && !loading ? (
          <p className="dashboard-empty">No households match these filters.</p>
        ) : (
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-families">
              <span>Name</span>
              <span>Students</span>
              <span>Guardians</span>
              <span className="staff-dir-col-status">Status</span>
              <span className="staff-dir-col-actions">Actions</span>
            </div>
            {families.map((row) => (
              <div
                key={row.id}
                className="table-row staff-dir-cols-families"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/staff/families/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/staff/families/${row.id}`);
                  }
                }}
              >
                <strong>{row.displayName}</strong>
                <span>{row.studentCount}</span>
                <span>{row.guardianCount}</span>
                <span className="staff-dir-col-status">
                  <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
                </span>
                <span className="staff-dir-col-actions">
                  <StaffRowActions
                    label={`Actions for ${row.displayName}`}
                    actions={lifecycleActions({
                      isArchived: row.status === "archived",
                      canDelete: Boolean(row.canDelete),
                      busy: busyId === row.id,
                      onEdit: () => router.push(`/staff/families/${row.id}?edit=1`),
                      onArchive: () => void setFamilyStatus(row.id, "archived"),
                      onRestore: () => void setFamilyStatus(row.id, "active"),
                      onDelete: () => void deleteFamily(row.id),
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
