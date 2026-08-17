"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { StaffDirectoryCard } from "@/components/staff-directory-card";
import {
  DirectorySortSelect,
  StaffDirectoryChrome,
  StaffDirectoryResults,
} from "@/components/staff-directory-chrome";
import { StaffRowActions, lifecycleActions } from "@/components/staff-row-actions";
import { useDirectoryView } from "@/lib/ui/directory-view";
import {
  DEFAULT_DIRECTORY_SORT,
  formatDirectoryCreatedAt,
  type DirectorySort,
} from "@/lib/ui/directory-sort";
import { useDebouncedValue } from "@/lib/ui/use-debounced-value";
import { GuardianRelationshipRolePill } from "@/components/guardian-relationship-role-pill";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "active" | "archived";
  linkStatus: "linked" | "invite_pending" | "unlinked";
  relationshipRole: "parent_1" | "parent_2" | null;
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  household: {
    id: string | null;
    displayName: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All (non-archived)" },
  { value: "linked", label: "Linked" },
  { value: "invite_pending", label: "Invite pending" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All statuses" },
] as const;

export function StaffGuardiansClient() {
  const router = useRouter();
  const { view, setView } = useDirectoryView("pt.dirView.staff.guardians", "table");
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<DirectorySort>(DEFAULT_DIRECTORY_SORT);
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  // Memoize so reload deps stay stable (inline object would refetch every render).
  const applied = useMemo(() => ({ q: debouncedQ, status, sort }), [debouncedQ, status, sort]);
  const filtersActive = q.trim() !== "" || status !== "" || sort !== DEFAULT_DIRECTORY_SORT;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.status) params.set("status", applied.status);
      params.set("sort", applied.sort);
      const query = params.toString();
      const response = await fetch(`/api/staff/guardians${query ? `?${query}` : ""}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load guardians.");
        return;
      }
      setGuardians(data.guardians ?? []);
    } catch {
      setError("Unable to load guardians.");
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

  function clearFilters() {
    setQ("");
    setStatus("");
    setSort(DEFAULT_DIRECTORY_SORT);
  }

  function openGuardian(guardianId: string) {
    router.push(`/staff/guardians/${guardianId}`);
  }

  function openFamily(householdId: string | null) {
    if (!householdId) return;
    router.push(`/staff/families/${householdId}`);
  }

  async function setGuardianStatus(id: string, next: "active" | "archived") {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/staff/guardians/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update guardian.");
        return;
      }
      await reload();
    } catch {
      setError("Unable to update guardian.");
    } finally {
      setBusyId(null);
    }
  }

  function rowStatusKey(row: GuardianRow) {
    if (row.status === "archived") return "archived";
    return row.linkStatus;
  }

  function rowActions(row: GuardianRow) {
    const familyId = row.household.id;
    const actions = lifecycleActions({
      isArchived: row.status === "archived",
      canDelete: false,
      busy: busyId === row.id,
      onEdit: () => openGuardian(row.id),
      onArchive: () => void setGuardianStatus(row.id, "archived"),
      onRestore: () => void setGuardianStatus(row.id, "active"),
      onDelete: () => undefined,
    });
    actions.push({
      id: "open-family",
      label: familyId ? "Open family" : "Unassigned",
      disabled: !familyId,
      onSelect: () => openFamily(familyId),
    });
    return actions;
  }

  return (
    <>
      <PageIntro
        title="Guardians"
        action={
          <Link href="/staff/families?newGuardian=1" className="primary-button" style={{ textDecoration: "none" }}>
            + New Guardian
          </Link>
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
        viewLabel="Guardians layout"
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        filterColumns="1.8fr 1fr 1fr"
      >
        <label className="student-search">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, phone, or family"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
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
        isEmpty={guardians.length === 0}
        loadingMessage="Loading guardians…"
        emptyMessage="No guardians match these filters."
        cards={guardians.map((row) => {
          const fullName = `${row.firstName} ${row.lastName}`.trim();
          const statusKey = rowStatusKey(row);
          return (
            <StaffDirectoryCard
              key={row.id}
              title={fullName}
              subtitle={row.email}
              status={
                <span className={`pill ${statusTone(statusKey)}`}>{formatStatusLabel(statusKey)}</span>
              }
              fields={[
                {
                  id: "parent_role",
                  label: "Parent role",
                  value: <GuardianRelationshipRolePill role={row.relationshipRole} />,
                },
                { id: "family", label: "Family", value: row.household.displayName },
                { id: "phone", label: "Phone", value: row.phone || "—" },
              ]}
              footerField={{
                id: "created",
                label: "Created At",
                value: formatDirectoryCreatedAt(row.createdAt),
              }}
              actions={rowActions(row)}
              onOpen={() => openGuardian(row.id)}
            />
          );
        })}
        table={
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-guardians">
              <span>Name</span>
              <span>Parent role</span>
              <span>Email</span>
              <span>Family</span>
              <span className="staff-dir-col-status">Status</span>
              <span>Created At</span>
              <span className="staff-dir-col-actions" aria-label="Actions" />
            </div>
            {guardians.map((row) => {
              const fullName = `${row.firstName} ${row.lastName}`.trim();
              const statusKey = rowStatusKey(row);
              return (
                <div
                  key={row.id}
                  className="table-row staff-dir-cols-guardians"
                  role="link"
                  tabIndex={0}
                  onClick={() => openGuardian(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openGuardian(row.id);
                    }
                  }}
                >
                  <span>
                    <strong>{fullName}</strong>
                  </span>
                  <span>
                    <GuardianRelationshipRolePill role={row.relationshipRole} />
                  </span>
                  <span>{row.email}</span>
                  <span>{row.household.displayName}</span>
                  <span className="staff-dir-col-status">
                    <span className={`pill ${statusTone(statusKey)}`}>{formatStatusLabel(statusKey)}</span>
                  </span>
                  <span>{formatDirectoryCreatedAt(row.createdAt)}</span>
                  <span className="staff-dir-col-actions">
                    <StaffRowActions label="Row actions" actions={rowActions(row)} />
                  </span>
                </div>
              );
            })}
          </div>
        }
      />
    </>
  );
}
