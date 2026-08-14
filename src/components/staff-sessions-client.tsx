"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageIntro, Panel } from "@/components/ui";
import {
  evaluateChangePolicy,
  isChangeReason,
  isRequestedOutcome,
} from "@/lib/family/change-policy";

type SessionRow = {
  id: string;
  status: string;
  studentName: string;
  tutorName: string | null;
  householdName: string;
  householdId: string;
  studentId: string;
  createdAt: string;
};

type ExceptionRow = {
  id: string;
  status: string;
  changeType: string;
  reason: string;
  requestedOutcome: string;
  preferredAlternatives: string | null;
  policyRecommendation: string;
  relatedEntityType: string;
  relatedEntityId: string;
  staffNotes: string | null;
  studentId: string;
  studentName: string;
  householdId: string;
  householdName: string;
  createdAt: string;
  resolvedAt: string | null;
};

type ExceptionStatusAction = "under_review" | "approved" | "declined" | "applied";

const BOOKING_STATUS_OPTIONS = [
  "",
  "draft",
  "held",
  "pending_payment",
  "pending_staff_review",
  "confirmed",
  "cancelled",
  "failed",
];

const EXCEPTION_STATUS_OPTIONS = [
  "",
  "submitted",
  "under_review",
  "approved",
  "declined",
  "applied",
];

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusTone(status: string) {
  if (status === "confirmed" || status === "approved" || status === "applied") return "mint";
  if (status === "cancelled" || status === "declined" || status === "failed") return "coral";
  return "amber";
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relatedEntityLabel(type: string) {
  if (type === "booking") return "Booking / session";
  if (type === "course_enrollment") return "Course enrollment";
  return type.replace(/_/g, " ");
}

function relatedEntityHref(type: string, id: string) {
  if (type === "booking") return `/staff/sessions/${id}`;
  return null;
}

function policyTraceHeadline(reason: string) {
  if (!isChangeReason(reason)) return null;
  return evaluateChangePolicy(reason);
}

export function StaffSessionsClient() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"Sessions" | "Exceptions">("Sessions");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ status: "", q: "" });

  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);
  const [exceptionsError, setExceptionsError] = useState<string | null>(null);
  const [exceptionStatus, setExceptionStatus] = useState("");
  const [appliedExceptionStatus, setAppliedExceptionStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExceptionRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [staffNotesDraft, setStaffNotesDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const reloadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const params = new URLSearchParams();
      if (applied.status) params.set("status", applied.status);
      if (applied.q) params.set("q", applied.q);
      const query = params.toString();
      const response = await fetch(`/api/staff/sessions${query ? `?${query}` : ""}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setSessionsError(data.error || "Unable to load sessions.");
        return;
      }
      setSessions(data.sessions ?? []);
    } catch {
      setSessionsError("Unable to load sessions.");
    } finally {
      setSessionsLoading(false);
    }
  }, [applied]);

  const reloadExceptions = useCallback(async () => {
    setExceptionsLoading(true);
    setExceptionsError(null);
    try {
      const params = new URLSearchParams();
      if (appliedExceptionStatus) params.set("status", appliedExceptionStatus);
      const query = params.toString();
      const response = await fetch(`/api/staff/exceptions${query ? `?${query}` : ""}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setExceptionsError(data.error || "Unable to load exceptions.");
        return;
      }
      setExceptions(data.exceptions ?? []);
    } catch {
      setExceptionsError("Unable to load exceptions.");
    } finally {
      setExceptionsLoading(false);
    }
  }, [appliedExceptionStatus]);

  useEffect(() => {
    if (mode === "Sessions") void reloadSessions();
  }, [mode, reloadSessions]);

  useEffect(() => {
    if (mode === "Exceptions") void reloadExceptions();
  }, [mode, reloadExceptions]);

  useEffect(() => {
    const exceptionId = searchParams.get("exceptionId");
    if (!exceptionId) return;
    setMode("Exceptions");
    setSelectedId(exceptionId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setStaffNotesDraft("");
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setExceptionsError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/staff/exceptions/${selectedId}`);
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok || !data.ok) {
          setExceptionsError(data.error || "Unable to load exception detail.");
          setDetail(null);
          return;
        }
        const exception = data.exception as ExceptionRow;
        setDetail(exception);
        setStaffNotesDraft(exception.staffNotes ?? "");
      } catch {
        if (!cancelled) {
          setExceptionsError("Unable to load exception detail.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function applySessionFilters(event: React.FormEvent) {
    event.preventDefault();
    setApplied({ status, q: q.trim() });
  }

  function clearSessionFilters() {
    setStatus("");
    setQ("");
    setApplied({ status: "", q: "" });
  }

  function applyExceptionFilter(event: React.FormEvent) {
    event.preventDefault();
    setAppliedExceptionStatus(exceptionStatus);
  }

  function clearExceptionFilter() {
    setExceptionStatus("");
    setAppliedExceptionStatus("");
  }

  async function patchException(
    id: string,
    body: { status?: ExceptionStatusAction; staffNotes?: string | null },
  ) {
    if (savingId) return;
    setSavingId(id);
    setExceptionsError(null);
    try {
      const response = await fetch(`/api/staff/exceptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setExceptionsError(data.error || "Unable to update exception.");
        return;
      }
      const exception = data.exception as ExceptionRow;
      setDetail(exception);
      setStaffNotesDraft(exception.staffNotes ?? "");
      setExceptions((rows) => rows.map((row) => (row.id === exception.id ? exception : row)));
    } catch {
      setExceptionsError("Unable to update exception.");
    } finally {
      setSavingId(null);
    }
  }

  const selected = detail;
  const policyHeadline = selected ? policyTraceHeadline(selected.reason) : null;
  const relatedHref = selected
    ? relatedEntityHref(selected.relatedEntityType, selected.relatedEntityId)
    : null;

  return (
    <>
      <PageIntro title="Sessions" />

      <section className="segmented">
        {(["Sessions", "Exceptions"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={mode === item ? "active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </section>

      {mode === "Sessions" ? (
        <Panel title="Session list" eyebrow="Bookings as sessions">
          {sessionsError ? <p className="form-error">{sessionsError}</p> : null}
          <form className="session-filter-bar" onSubmit={applySessionFilters} style={{ gridTemplateColumns: "1.4fr 1fr auto auto auto" }}>
            <label>
              Search
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Student, tutor, or household"
              />
            </label>
            <label>
              Session status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {BOOKING_STATUS_OPTIONS.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value ? statusLabel(value) : "All"}
                  </option>
                ))}
              </select>
            </label>
            <span>
              <strong>{sessions.length}</strong> sessions
            </span>
            <button type="submit" className="primary-button" style={{ height: 36 }}>
              Filter
            </button>
            <button type="button" className="secondary-button" style={{ height: 36 }} onClick={clearSessionFilters}>
              Reset
            </button>
          </form>

          {sessionsLoading ? <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading sessions…</p> : null}
          {!sessionsLoading && sessions.length === 0 ? (
            <div className="empty-action compact-empty">
              <div className="empty-symbol">◎</div>
              <p>No sessions match these filters. Bookings appear here until dedicated attendance records exist.</p>
            </div>
          ) : (
            <div className="table-panel">
              {sessions.map((row) => (
                <Link
                  key={row.id}
                  href={`/staff/sessions/${row.id}`}
                  className="family-row"
                  style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}
                >
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
                    {row.studentName.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{row.studentName}</strong>
                    <small>
                      {row.tutorName ?? "Tutor pending"} · {row.householdName} · {formatWhen(row.createdAt)}
                    </small>
                  </span>
                  <span className={`pill ${statusTone(row.status)}`}>{statusLabel(row.status)}</span>
                  <b>Open →</b>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="Exceptions queue" eyebrow="Change requests">
          {exceptionsError ? <p className="form-error">{exceptionsError}</p> : null}
          <form className="session-filter-bar" onSubmit={applyExceptionFilter} style={{ gridTemplateColumns: "1fr auto auto auto" }}>
            <label>
              Status
              <select value={exceptionStatus} onChange={(e) => setExceptionStatus(e.target.value)}>
                {EXCEPTION_STATUS_OPTIONS.map((value) => (
                  <option key={value || "all"} value={value}>
                    {value ? statusLabel(value) : "All"}
                  </option>
                ))}
              </select>
            </label>
            <span>
              <strong>{exceptions.length}</strong> exceptions
            </span>
            <button type="submit" className="primary-button" style={{ height: 36 }}>
              Filter
            </button>
            <button type="button" className="secondary-button" style={{ height: 36 }} onClick={clearExceptionFilter}>
              Clear
            </button>
          </form>

          {exceptionsLoading ? <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading exceptions…</p> : null}
          {!exceptionsLoading && exceptions.length === 0 ? (
            <div className="empty-action compact-empty">
              <div className="empty-symbol">!</div>
              <p>No exception items in this view.</p>
            </div>
          ) : (
            <div className="exception-queue">
              {exceptions.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id === selectedId ? null : row.id)}
                  style={selectedId === row.id ? { background: "var(--blue-soft)" } : undefined}
                >
                  <span>
                    <strong>{row.changeType}</strong>
                    <small>{formatWhen(row.createdAt)}</small>
                  </span>
                  <span>
                    <strong>
                      {row.studentName} · {row.householdName}
                    </strong>
                    <small>{row.reason}</small>
                  </span>
                  <span className={`pill ${statusTone(row.status)}`}>{statusLabel(row.status)}</span>
                  <b>{selectedId === row.id ? "Selected" : "Open"}</b>
                </button>
              ))}
            </div>
          )}

          {selectedId ? (
            <div className="exception-actions" style={{ marginTop: 18 }}>
              {detailLoading && !selected ? (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading policy trace…</p>
              ) : null}

              {selected ? (
                <>
                  <section className="student-detail-hero" style={{ marginBottom: 14 }}>
                    <span className="student-detail-avatar">
                      {selected.studentName
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <span className="eyebrow">Exception detail</span>
                      <h2 style={{ margin: "4px 0" }}>{selected.changeType}</h2>
                      <p style={{ margin: 0 }}>
                        <Link href={`/staff/students/${selected.studentId}`}>{selected.studentName}</Link>
                        {" · "}
                        <Link href={`/staff/families/${selected.householdId}`}>{selected.householdName}</Link>
                      </p>
                    </div>
                    <span className={`pill ${statusTone(selected.status)}`}>{statusLabel(selected.status)}</span>
                  </section>

                  <div className="record-detail-grid" style={{ marginBottom: 14 }}>
                    <div>
                      <small>Reason</small>
                      <strong style={{ fontSize: 14 }}>{selected.reason}</strong>
                    </div>
                    <div>
                      <small>Requested outcome</small>
                      <strong style={{ fontSize: 14 }}>{selected.requestedOutcome}</strong>
                    </div>
                    <div>
                      <small>Preferred alternatives</small>
                      <strong style={{ fontSize: 14 }}>{selected.preferredAlternatives || "—"}</strong>
                    </div>
                    <div>
                      <small>Related entity</small>
                      <strong style={{ fontSize: 14 }}>
                        {relatedEntityLabel(selected.relatedEntityType)}
                        {relatedHref ? (
                          <>
                            {" · "}
                            <Link href={relatedHref}>Open record →</Link>
                          </>
                        ) : null}
                      </strong>
                    </div>
                    <div>
                      <small>Created</small>
                      <strong style={{ fontSize: 14 }}>{formatWhen(selected.createdAt)}</strong>
                    </div>
                    <div>
                      <small>Resolved</small>
                      <strong style={{ fontSize: 14 }}>{formatWhen(selected.resolvedAt)}</strong>
                    </div>
                  </div>

                  <section className="policy-recommendation">
                    <span>i</span>
                    <div>
                      <strong>
                        Stored policy recommendation
                        {policyHeadline ? ` · ${policyHeadline}` : ""}
                      </strong>
                      <p>{selected.policyRecommendation}</p>
                      {policyHeadline && isRequestedOutcome(selected.requestedOutcome) ? (
                        <p style={{ marginTop: 8 }}>
                          Computed from saved reason ({selected.reason}) via PT-CAN-2026.3 family change
                          policy — no new rules applied here. Outcome context: {selected.requestedOutcome}.
                        </p>
                      ) : null}
                    </div>
                  </section>

                  <label className="full-input" style={{ marginTop: 14, display: "block" }}>
                    Staff notes
                    <textarea
                      value={staffNotesDraft}
                      disabled={savingId === selected.id}
                      onChange={(event) => setStaffNotesDraft(event.target.value)}
                      rows={4}
                      placeholder="Internal review notes for this exception"
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ marginTop: 8 }}
                    disabled={
                      savingId === selected.id || staffNotesDraft === (selected.staffNotes ?? "")
                    }
                    onClick={() => void patchException(selected.id, { staffNotes: staffNotesDraft })}
                  >
                    {savingId === selected.id ? "Saving…" : "Save staff notes"}
                  </button>

                  <h3 style={{ margin: "18px 0 10px", fontSize: 14 }}>Authorized staff outcome</h3>
                  <div>
                    <button
                      type="button"
                      disabled={savingId === selected.id || selected.status === "under_review"}
                      onClick={() => void patchException(selected.id, { status: "under_review" })}
                    >
                      <span>Under review</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      disabled={savingId === selected.id || selected.status === "approved"}
                      onClick={() => void patchException(selected.id, { status: "approved" })}
                    >
                      <span>Approve</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      disabled={savingId === selected.id || selected.status === "declined"}
                      onClick={() => void patchException(selected.id, { status: "declined" })}
                    >
                      <span>Decline</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      disabled={savingId === selected.id || selected.status === "applied"}
                      onClick={() => void patchException(selected.id, { status: "applied" })}
                    >
                      <span>Applied</span>
                      <span>→</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </Panel>
      )}
    </>
  );
}
