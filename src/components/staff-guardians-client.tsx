"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { DirectoryViewToggle } from "@/components/directory-view-toggle";
import { StaffDirectoryCard } from "@/components/staff-directory-card";
import { StaffDirectoryFilters, StaffRowActions } from "@/components/staff-row-actions";
import { useDirectoryView } from "@/lib/ui/directory-view";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import { formatGuardianRelationshipRole } from "@/lib/staff/guardian-shared";

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
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
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "linked", label: "Linked" },
  { value: "invite_pending", label: "Invite pending" },
] as const;

export function StaffGuardiansClient() {
  const router = useRouter();
  const { view, setView } = useDirectoryView("pt.dirView.staff.guardians", "table");
  const [guardians, setGuardians] = useState<GuardianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [applied, setApplied] = useState({ q: "", status: "all" });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.q) params.set("q", applied.q);
      if (applied.status && applied.status !== "all") params.set("status", applied.status);
      else params.set("status", "all");
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

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setApplied({ q: q.trim(), status });
  }

  function clearFilters() {
    setQ("");
    setStatus("all");
    setApplied({ q: "", status: "all" });
  }

  function openGuardian(guardianId: string) {
    router.push(`/staff/guardians/${guardianId}`);
  }

  function openFamily(householdId: string | null) {
    if (!householdId) return;
    router.push(`/staff/families/${householdId}`);
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

      <div className="directory-toolbar">
        <StaffDirectoryFilters>
          <form
            className="student-filter-panel"
            onSubmit={applyFilters}
            style={{ gridTemplateColumns: "1.8fr 1fr auto auto" }}
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
            <button type="submit" className="filter-btn">
              Filter
            </button>
            <button type="button" className="clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </form>
        </StaffDirectoryFilters>
        <DirectoryViewToggle view={view} onChange={setView} label="Guardians layout" />
      </div>

      <Panel>
        {loading ? <p className="dashboard-empty">Loading guardians…</p> : null}
        {guardians.length === 0 && !loading ? (
          <p className="dashboard-empty">No guardians match these filters.</p>
        ) : view === "cards" ? (
          <div className="staff-dir-card-grid">
            {guardians.map((row) => {
              const fullName = `${row.firstName} ${row.lastName}`.trim();
              const familyId = row.household.id;
              const roleLabel = formatGuardianRelationshipRole(row.relationshipRole) ?? "—";
              const actions = [
                {
                  id: "edit",
                  label: "Edit",
                  tone: "edit" as const,
                  onSelect: () => openGuardian(row.id),
                },
                {
                  id: "open-family",
                  label: familyId ? "Open family" : "Unassigned",
                  disabled: !familyId,
                  onSelect: () => openFamily(familyId),
                },
              ];
              return (
                <StaffDirectoryCard
                  key={row.id}
                  title={fullName}
                  subtitle={row.email}
                  status={
                    <span className={`pill ${statusTone(row.linkStatus)}`}>
                      {formatStatusLabel(row.linkStatus)}
                    </span>
                  }
                  fields={[
                    { label: "Parent role", value: roleLabel },
                    { label: "Family", value: row.household.displayName },
                  ]}
                  actions={actions}
                  onOpen={() => openGuardian(row.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="table-panel staff-dir-table">
            <div className="table-head staff-dir-cols-guardians">
              <span>Name</span>
              <span>Parent role</span>
              <span>Email</span>
              <span>Family</span>
              <span className="staff-dir-col-status">Status</span>
              <span className="staff-dir-col-actions" aria-label="Actions" />
            </div>
            {guardians.map((row) => {
              const fullName = `${row.firstName} ${row.lastName}`.trim();
              const familyId = row.household.id;
              const roleLabel = formatGuardianRelationshipRole(row.relationshipRole) ?? "—";
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
                  <span>{roleLabel}</span>
                  <span>{row.email}</span>
                  <span>{row.household.displayName}</span>
                  <span className="staff-dir-col-status">
                    <span className={`pill ${statusTone(row.linkStatus)}`}>
                      {formatStatusLabel(row.linkStatus)}
                    </span>
                  </span>
                  <span className="staff-dir-col-actions">
                    <StaffRowActions
                      label="Row actions"
                      actions={[
                        {
                          id: "edit",
                          label: "Edit",
                          tone: "edit",
                          onSelect: () => openGuardian(row.id),
                        },
                        {
                          id: "open-family",
                          label: familyId ? "Open family" : "Unassigned",
                          disabled: !familyId,
                          onSelect: () => openFamily(familyId),
                        },
                      ]}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
