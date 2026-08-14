"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageIntro, Panel } from "@/components/ui";
import { PAYMENT_STATUSES, amountLabel, paymentStatusLabel } from "@/lib/billing";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";

type BillingSummary = {
  unpaid: { count: number; amountCents: number };
  pending: { count: number; amountCents: number };
  paid: { count: number; amountCents: number };
};

type PaymentRow = {
  id: string;
  displayCode: string;
  status: string;
  statusLabel: string;
  amountCents: number;
  amountLabel: string;
  currency: string;
  methodLabel: string | null;
  householdId: string;
  householdName: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  paidAt: string | null;
  createdAt: string;
  notes: string | null;
};

type PaymentDetail = PaymentRow & {
  updatedAt: string;
  cardOnFile: { brand: string | null; last4: string | null } | null;
};

function relatedLabel(type: string | null) {
  if (type === "booking") return "Tutoring booking";
  if (type === "course_enrollment") return "Course enrollment";
  return type || "Manual ledger";
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function StaffBillingClient() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<BillingSummary>({
    unpaid: { count: 0, amountCents: 0 },
    pending: { count: 0, amountCents: 0 },
    paid: { count: 0, amountCents: 0 },
  });
  const [selected, setSelected] = useState<PaymentDetail | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff/billing");
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load billing records.");
        return;
      }
      setPayments(data.payments ?? []);
      setSummary(
        data.summary ?? {
          unpaid: { count: 0, amountCents: 0 },
          pending: { count: 0, amountCents: 0 },
          paid: { count: 0, amountCents: 0 },
        },
      );
    } catch {
      setError("Unable to load billing records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function openPayment(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/staff/billing/${id}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to open payment.");
        return;
      }
      setSelected(data.payment);
      setNotesDraft(data.payment.notes ?? "");
    } catch {
      setError("Unable to open payment.");
    }
  }

  async function patchPayment(patch: { status?: string; notes?: string | null }) {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/staff/billing/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to update payment.");
        return;
      }
      setSelected(data.payment);
      setNotesDraft(data.payment.notes ?? "");
      await reload();
    } catch {
      setError("Unable to update payment.");
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    const cardLabel = selected.cardOnFile?.last4
      ? `${(selected.cardOnFile.brand || "Card").toUpperCase()} ···· ${selected.cardOnFile.last4}`
      : "No card on file";

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
          ← Billing records
        </button>
        <PageIntro
          title="Billing detail"
          description="Manual ledger updates only — no Stripe charges from this screen."
          action={<span className={`pill ${statusTone(selected.status)}`}>{formatStatusLabel(selected.statusLabel || selected.status)}</span>}
        />
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{selected.displayCode}</span>
              <h3>{selected.amountLabel}</h3>
              <p>
                <Link href={`/staff/families/${selected.householdId}`}>{selected.householdName}</Link>
                {" · "}
                {relatedLabel(selected.relatedEntityType)}
              </p>
            </div>
          </div>
          <div className="record-detail-grid" style={{ marginTop: 12 }}>
            <div>
              <small>Method</small>
              <strong>{selected.methodLabel || "—"}</strong>
            </div>
            <div>
              <small>Card on file</small>
              <strong>{cardLabel}</strong>
            </div>
            <div>
              <small>Created</small>
              <strong>{formatWhen(selected.createdAt)}</strong>
            </div>
            <div>
              <small>Paid at</small>
              <strong>{formatWhen(selected.paidAt)}</strong>
            </div>
          </div>
          <div className="input-grid" style={{ marginTop: 16 }}>
            <label>
              Status
              <select
                value={selected.status}
                disabled={saving}
                onChange={(event) => void patchPayment({ status: event.target.value })}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {paymentStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <input
                value={notesDraft}
                disabled={saving}
                onChange={(event) => setNotesDraft(event.target.value)}
                placeholder="Staff ledger note"
              />
            </label>
          </div>
          {error ? <div className="validation-hint">{error}</div> : null}
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 12 }}
            disabled={saving || notesDraft === (selected.notes ?? "")}
            onClick={() => void patchPayment({ notes: notesDraft })}
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        title="Billing"
        description="Manual staff ledger — this screen never charges cards."
      />
      <section className="billing-summary">
        <article>
          <small>Unpaid</small>
          <strong>{summary.unpaid.count}</strong>
          <span>{amountLabel(summary.unpaid.amountCents, "USD")} total</span>
        </article>
        <article>
          <small>Pending</small>
          <strong>{summary.pending.count}</strong>
          <span>{amountLabel(summary.pending.amountCents, "USD")} total</span>
        </article>
        <article>
          <small>Paid</small>
          <strong>{summary.paid.count}</strong>
          <span>{amountLabel(summary.paid.amountCents, "USD")} total</span>
        </article>
      </section>
      {error ? <p className="form-error">{error}</p> : null}
      <Panel>
        {loading ? <p style={{ fontSize: 14, color: "var(--muted)" }}>Loading billing…</p> : null}
        {!loading && payments.length === 0 ? (
          <div className="empty-action">
            <div className="empty-symbol">$</div>
            <p>No payment records yet. Family booking and enrollment create ledger rows here.</p>
          </div>
        ) : null}
        <div className="stack-list">
          {payments.map((row) => (
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
              onClick={() => void openPayment(row.id)}
            >
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">
                    {row.displayCode} · {relatedLabel(row.relatedEntityType)}
                  </span>
                  <h3 style={{ margin: "4px 0" }}>{row.amountLabel}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                    {row.householdName}
                    {row.methodLabel ? ` · ${row.methodLabel}` : ""}
                  </p>
                </div>
                <span className={`pill ${statusTone(row.status)}`}>{formatStatusLabel(row.statusLabel || row.status)}</span>
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}
