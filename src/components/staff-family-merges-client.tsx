"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";

type FamilyOption = { id: string; displayName: string; status: string };

type MergeRequestRow = {
  id: string;
  sourceHouseholdId: string;
  targetHouseholdId: string;
  sourceDisplayName: string;
  targetDisplayName: string;
  matchOn: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export function StaffFamilyMergesClient() {
  const searchParams = useSearchParams();
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [requests, setRequests] = useState<MergeRequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("queued");
  const [sourceHouseholdId, setSourceHouseholdId] = useState("");
  const [targetHouseholdId, setTargetHouseholdId] = useState(searchParams.get("target") ?? "");
  const [matchOn, setMatchOn] = useState(searchParams.get("matchOn") ?? "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const familyOptions = useMemo(
    () => [...families].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [families],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [familiesRes, queueRes] = await Promise.all([
        fetch("/api/staff/families"),
        fetch(`/api/staff/families/merge-queue?status=${encodeURIComponent(statusFilter)}`),
      ]);
      const familiesData = await familiesRes.json();
      const queueData = await queueRes.json();
      if (!familiesRes.ok || !familiesData.ok) {
        setError(familiesData.error || "Unable to load households.");
        return;
      }
      if (!queueRes.ok || !queueData.ok) {
        setError(queueData.error || "Unable to load merge queue.");
        return;
      }
      setFamilies(familiesData.families ?? []);
      setRequests(queueData.requests ?? []);
    } catch {
      setError("Unable to load merge queue.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function addToQueue() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/families/merge-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceHouseholdId,
          targetHouseholdId,
          matchOn: matchOn.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to add merge request.");
        return;
      }
      setMessage("Queued merge request.");
      setSourceHouseholdId("");
      setNotes("");
      if (statusFilter !== "queued") setStatusFilter("queued");
      else await reload();
    } catch {
      setError("Unable to add merge request.");
    } finally {
      setSaving(false);
    }
  }

  async function runMerge(id: string) {
    if (actingId) return;
    if (!window.confirm("Merge now? Guardians and students move to the target; source is archived.")) return;
    setActingId(id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/families/merge-queue/${id}/merge`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to merge.");
        return;
      }
      const warn = Array.isArray(data.warnings) && data.warnings.length ? ` ${data.warnings.join(" ")}` : "";
      setMessage(`Merged.${warn}`);
      await reload();
    } catch {
      setError("Unable to merge.");
    } finally {
      setActingId(null);
    }
  }

  async function runDismiss(id: string) {
    if (actingId) return;
    setActingId(id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/families/merge-queue/${id}/dismiss`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to dismiss.");
        return;
      }
      setMessage("Dismissed.");
      await reload();
    } catch {
      setError("Unable to dismiss.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <PageIntro
        title="Identity merge queue"
        description="Queue duplicate households, then merge into the target (source archived)."
        action={
          <Link href="/staff/families" className="secondary-button" style={{ textDecoration: "none" }}>
            ← Families
          </Link>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p style={{ color: "var(--blue)", fontSize: 12, marginBottom: 10 }}>{message}</p> : null}

      <Panel title="Add to queue" eyebrow="Flag duplicate">
        <div className="input-grid">
          <label>
            Source household (will be archived)
            <select value={sourceHouseholdId} onChange={(e) => setSourceHouseholdId(e.target.value)}>
              <option value="">Select source…</option>
              {familyOptions.map((row) => (
                <option key={row.id} value={row.id} disabled={row.id === targetHouseholdId}>
                  {row.displayName} ({row.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Target household (kept)
            <select value={targetHouseholdId} onChange={(e) => setTargetHouseholdId(e.target.value)}>
              <option value="">Select target…</option>
              {familyOptions.map((row) => (
                <option key={row.id} value={row.id} disabled={row.id === sourceHouseholdId}>
                  {row.displayName} ({row.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Match on
            <input value={matchOn} onChange={(e) => setMatchOn(e.target.value)} placeholder="email / phone" />
          </label>
          <label>
            Notes
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional staff note" />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="primary-button"
            disabled={saving || !sourceHouseholdId || !targetHouseholdId}
            onClick={() => void addToQueue()}
          >
            {saving ? "Queuing…" : "Add to queue"}
          </button>
        </div>
      </Panel>

      <Panel title="Queue" eyebrow="Live database">
        <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Status{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="queued">queued</option>
              <option value="merged">merged</option>
              <option value="dismissed">dismissed</option>
              <option value="all">all</option>
            </select>
          </label>
          {loading ? <span style={{ color: "var(--muted)", fontSize: 12 }}>Loading…</span> : null}
        </div>

        {requests.length === 0 && !loading ? (
          <p style={{ color: "var(--muted)" }}>No merge requests in this filter.</p>
        ) : (
          <div className="table-panel">
            {requests.map((row) => (
              <div key={row.id} className="family-row" style={{ cursor: "default", alignItems: "flex-start" }}>
                <span>
                  <strong>
                    {row.sourceDisplayName} → {row.targetDisplayName}
                  </strong>
                  <small>
                    {row.status}
                    {row.matchOn ? ` · match: ${row.matchOn}` : ""}
                    {row.notes ? ` · ${row.notes}` : ""} · {new Date(row.createdAt).toLocaleString()}
                  </small>
                </span>
                <span className="pill">{row.status}</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                  <Link
                    href={`/staff/families/${row.sourceHouseholdId}`}
                    className="secondary-button"
                    style={{ textDecoration: "none", fontSize: 11 }}
                  >
                    Open source
                  </Link>
                  <Link
                    href={`/staff/families/${row.targetHouseholdId}`}
                    className="secondary-button"
                    style={{ textDecoration: "none", fontSize: 11 }}
                  >
                    Open target
                  </Link>
                  {row.status === "queued" ? (
                    <>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ fontSize: 11 }}
                        disabled={actingId === row.id}
                        onClick={() => void runMerge(row.id)}
                      >
                        Merge
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: 11 }}
                        disabled={actingId === row.id}
                        onClick={() => void runDismiss(row.id)}
                      >
                        Dismiss
                      </button>
                    </>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
