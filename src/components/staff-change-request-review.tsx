"use client";

import Link from "next/link";
import {
  evaluateChangePolicy,
  isChangeReason,
  isRequestedOutcome,
} from "@/lib/family/change-policy";
import type {
  ChangeRequestStatusAction,
  StaffChangeRequestDto,
} from "@/lib/staff/change-request-types";
import { isPaymentIssueRequest, isPreviewChangeRequestId } from "@/lib/staff/preview-requests";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

export function relatedEntityLabel(type: string) {
  if (type === "booking") return "Session";
  if (type === "course_enrollment") return "Course enrollment";
  if (type === "payment") return "Payment";
  return formatStatusLabel(type);
}

export function formatRequestWhen(iso: string | null) {
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

function relatedEntityHref(type: string, id: string, sample: boolean) {
  if (type === "payment") return "/staff/billing";
  if (sample) return "/staff/sessions";
  if (type === "booking" && id) return `/staff/sessions/${id}`;
  return null;
}

function policyTraceHeadline(reason: string) {
  if (!isChangeReason(reason)) return null;
  return evaluateChangePolicy(reason);
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffChangeRequestReview({
  request,
  staffNotesDraft,
  onStaffNotesChange,
  saving,
  onSaveNotes,
  onStatus,
  onSampleAction,
}: {
  request: StaffChangeRequestDto;
  staffNotesDraft: string;
  onStaffNotesChange: (value: string) => void;
  saving: boolean;
  onSaveNotes: () => void;
  onStatus: (status: ChangeRequestStatusAction) => void;
  onSampleAction?: (action: string) => void;
}) {
  const sample = isPreviewChangeRequestId(request.id);
  const paymentIssue = isPaymentIssueRequest(request);
  const policyHeadline = paymentIssue ? null : policyTraceHeadline(request.reason);
  const relatedHref = relatedEntityHref(
    request.relatedEntityType,
    request.relatedEntityId,
    sample,
  );
  const studentHref = sample || !request.studentId ? "/staff/students" : `/staff/students/${request.studentId}`;
  const familyHref =
    sample || !request.householdId ? "/staff/families" : `/staff/families/${request.householdId}`;
  const billingHref = "/staff/billing";

  function runStatus(status: ChangeRequestStatusAction, label: string) {
    if (sample) {
      onSampleAction?.(label);
      return;
    }
    onStatus(status);
  }

  return (
    <div className="staff-request-review">
      {sample ? (
        <p className="dashboard-preview-note">Sample request — not live data.</p>
      ) : null}

      <section className="student-detail-hero" style={{ marginBottom: 14 }}>
        <span className="student-detail-avatar">{initialsFromName(request.studentName)}</span>
        <div>
          <span className="eyebrow">{paymentIssue ? "Payment issue" : "Request review"}</span>
          <h2 style={{ margin: "4px 0" }}>{formatStatusLabel(request.changeType)}</h2>
          <p style={{ margin: 0 }}>
            <Link href={studentHref}>{request.studentName}</Link>
            {" · "}
            <Link href={familyHref}>{request.householdName}</Link>
          </p>
        </div>
        <span className={`pill ${paymentIssue ? "gold" : statusTone(request.status)}`}>
          {paymentIssue ? "Needs attention" : formatStatusLabel(request.status)}
        </span>
      </section>

      <div className="record-detail-grid" style={{ marginBottom: 14 }}>
        <div>
          <small>Requested by</small>
          <strong style={{ fontSize: 14 }}>{request.requesterName || "—"}</strong>
        </div>
        <div>
          <small>Family</small>
          <strong style={{ fontSize: 14 }}>
            <Link href={familyHref}>{request.householdName}</Link>
          </strong>
        </div>
        <div>
          <small>Student</small>
          <strong style={{ fontSize: 14 }}>
            <Link href={studentHref}>{request.studentName}</Link>
          </strong>
        </div>
        <div>
          <small>Type of change</small>
          <strong style={{ fontSize: 14 }}>{formatStatusLabel(request.changeType)}</strong>
        </div>
        <div>
          <small>Requested outcome</small>
          <strong style={{ fontSize: 14 }}>{formatStatusLabel(request.requestedOutcome)}</strong>
        </div>
        <div>
          <small>Session / record</small>
          <strong style={{ fontSize: 14 }}>
            {relatedEntityLabel(request.relatedEntityType)}
            {relatedHref ? (
              <>
                {" · "}
                <Link href={relatedHref}>Open session →</Link>
              </>
            ) : (
              " · —"
            )}
          </strong>
        </div>
        <div>
          <small>Reason</small>
          <strong style={{ fontSize: 14 }}>{request.reason}</strong>
        </div>
        <div>
          <small>Preferred alternatives</small>
          <strong style={{ fontSize: 14 }}>{request.preferredAlternatives || "—"}</strong>
        </div>
        <div>
          <small>Created</small>
          <strong style={{ fontSize: 14 }}>{formatRequestWhen(request.createdAt)}</strong>
        </div>
      </div>

      <section className="policy-recommendation">
        <span>i</span>
        <div>
          <strong>
            Stored policy recommendation
            {policyHeadline ? ` · ${policyHeadline}` : ""}
          </strong>
          <p>{request.policyRecommendation}</p>
          {policyHeadline && isRequestedOutcome(request.requestedOutcome) ? (
            <p style={{ marginTop: 8 }}>
              Computed from saved reason ({request.reason}) via PT-CAN-2026.3 family change policy — no
              new rules applied here. Outcome context: {request.requestedOutcome}.
            </p>
          ) : null}
        </div>
      </section>

      <label className="full-input" style={{ marginTop: 14, display: "block" }}>
        Staff notes
        <textarea
          value={staffNotesDraft}
          disabled={saving || sample}
          onChange={(event) => onStaffNotesChange(event.target.value)}
          rows={4}
          placeholder="Internal review notes for this request"
        />
      </label>
      <button
        type="button"
        className="secondary-button"
        style={{ marginTop: 8 }}
        disabled={saving || sample || staffNotesDraft === (request.staffNotes ?? "")}
        onClick={() => (sample ? onSampleAction?.("Save notes") : onSaveNotes())}
      >
        {saving ? "Saving…" : "Save staff notes"}
      </button>

      {paymentIssue ? (
        <>
          <h3 style={{ margin: "18px 0 10px", fontSize: 14 }}>Next step</h3>
          <div className="exception-actions">
            <div>
              <Link href={billingHref} className="staff-request-reschedule">
                <span>Open billing</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 style={{ margin: "18px 0 10px", fontSize: 14 }}>Staff outcome</h3>
          <div className="exception-actions">
            <div>
              <button
                type="button"
                disabled={saving || request.status === "approved"}
                onClick={() => runStatus("approved", "Approve")}
              >
                <span>Approve</span>
                <span>→</span>
              </button>
              <button
                type="button"
                disabled={saving || request.status === "declined"}
                onClick={() => runStatus("declined", "Decline")}
              >
                <span>Decline</span>
                <span>→</span>
              </button>
              <Link href={relatedHref ?? "/staff/sessions"} className="staff-request-reschedule">
                <span>Open schedule</span>
                <span>→</span>
              </Link>
              <button
                type="button"
                disabled={saving || request.status === "applied"}
                onClick={() => runStatus("applied", "Applied")}
              >
                <span>Applied</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
