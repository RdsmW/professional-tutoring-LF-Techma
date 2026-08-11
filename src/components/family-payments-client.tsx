"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageIntro } from "@/components/ui";

type SavedCard = {
  brand: string | null;
  last4: string | null;
} | null;

type PaymentRow = {
  id: string;
  displayCode: string;
  createdAt: string;
  description: string;
  amountCents: number;
  amountLabel: string;
  status: string;
  statusLabel: string;
  methodLabel: string;
  creditLabel: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  studentId: string | null;
  studentName: string | null;
  serviceLabel: string;
  notes: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: string) {
  if (status === "paid" || status === "waived") return "mint";
  if (status === "failed" || status === "refunded") return "amber";
  return "amber";
}

function downloadReceiptPreview(payment: PaymentRow) {
  const body = [
    "RECEIPT PREVIEW",
    payment.displayCode,
    formatDate(payment.createdAt),
    payment.description,
    payment.amountLabel,
    payment.statusLabel,
    payment.methodLabel,
    "Not an official processor receipt.",
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${payment.displayCode}-receipt-preview.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FamilyPaymentsClient() {
  const router = useRouter();
  const [savedCard, setSavedCard] = useState<SavedCard>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family/payments");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load payments.");
        return;
      }
      setSavedCard(data.savedCard ?? null);
      setPayments(data.payments ?? []);
    } catch {
      setError("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = payments.find((row) => row.id === selectedId) ?? null;

  if (loading) {
    return <div className="panel">Loading payments…</div>;
  }

  if (selected) {
    const linksLead = [selected.studentName, selected.serviceLabel].filter(Boolean).join(" · ");

    return (
      <>
        <button type="button" className="page-back" onClick={() => setSelectedId(null)}>
          ← Payments & receipts
        </button>
        <section className="family-record-hero">
          <span className="student-detail-avatar">$</span>
          <div>
            <span className="eyebrow">Family payment detail</span>
            <h2>{selected.displayCode}</h2>
            <p>
              {formatDate(selected.createdAt)} · {selected.description}
            </p>
          </div>
          <span className={`pill ${statusTone(selected.status)}`}>{selected.statusLabel}</span>
        </section>

        <section className="family-summary-grid three">
          <article className="panel">
            <small>Amount</small>
            <strong>{selected.amountLabel}</strong>
            <span>{selected.statusLabel}</span>
          </article>
          <article className="panel">
            <small>Payment method</small>
            <strong>{selected.methodLabel}</strong>
            <span>Masked card on file</span>
          </article>
          <article className="panel">
            <small>Refund / credit</small>
            <strong>{selected.creditLabel}</strong>
            <span>None applied</span>
          </article>
        </section>

        <section className="panel">
          <span className="eyebrow">Linked service records</span>
          <h3>{linksLead || "Linked records"}</h3>
          <div className="record-link-grid">
            <button
              type="button"
              disabled={!selected.studentId}
              onClick={() => router.push(`/family/students?studentId=${selected.studentId}`)}
            >
              <span aria-hidden="true">→</span>
              <span>
                <strong>Student</strong>
                <small>{selected.studentName || "Unavailable"}</small>
              </span>
            </button>
            <button
              type="button"
              disabled={!selected.relatedEntityId}
              onClick={() => router.push(`/family/calendar?id=${selected.relatedEntityId}`)}
            >
              <span aria-hidden="true">→</span>
              <span>
                <strong>
                  {selected.relatedEntityType === "course_enrollment" ? "Course enrollment" : "Booking / Session"}
                </strong>
                <small>{selected.serviceLabel}</small>
              </span>
            </button>
            <button type="button" disabled title="Invoice available after charge">
              <span aria-hidden="true">—</span>
              <span>
                <strong>Invoice</strong>
                <small>Available after charge</small>
              </span>
            </button>
          </div>
        </section>

        <section className="panel receipt-download">
          <span className="eyebrow">Receipt preview</span>
          <h3>Download receipt preview</h3>
          <p>Preview only — not an official processor receipt.</p>
          <button
            type="button"
            className="family-primary"
            style={{ marginTop: 12 }}
            onClick={() => downloadReceiptPreview(selected)}
          >
            Download receipt preview
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Family portal"
        title="Payments & receipts"
        description="See tutoring and course billing previews without exposing card details."
      />

      <div className="hosted-payment" style={{ marginBottom: 16 }}>
        <span className="shield">◇</span>
        <div>
          <span className="eyebrow">Payment method</span>
          <h3>Hosted payment profile</h3>
          <p>
            {savedCard?.last4
              ? `Saved for future bookings: ${(savedCard.brand || "Card").toUpperCase()} ···· ${savedCard.last4}`
              : "No card on file yet. Enter a card during Book Tutoring or Enroll; save it for future charges only with permission."}
          </p>
        </div>
        <span className={`pill ${savedCard?.last4 ? "mint" : "amber"}`}>
          {savedCard?.last4 ? "On file" : "Pending setup"}
        </span>
      </div>

      {error ? <div className="validation-hint">{error}</div> : null}

      <section className="panel table-panel receipt-table">
        <div className="table-head four">
          <span>Date</span>
          <span>Description / amount</span>
          <span>Status</span>
          <span>Receipt</span>
        </div>
        {payments.length === 0 ? (
          <div className="empty-action" style={{ padding: 24 }}>
            <p>No payment records yet. Book tutoring or enroll in a course to create a pending ledger row.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <Link
                href="/family/book-tutoring"
                className="family-primary"
                style={{ textDecoration: "none", padding: "10px 14px" }}
              >
                Book tutoring
              </Link>
              <Link
                href="/family/enroll-courses"
                className="secondary-button"
                style={{ textDecoration: "none", padding: "10px 14px" }}
              >
                Enroll in courses
              </Link>
            </div>
          </div>
        ) : (
          payments.map((row) => (
            <button
              key={row.id}
              type="button"
              className="table-row four"
              aria-label={`Open payment ${row.displayCode}`}
              onClick={() => setSelectedId(row.id)}
            >
              <span>{formatDate(row.createdAt)}</span>
              <strong>
                {row.description}
                <small>{row.amountLabel}</small>
              </strong>
              <span className={`pill ${statusTone(row.status)}`}>{row.statusLabel}</span>
              <span>
                {row.displayCode} →
              </span>
            </button>
          ))
        )}
      </section>
    </>
  );
}
