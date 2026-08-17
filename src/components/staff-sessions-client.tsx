"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StaffChangeRequestReview } from "@/components/staff-change-request-review";
import { PageIntro, Panel } from "@/components/ui";
import type { ChangeRequestStatusAction, StaffChangeRequestDto } from "@/lib/staff/change-request-types";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

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

type ExceptionRow = StaffChangeRequestDto;

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
    body: { status?: ChangeRequestStatusAction; staffNotes?: string | null },
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
        <Panel>
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
                    {value ? formatStatusLabel(value) : "All"}
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
                  <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
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
                    {value ? formatStatusLabel(value) : "All"}
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
                  <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.status)}</span>
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
                <StaffChangeRequestReview
                  request={selected}
                  staffNotesDraft={staffNotesDraft}
                  onStaffNotesChange={setStaffNotesDraft}
                  saving={savingId === selected.id}
                  onSaveNotes={() => void patchException(selected.id, { staffNotes: staffNotesDraft })}
                  onStatus={(status) => void patchException(selected.id, { status })}
                />
              ) : null}
            </div>
          ) : null}
        </Panel>
      )}
    </>
  );
}
