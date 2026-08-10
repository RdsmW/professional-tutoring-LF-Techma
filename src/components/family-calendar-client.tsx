"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { useFamilyPortal } from "@/components/family-portal-context";
import {
  CHANGE_REASONS,
  CHANGE_TYPES,
  REQUESTED_OUTCOMES,
  evaluateChangePolicy,
  policyRecommendationDetail,
  requiresAlternatives,
  type ChangeReason,
  type ChangeType,
  type RequestedOutcome,
} from "@/lib/family/change-policy";

type CalendarItem = {
  id: string;
  kind: "booking" | "enrollment";
  status: string;
  studentId: string;
  studentName: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  tutorName: string | null;
  courseName: string | null;
};

type ChangeRequest = {
  id: string;
  relatedEntityType: string;
  relatedEntityId: string;
  changeType: string;
  reason: string;
  requestedOutcome: string;
  preferredAlternatives: string | null;
  policyRecommendation: string;
  status: string;
  createdAt: string;
  open: boolean;
};

type Mode = "list" | "detail" | "change";

function statusTone(status: string) {
  if (status === "confirmed" || status === "applied" || status === "approved") return "mint";
  if (status === "cancelled" || status === "declined" || status === "failed") return "amber";
  return "amber";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function dateBlock(item: CalendarItem) {
  if (item.kind === "enrollment") return "CR";
  const token = item.timeLabel.split(/[·\s]/)[0] || "BK";
  return token.slice(0, 3).toUpperCase();
}

export function FamilyCalendarClient() {
  const router = useRouter();
  const { householdName } = useFamilyPortal();
  const [mode, setMode] = useState<Mode>("list");
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changeStep, setChangeStep] = useState(1);
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const [changeType, setChangeType] = useState<ChangeType | "">("");
  const [requestedOutcome, setRequestedOutcome] = useState<RequestedOutcome | "">("");
  const [preferredAlternatives, setPreferredAlternatives] = useState("");
  const [saving, setSaving] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<ChangeRequest | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const selectedChanges = useMemo(
    () =>
      changeRequests.filter(
        (row) =>
          selected &&
          row.relatedEntityId === selected.id &&
          row.relatedEntityType === (selected.kind === "booking" ? "booking" : "course_enrollment"),
      ),
    [changeRequests, selected],
  );

  const openChange = selectedChanges.find((row) => row.open) ?? null;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family/calendar");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load calendar.");
        return;
      }
      setItems(data.items ?? []);
      setChangeRequests(data.changeRequests ?? []);
    } catch {
      setError("Unable to load calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openDetail(itemId: string) {
    setSelectedId(itemId);
    setMode("detail");
    setSubmittedRequest(null);
  }

  function startChange(itemId?: string) {
    const targetId = itemId ?? selectedId;
    if (!targetId) {
      setError("Open a booking or enrollment first, then request a change.");
      return;
    }
    setSelectedId(targetId);
    setChangeStep(1);
    setChangeReason("");
    setChangeType("");
    setRequestedOutcome("");
    setPreferredAlternatives("");
    setSubmittedRequest(null);
    setError(null);
    setMode("change");
  }

  const requestValid =
    Boolean(changeReason) &&
    Boolean(changeType) &&
    Boolean(requestedOutcome) &&
    !(changeType && requiresAlternatives(changeType) && !preferredAlternatives.trim());

  async function submitChangeRequest() {
    if (!selected || !changeReason || !changeType || !requestedOutcome || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/family/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relatedEntityType: selected.kind === "booking" ? "booking" : "course_enrollment",
          relatedEntityId: selected.id,
          changeType,
          reason: changeReason,
          requestedOutcome,
          preferredAlternatives,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to submit change request.");
        return;
      }
      setSubmittedRequest(data.changeRequest);
      setChangeRequests((current) => [data.changeRequest, ...current]);
      setChangeStep(3);
    } catch {
      setError("Unable to submit change request.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="panel">Loading calendar…</div>;
  }

  if (mode === "change" && selected) {
    const recommendation =
      changeReason && requestedOutcome
        ? policyRecommendationDetail(changeReason, requestedOutcome)
        : changeReason
          ? evaluateChangePolicy(changeReason)
          : "";

    return (
      <section className="wizard-shell panel">
        <button
          type="button"
          className="wizard-close"
          onClick={() => {
            setMode("detail");
            setChangeStep(1);
          }}
        >
          ×
        </button>
        <span className="eyebrow">Family request · Policy PT-CAN-2026.3</span>
        <h2>Request a booking change</h2>
        <p className="wizard-lead">
          The policy engine explains likely eligibility. It does not create a banked credit or issue a refund
          without authorized staff approval.
        </p>
        <div className="wizard-progress">
          {["Request", "Policy evaluation", "Staff review"].map((label, index) => (
            <div
              key={label}
              className={index + 1 < changeStep ? "complete" : index + 1 === changeStep ? "complete" : undefined}
            >
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        {changeStep === 1 ? (
          <div className="wizard-stage">
            <h3>Tell us what changed</h3>
            <div className="review-summary">
              <div>
                <small>Student</small>
                <strong>{selected.studentName}</strong>
              </div>
              <div>
                <small>Session</small>
                <strong>
                  {selected.timeLabel} · {selected.title}
                </strong>
              </div>
              <div>
                <small>Notice</small>
                <strong>Assumed ≥24 hours (provisional)</strong>
              </div>
            </div>
            <div className="select-block">
              <strong>Reason</strong>
              <div className="field-choice-row">
                {CHANGE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={changeReason === reason ? "selected" : ""}
                    onClick={() => setChangeReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className="select-block">
              <strong>Change type</strong>
              <div className="field-choice-row">
                {CHANGE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={changeType === type ? "selected" : ""}
                    onClick={() => setChangeType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <label className="full-input">
              Preferred alternative dates / times (when applicable)
              <textarea
                value={preferredAlternatives}
                onChange={(event) => setPreferredAlternatives(event.target.value)}
                placeholder="Example: Thursday after 5 PM or weekend morning"
              />
            </label>
            <div className="select-block">
              <strong>Requested policy outcome</strong>
              <div className="field-choice-row">
                {REQUESTED_OUTCOMES.map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    className={requestedOutcome === outcome ? "selected" : ""}
                    onClick={() => setRequestedOutcome(outcome)}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {changeStep === 2 ? (
          <div className="wizard-stage">
            <h3>Policy recommendation</h3>
            <section className="policy-recommendation">
              <span>i</span>
              <div>
                <strong>{changeReason ? evaluateChangePolicy(changeReason) : "Review required"}</strong>
                <p>{recommendation}</p>
              </div>
            </section>
            <div className="privacy-callout">
              <span>i</span>
              <div>
                <strong>Recommendation is not approval</strong>
                <p>
                  Authorized staff must approve a banked credit, refund workflow, alternate exception, or denial.
                  Stripe refunds and live calendar mutations are later controlled steps.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {changeStep === 3 && submittedRequest ? (
          <div className="success-state">
            <span>✓</span>
            <h3>Request submitted</h3>
            <p>
              Status: {statusLabel(submittedRequest.status)}. Staff may move it through Under review,
              Approved/Declined, and Applied. No booking, credit, refund, or live calendar changed.
            </p>
            <div className="success-actions">
              <button
                type="button"
                className="family-primary"
                onClick={() => {
                  setMode("list");
                  setSelectedId(null);
                  setChangeStep(1);
                }}
              >
                Return to calendar
              </button>
              <button type="button" className="secondary-button" onClick={() => router.push("/family/messages")}>
                Open support
              </button>
            </div>
          </div>
        ) : null}

        {error ? <div className="validation-hint">{error}</div> : null}

        {changeStep < 3 ? (
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-back"
              onClick={() => {
                if (changeStep === 1) setMode("detail");
                else setChangeStep((value) => value - 1);
              }}
            >
              ← Back
            </button>
            {changeStep === 1 ? (
              <button
                type="button"
                className="family-primary"
                disabled={!requestValid}
                onClick={() => setChangeStep(2)}
              >
                Evaluate policy
              </button>
            ) : (
              <button
                type="button"
                className="family-primary"
                disabled={saving}
                onClick={() => void submitChangeRequest()}
              >
                {saving ? "Submitting…" : "Submit for staff review"}
              </button>
            )}
          </div>
        ) : null}
      </section>
    );
  }

  if (mode === "detail" && selected) {
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
          ← Calendar & changes
        </button>
        <section className="student-detail-hero">
          <span className="student-detail-avatar">{selected.kind === "booking" ? "BK" : "CR"}</span>
          <div>
            <span className="eyebrow">
              {selected.kind === "booking" ? "Confirmed booking / Session Detail" : "Course enrollment detail"}
            </span>
            <h2>{selected.title}</h2>
            <p>
              {selected.timeLabel}
              {selected.kind === "booking" ? " · Individual tutoring" : " · Cohort course"}
            </p>
          </div>
          <span className={`pill ${statusTone(selected.status)}`}>{statusLabel(selected.status)}</span>
        </section>
        <section className="record-breadcrumb">
          <Link href="/family/students">{`Student: ${selected.studentName} →`}</Link>
          <span>/</span>
          <span>{householdName || "Family household"}</span>
          <span>/</span>
          <span>{selected.tutorName || selected.courseName || selected.subtitle}</span>
        </section>
        <section className="family-summary-grid">
          <article className="panel">
            <small>Occurrence</small>
            <strong>{selected.timeLabel}</strong>
            <span>{selected.kind === "booking" ? "Tutoring request" : "Course enrollment"}</span>
          </article>
          <article className="panel">
            <small>Student / family</small>
            <strong>{selected.studentName}</strong>
            <span>{householdName || "Household"}</span>
          </article>
          <article className="panel">
            <small>{selected.kind === "booking" ? "Tutor / service" : "Course"}</small>
            <strong>{selected.tutorName || selected.courseName || selected.title}</strong>
            <span>{selected.subtitle}</span>
          </article>
          <article className="panel">
            <small>Attendance / billing</small>
            <strong>Not yet recorded</strong>
            <span>Covered by package · linked invoice later</span>
          </article>
        </section>
        <section className="panel">
          <span className="eyebrow">Exception and change history</span>
          <h3>
            {openChange
              ? `Submitted · awaiting staff review`
              : selectedChanges[0]
                ? statusLabel(selectedChanges[0].status)
                : "No open change request"}
          </h3>
          <p>Family requests create linked review records and never overwrite a confirmed occurrence.</p>
          {selectedChanges.slice(0, 3).map((row) => (
            <div key={row.id} style={{ marginTop: 10, fontSize: 9, color: "var(--muted)" }}>
              {row.changeType} · {row.reason} · {statusLabel(row.status)}
            </div>
          ))}
          <button
            type="button"
            className="family-primary"
            style={{ marginTop: 14 }}
            onClick={() => startChange(selected.id)}
          >
            Request a booking change
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Family portal"
        title="Calendar & changes"
        description="Confirmed tutoring and course enrollments appear here. Changes remain governed by the approved policy."
        action={
          <Link
            href="/family/book-tutoring"
            className="family-primary"
            style={{ textDecoration: "none", display: "inline-block", padding: "10px 14px" }}
          >
            + Book tutoring
          </Link>
        }
      />

      {error ? <div className="validation-hint">{error}</div> : null}

      <section className="panel schedule-list">
        {items.length === 0 ? (
          <div className="empty-action" style={{ padding: 24 }}>
            <p>No calendar items yet. Book tutoring or enroll in a course to see them here.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <Link href="/family/book-tutoring" className="family-primary" style={{ textDecoration: "none", padding: "10px 14px" }}>
                Book tutoring
              </Link>
              <Link href="/family/enroll-courses" className="secondary-button" style={{ textDecoration: "none", padding: "10px 14px" }}>
                Enroll in courses
              </Link>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <button key={`${item.kind}-${item.id}`} type="button" onClick={() => openDetail(item.id)}>
              <span className="date-block">{dateBlock(item)}</span>
              <span>
                <strong>{item.timeLabel}</strong>
                <small>
                  {item.studentName} · {item.title}
                  {item.tutorName ? ` · ${item.tutorName}` : ""}
                  {item.kind === "enrollment" ? " · Course" : " · Tutoring"}
                </small>
              </span>
              <span className={`pill ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
              <b>Booking detail →</b>
            </button>
          ))
        )}
      </section>

      <section className="recommendation-banner">
        <span>i</span>
        <div>
          <strong>Policy-guided changes</strong>
          <p>
            PT-CAN-2026.3 uses a 24-hour notice window and reason/outcome rules to recommend eligibility. Staff
            approval is always required before a banked credit or refund workflow.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (items[0]) startChange(items[0].id);
            else setError("Add a booking or enrollment before requesting a change.");
          }}
        >
          Request cancellation / make-up / refund review
        </button>
      </section>
    </>
  );
}
