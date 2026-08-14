"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import { StaffNewFamilyWizard } from "@/components/staff-new-family-wizard";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";

type ListFilter = "active" | "archived" | "all";

export function StaffFamiliesClient({
  initialFamilies = [],
}: {
  initialFamilies?: StaffFamilyListRow[];
}) {
  const [families, setFamilies] = useState<StaffFamilyListRow[]>(initialFamilies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<ListFilter>("active");

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

  const visible = useMemo(() => {
    if (filter === "all") return families;
    if (filter === "archived") return families.filter((row) => row.status === "archived");
    return families.filter((row) => row.status !== "archived");
  }, [families, filter]);

  if (creating) {
    return <StaffNewFamilyWizard onCancel={() => setCreating(false)} />;
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
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {(
          [
            ["active", "Active"],
            ["archived", "Archived"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "primary-button" : "secondary-button"}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="text-button" onClick={() => void reload()} disabled={loading}>
          Refresh
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading families…</p> : null}
      <Panel title="Household directory" eyebrow="Live database">
        {visible.length === 0 && !loading ? (
          <p style={{ color: "var(--muted)" }}>
            {filter === "archived" ? "No archived households." : "No households yet."}
          </p>
        ) : (
          <div className="table-panel">
            {visible.map((row) => (
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
