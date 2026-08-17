"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { StaffDirectoryCard } from "@/components/staff-directory-card";
import {
  DirectorySortSelect,
  StaffDirectoryChrome,
  StaffDirectoryResults,
} from "@/components/staff-directory-chrome";
import { StaffNewFamilyWizard } from "@/components/staff-new-family-wizard";
import { StaffRowActions, lifecycleActions } from "@/components/staff-row-actions";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";
import { useDirectoryView } from "@/lib/ui/directory-view";
import {
  DEFAULT_DIRECTORY_SORT,
  formatDirectoryCreatedAt,
  type DirectorySort,
} from "@/lib/ui/directory-sort";
import { useDebouncedValue } from "@/lib/ui/use-debounced-value";
import { isValidEmail, isValidPhone } from "@/lib/validation/contact";
import { staffCreateCancelPath } from "@/lib/ui/staff-create-return";
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
  const { view, setView } = useDirectoryView("pt.dirView.staff.families", "table");
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
  const [sort, setSort] = useState<DirectorySort>(DEFAULT_DIRECTORY_SORT);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  // Memoize so reload deps stay stable (inline object would refetch every render).
  const applied = useMemo(() => ({ q: debouncedQ, status, sort }), [debouncedQ, status, sort]);
  const filtersActive = q.trim() !== "" || status !== "" || sort !== DEFAULT_DIRECTORY_SORT;
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
    const householdId = searchParams.get("householdId") || searchParams.get("household") || "";
    if (householdId) {
      setGuardianForm((prev) => ({ ...prev, householdId }));
    }
  }, [searchParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.status) params.set("status", applied.status);
      params.set("sort", applied.sort);
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

  function clearFilters() {
    setQ("");
    setStatus("");
    setSort(DEFAULT_DIRECTORY_SORT);
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

  function exitFamilyCreate() {
    setCreating(false);
    const path = staffCreateCancelPath(searchParams, "/staff/families");
    if (path) router.replace(path);
  }

  function exitGuardianCreate() {
    setAddingGuardian(false);
    const path = staffCreateCancelPath(searchParams, "/staff/families");
    if (path) router.replace(path);
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
      if (data.guardianId) {
        router.push(`/staff/guardians/${data.guardianId}`);
      } else if (guardianForm.householdId) {
        router.push(`/staff/families/${guardianForm.householdId}`);
      } else {
        const path = staffCreateCancelPath(searchParams, "/staff/families");
        router.push(path ?? "/staff/families");
      }
    } catch {
      setError("Unable to create guardian.");
    } finally {
      setSavingGuardian(false);
    }
  }

  if (creating) {
    return <StaffNewFamilyWizard onCancel={exitFamilyCreate} />;
  }

  if (addingGuardian) {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="page-back" onClick={exitGuardianCreate}>
          ← Families
        </button>
        <h2>New guardian</h2>
        <form className="wizard-stage" onSubmit={createGuardian}>
          <div className="input-grid">
            <div className="staff-edit-field-row staff-edit-field-row--3">
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
            </div>
            <div className="staff-edit-field-row staff-edit-field-row--3">
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
              <label className="staff-edit-billing-check">
                Billing owner
                <input
                  type="checkbox"
                  checked={guardianForm.isBillingOwner}
                  onChange={(e) =>
                    setGuardianForm({ ...guardianForm, isBillingOwner: e.target.checked })
                  }
                />
              </label>
            </div>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <div className="wizard-footer">
            <button type="button" className="secondary-button" onClick={exitGuardianCreate}>
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

      <StaffDirectoryChrome
        view={view}
        onViewChange={setView}
        viewLabel="Families layout"
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        filterColumns="1.6fr 1fr 1fr"
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
        <DirectorySortSelect value={sort} onChange={setSort} />
      </StaffDirectoryChrome>

      <StaffDirectoryResults
        view={view}
        loading={loading}
        isEmpty={families.length === 0}
        loadingMessage="Loading families…"
        emptyMessage="No households match these filters."
        cards={families.map((row) => {
          const actions = lifecycleActions({
            isArchived: row.status === "archived",
            canDelete: Boolean(row.canDelete),
            busy: busyId === row.id,
            onEdit: () => router.push(`/staff/families/${row.id}/edit`),
            onArchive: () => void setFamilyStatus(row.id, "archived"),
            onRestore: () => void setFamilyStatus(row.id, "active"),
            onDelete: () => void deleteFamily(row.id),
          });
          return (
            <StaffDirectoryCard
              key={row.id}
              title={row.displayName}
              status={
                <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
              }
              fields={[
                { label: "Payer", value: row.payerName || "—" },
                { label: "Students", value: row.studentCount },
                { label: "Card on file", value: row.cardOnFile ? "Yes" : "No" },
                { label: "Auto-charge", value: row.autoCharge ? "Yes" : "No" },
                { label: "Created", value: formatDirectoryCreatedAt(row.createdAt) },
              ]}
              actions={actions}
              onOpen={() => router.push(`/staff/families/${row.id}`)}
            />
          );
        })}
        table={
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-families">
              <span>Name</span>
              <span>Payer</span>
              <span>Students</span>
              <span>Card on file</span>
              <span>Auto-charge</span>
              <span>Created</span>
              <span className="staff-dir-col-status">Status</span>
              <span className="staff-dir-col-actions" aria-label="Actions" />
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
                <span>{row.payerName || "—"}</span>
                <span>{row.studentCount}</span>
                <span>{row.cardOnFile ? "Yes" : "No"}</span>
                <span>{row.autoCharge ? "Yes" : "No"}</span>
                <span>{formatDirectoryCreatedAt(row.createdAt)}</span>
                <span className="staff-dir-col-status">
                  <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
                </span>
                <span className="staff-dir-col-actions">
                  <StaffRowActions
                    label="Row actions"
                    actions={lifecycleActions({
                      isArchived: row.status === "archived",
                      canDelete: Boolean(row.canDelete),
                      busy: busyId === row.id,
                      onEdit: () => router.push(`/staff/families/${row.id}/edit`),
                      onArchive: () => void setFamilyStatus(row.id, "archived"),
                      onRestore: () => void setFamilyStatus(row.id, "active"),
                      onDelete: () => void deleteFamily(row.id),
                    })}
                  />
                </span>
              </div>
            ))}
          </div>
        }
      />
    </>
  );
}
