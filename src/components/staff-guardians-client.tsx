"use client";

import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type GuardianRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  linkStatus: "linked" | "invite_pending" | "unlinked";
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  household: {
    id: string;
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

  function openFamily(householdId: string) {
    router.push(`/staff/families/${householdId}`);
  }

  function openEdit(event: MouseEvent, householdId: string, guardianId: string) {
    event.stopPropagation();
    router.push(`/staff/families/${householdId}?guardianId=${guardianId}`);
  }

  return (
    <>
      <PageIntro title="Guardians" />
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
          <button type="submit" className="primary-button" style={{ height: 36, alignSelf: "end" }}>
            Filter
          </button>
          <button type="button" className="secondary-button" style={{ height: 36, alignSelf: "end" }} onClick={clearFilters}>
            Clear
          </button>
        </form>

        {loading ? <p className="dashboard-empty">Loading guardians…</p> : null}
        {guardians.length === 0 && !loading ? (
          <p className="dashboard-empty">No guardians match these filters.</p>
        ) : (
          <div className="table-panel students-table compact-table">
            <div
              className="table-head"
              style={{ gridTemplateColumns: "1.3fr 1.4fr 1.2fr 0.9fr 0.8fr 0.6fr" }}
            >
              <span>Name</span>
              <span>Email</span>
              <span>Family</span>
              <span>Status</span>
              <span>Role</span>
              <span />
            </div>
            {guardians.map((row) => (
              <div
                key={row.id}
                className="table-row"
                role="link"
                tabIndex={0}
                onClick={() => openFamily(row.household.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFamily(row.household.id);
                  }
                }}
                style={{
                  gridTemplateColumns: "1.3fr 1.4fr 1.2fr 0.9fr 0.8fr 0.6fr",
                  cursor: "pointer",
                }}
              >
                <strong>
                  {row.firstName} {row.lastName}
                </strong>
                <span>{row.email}</span>
                <span>{row.household.displayName}</span>
                <span className={`pill ${statusTone(row.linkStatus)}`}>
                  {formatStatusLabel(row.linkStatus)}
                </span>
                <span>{row.isBillingOwner ? "Billing" : "—"}</span>
                <span>
                  <button
                    type="button"
                    className="text-button table-open"
                    onClick={(event) => openEdit(event, row.household.id, row.id)}
                  >
                    Edit →
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
