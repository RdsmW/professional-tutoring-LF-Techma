"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StaffChangeRequestReview } from "@/components/staff-change-request-review";
import { PageIntro, Panel } from "@/components/ui";
import type {
  ChangeRequestStatusAction,
  StaffChangeRequestDto,
} from "@/lib/staff/change-request-types";
import {
  getPreviewChangeRequest,
  isPaymentIssueRequest,
  isPreviewChangeRequestId,
} from "@/lib/staff/preview-requests";
import { formatStatusLabel } from "@/lib/ui/status";

export function StaffRequestReviewClient({ requestId }: { requestId: string }) {
  const preview = isPreviewChangeRequestId(requestId) ? getPreviewChangeRequest(requestId) : null;
  const [request, setRequest] = useState<StaffChangeRequestDto | null>(preview);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState<string | null>(null);
  const [staffNotesDraft, setStaffNotesDraft] = useState(preview?.staffNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [sampleMessage, setSampleMessage] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/exceptions/${requestId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load this request.");
        setRequest(null);
        return;
      }
      const next = data.exception as StaffChangeRequestDto;
      setRequest(next);
      setStaffNotesDraft(next.staffNotes ?? "");
    } catch {
      setError("Unable to load this request.");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (preview) return;
    void loadLive();
  }, [loadLive, preview]);

  async function patch(body: { status?: ChangeRequestStatusAction; staffNotes?: string | null }) {
    if (saving || preview) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/exceptions/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update this request.");
        return;
      }
      const next = data.exception as StaffChangeRequestDto;
      setRequest(next);
      setStaffNotesDraft(next.staffNotes ?? "");
    } catch {
      setError("Unable to update this request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageIntro
        eyebrow={request && isPaymentIssueRequest(request) ? "Payment issue" : "Family request"}
        title={request ? formatStatusLabel(request.changeType) : "Request review"}
        description={
          request
            ? `${request.studentName} · ${request.householdName}`
            : "Review the household and what still needs follow-up."
        }
        action={
          <Link href="/staff" className="text-button">
            Back to dashboard
          </Link>
        }
      />

      <Panel>
        {error ? <p className="form-error">{error}</p> : null}
        {sampleMessage ? <p className="dashboard-preview-note">{sampleMessage}</p> : null}
        {loading ? <p className="dashboard-empty">Loading request…</p> : null}
        {!loading && !request ? (
          <p className="dashboard-empty">This request was not found. Open Sessions to browse the exceptions queue.</p>
        ) : null}
        {request ? (
          <StaffChangeRequestReview
            request={request}
            staffNotesDraft={staffNotesDraft}
            onStaffNotesChange={setStaffNotesDraft}
            saving={saving}
            onSaveNotes={() => void patch({ staffNotes: staffNotesDraft })}
            onStatus={(status) => void patch({ status })}
            onSampleAction={(action) =>
              setSampleMessage(`Sample only — “${action}” applies on live family requests.`)
            }
          />
        ) : null}
      </Panel>
    </>
  );
}
