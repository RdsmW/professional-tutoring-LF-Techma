"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import { SUPPORT_PRIORITIES, SUPPORT_TOPICS } from "@/lib/support";

type SupportMessage = {
  id: string;
  body: string;
  authorRole: "family" | "staff" | "system";
  createdAt: string;
};

type SupportCase = {
  id: string;
  displayCode: string;
  topic: string;
  priority: string;
  priorityLabel: string;
  relatedLabel: string | null;
  studentId: string | null;
  studentName?: string | null;
  status: string;
  statusLabel: string;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

type StudentOption = { id: string; displayName: string };

type Mode = "list" | "form" | "confirmation" | "detail";

function statusTone(status: string) {
  return status === "resolved" ? "mint" : "amber";
}

function messageLabel(message: SupportMessage) {
  if (message.authorRole === "staff") return `Staff reply: ${message.body}`;
  if (message.authorRole === "family") return `Your reply: ${message.body}`;
  return message.body;
}

export function FamilyMessagesClient() {
  const [mode, setMode] = useState<Mode>("list");
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [hasOpenCase, setHasOpenCase] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [priority, setPriority] = useState<(typeof SUPPORT_PRIORITIES)[number]>("normal");
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [createdCase, setCreatedCase] = useState<SupportCase | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family/support");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load support cases.");
        return;
      }
      setCases(data.cases ?? []);
      setStudents(data.students ?? []);
      setHasOpenCase(Boolean(data.hasOpenCase));
    } catch {
      setError("Unable to load support cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = cases.find((row) => row.id === selectedId) ?? createdCase;

  async function submitCase() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          priority,
          message,
          studentId: studentId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to create support case.");
        return;
      }
      setCreatedCase(data.case);
      setSelectedId(data.case.id);
      setMode("confirmation");
      await reload();
    } catch {
      setError("Unable to create support case.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReply() {
    if (!selected || saving || !reply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/family/support/${selected.id}/reply`, {
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
      setCreatedCase(data.case);
      await reload();
    } catch {
      setError("Unable to post reply.");
    } finally {
      setSaving(false);
    }
  }

  if (mode === "form") {
    return (
      <section className="wizard-shell panel">
        <button type="button" className="page-back" onClick={() => setMode("list")}>
          ← Messages & support
        </button>
        <span className="eyebrow">Family support request</span>
        <h2>Contact Professional Tutoring</h2>
        <div className="input-grid">
          <label>
            Topic
            <select value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">Select topic</option>
              {SUPPORT_TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Related student (optional)
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="">No linked record</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as (typeof SUPPORT_PRIORITIES)[number])}
            >
              <option value="normal">Normal</option>
              <option value="time_sensitive">Time-sensitive (session within 48h)</option>
            </select>
          </label>
        </div>
        <label className="full-input">
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe what staff should review"
          />
        </label>
        {error ? <div className="validation-hint">{error}</div> : null}
        <div className="wizard-footer">
          <button type="button" className="wizard-back" onClick={() => setMode("list")}>
            Cancel
          </button>
          <button
            type="button"
            className="family-primary"
            disabled={saving || !topic || !message.trim()}
            onClick={() => void submitCase()}
          >
            {saving ? "Submitting…" : "Submit support request"}
          </button>
        </div>
      </section>
    );
  }

  if (mode === "confirmation" && selected) {
    return (
      <section className="success-state">
        <span>✓</span>
        <h2>Support request submitted</h2>
        <p>
          {selected.displayCode} · {selected.statusLabel}. One in-app case was created and is visible in the
          Staff Support Inbox.
        </p>
        <button
          type="button"
          className="family-primary"
          onClick={() => {
            setMode("detail");
          }}
        >
          View request
        </button>
      </section>
    );
  }

  if (mode === "detail" && selected) {
    const canReply = selected.status === "waiting_on_family";
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
            setMode("list");
            setSelectedId(null);
          }}
        >
          ← Messages & support
        </button>
        <section className="panel support-case-detail">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                {selected.displayCode} · {selected.priorityLabel}
              </span>
              <h3>{selected.topic}</h3>
              <p>{selected.relatedLabel || selected.studentName || "No linked record"}</p>
            </div>
            <span className={`pill ${statusTone(selected.status)}`}>{selected.statusLabel}</span>
          </div>
          {initialFamilyMessage ? <blockquote>{initialFamilyMessage.body}</blockquote> : null}
          <div className="history-panel">
            {activityMessages.map((item) => (
              <div key={item.id}>
                <span />
                {messageLabel(item)}
              </div>
            ))}
          </div>
          {canReply ? (
            <div style={{ marginTop: 16 }}>
              <label className="full-input">
                Your reply
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to staff in-app"
                />
              </label>
              {error ? <div className="validation-hint">{error}</div> : null}
              <button
                type="button"
                className="family-primary"
                style={{ marginTop: 10 }}
                disabled={saving || !reply.trim()}
                onClick={() => void submitReply()}
              >
                {saving ? "Sending…" : "Post reply"}
              </button>
            </div>
          ) : null}
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        title="How can we help?"
        action={
          <button
            type="button"
            className="family-primary"
            style={{ border: 0, padding: "10px 14px", cursor: "pointer" }}
            onClick={() => {
              if (hasOpenCase) {
                setError("An open request already exists. Open it below instead of creating a duplicate.");
                return;
              }
              setTopic("");
              setPriority("normal");
              setStudentId("");
              setMessage("");
              setError(null);
              setMode("form");
            }}
          >
            New support request
          </button>
        }
      />

      <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--muted)" }}>
        Scheduling changes stay on{" "}
        <Link href="/family/calendar" style={{ color: "var(--blue)", fontWeight: 700 }}>
          Calendar
        </Link>
        .
      </p>

      {error ? <p className="form-error" style={{ marginBottom: 12 }}>{error}</p> : null}
      {loading ? <p style={{ fontSize: 14, color: "var(--muted)" }}>Loading cases…</p> : null}

      {!loading && cases.length === 0 ? (
        <Panel title="Your cases">
          <div className="empty-action">
            <div className="empty-symbol">✉</div>
            <p>No support requests yet.</p>
            <button
              type="button"
              className="family-primary"
              style={{ marginTop: 12, border: 0, padding: "10px 14px", cursor: "pointer" }}
              onClick={() => {
                setError(null);
                setMode("form");
              }}
            >
              Start a request
            </button>
          </div>
        </Panel>
      ) : null}

      {cases.map((row) => (
        <section className="panel support-case-detail" key={row.id} style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              setSelectedId(row.id);
              setCreatedCase(row);
              setMode("detail");
              setError(null);
            }}
            style={{
              width: "100%",
              border: 0,
              background: "transparent",
              textAlign: "left",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  {row.displayCode} · {row.priorityLabel}
                </span>
                <h3>{row.topic}</h3>
                <p>{row.relatedLabel || row.studentName || "No linked record"}</p>
              </div>
              <span className={`pill ${statusTone(row.status)}`}>{row.statusLabel}</span>
            </div>
          </button>
        </section>
      ))}
    </>
  );
}
