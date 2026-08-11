"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import { StaffNewFamilyWizard } from "@/components/staff-new-family-wizard";

type FamilyRow = {
  id: string;
  displayName: string;
  status: string;
  studentCount: number;
  guardianCount: number;
};

export function StaffFamiliesClient() {
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  if (creating) {
    return <StaffNewFamilyWizard onCancel={() => setCreating(false)} />;
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
