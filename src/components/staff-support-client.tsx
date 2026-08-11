"use client";

import { useCallback, useEffect, useState } from "react";
import { PageIntro } from "@/components/ui";
import { SUPPORT_STATUSES } from "@/lib/support";

type SupportMessage = {
  id: string;
  body: string;
  authorRole: "family" | "staff" | "system";
  createdAt: string;
};

type StaffOption = { id: string; fullName: string };

type SupportCaseSummary = {
  id: string;
  displayCode: string;
  topic: string;
  priorityLabel: string;
  relatedLabel: string | null;
  status: string;
  statusLabel: string;
  open: boolean;
  householdName: string;
  assigneeStaffId: string | null;
  assigneeName: string;
  createdAt: string;
  updatedAt: string;
};

type SupportCaseDetail = SupportCaseSummary & {
  priority: string;
  messages: SupportMessage[];
  staffOptions: StaffOption[];
};

function statusTone(status: string) {
  return status === "resolved" ? "mint" : "amber";
}

export function StaffSupportClient() {
  const [cases, setCases] = useState<SupportCaseSummary[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [selected, setSelected] = useState<SupportCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/support");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load support inbox.");
        return;
      }
      setCases(data.cases ?? []);
      setStaffOptions(data.staffOptions ?? []);
    } catch {
      setError("Unable to load support inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function openCase(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/staff/support/${id}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to open case.");
        return;
      }
      setSelected(data.case);
      setReply("");
    } catch {
      setError("Unable to open case.");
    }
  }

  async function patchCase(patch: { status?: string; assigneeStaffId?: string | null }) {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/support/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update case.");
        return;
      }
      setSelected(data.case);
      await reload();
    } catch {
      setError("Unable to update case.");
    } finally {
      setSaving(false);
    }
  }

  async function postReply() {
    if (!selected || saving || !reply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/support/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to post reply.");
        return;
      }
      setReply("");
      await openCase(selected.id);
      await reload();
    } catch {
      setError("Unable to post reply.");
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    const options = selected.staffOptions?.length ? selected.staffOptions : staffOptions;
    const initialFamilyMessage =
      selected.messages.find((item) => item.authorRole === "family") ?? null;
    const activityMessages = selected.messages.filter(
      (item) => item.id !== initialFamilyMessage?.id,
    );
    return (
      <>
        <button
          type="button"
          className="page-back"
          onClick={() => {
            setSelected(null);
            void reload();
          }}
        >
          ← Support inbox
        </button>
        <PageIntro
          eyebrow="Role-restricted staff workspace"
          title="Support Inbox"
          description="One underlying in-app case record; no email, SMS, or Outlook message is sent."
          action={<span className={`pill ${statusTone(selected.status)}`}>{selected.statusLabel}</span>}
        />
        <section className="panel support-case-detail">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                {selected.displayCode} · {selected.priorityLabel}
              </span>
              <h3>{selected.topic}</h3>
              <p>
                {selected.relatedLabel || "No linked record"} · {selected.householdName}
              </p>
            </div>
            <select
              aria-label="Assign support case"
              value={selected.assigneeStaffId ?? ""}
              disabled={saving}
              onChange={(event) =>
                void patchCase({ assigneeStaffId: event.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {options.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName}
                </option>
              ))}
            </select>
          </div>
          {initialFamilyMessage ? <blockquote>{initialFamilyMessage.body}</blockquote> : null}
          <div className="input-grid">
            <label>
              Status
              <select
                value={selected.status}
                disabled={saving}
                onChange={(event) => void patchCase({ status: event.target.value })}
              >
                {SUPPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === "submitted"
                      ? "Submitted"
                      : status === "under_review"
                        ? "Under review"
                        : status === "waiting_on_family"
                          ? "Waiting on family"
                          : "Resolved"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Staff reply
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Family-safe in-app reply"
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <button
            type="button"
            className="primary-button"
            disabled={saving || !reply.trim()}
            onClick={() => void postReply()}
          >
            {saving ? "Posting…" : "Post in-app reply"}
          </button>
        </section>
        <section className="panel history-panel">
          <span className="eyebrow">Audit history</span>
          <h3>Case activity</h3>
          {activityMessages.map((item) => (
            <div key={item.id}>
              <span />
              {item.authorRole === "staff"
                ? `Reply: ${item.body}`
                : item.authorRole === "family"
                  ? `Family reply: ${item.body}`
                  : item.body}
            </div>
          ))}
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Support"
        title="Support inbox"
        description="Family Messages / Support cases route here for assign, reply, and resolve."
      />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p style={{ fontSize: 11, color: "var(--muted)" }}>Loading inbox…</p> : null}
      {!loading && cases.length === 0 ? (
        <section className="panel">
          <div className="empty-action">
            <div className="empty-symbol">✉</div>
            <p>Support Inbox is clear. No family requests are waiting.</p>
            <p style={{ fontSize: 9, color: "var(--muted)" }}>
              Email, SMS, and Outlook routing are future integrations and are not live.
            </p>
          </div>
        </section>
      ) : null}
      <div className="stack-list">
        {cases.map((row) => (
          <button
            key={row.id}
            type="button"
            className="panel"
            style={{
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              display: "block",
              marginBottom: 10,
            }}
            onClick={() => void openCase(row.id)}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  {row.displayCode} · {row.priorityLabel}
                </span>
                <h3 style={{ margin: "4px 0" }}>{row.topic}</h3>
                <p style={{ margin: 0, fontSize: 10, color: "var(--muted)" }}>
                  {row.householdName}
                  {row.relatedLabel ? ` · ${row.relatedLabel}` : ""} · {row.assigneeName}
                </p>
              </div>
              <span className={`pill ${statusTone(row.status)}`}>{row.statusLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
