"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

type PreparedPayment =
  | { kind: "manual" | "completed"; paymentRecordId: string }
  | {
      kind: "payment_intent" | "setup_intent";
      clientSecret: string | null;
      publishableKey: string;
      paymentRecordId: string;
    };

type FinalizedPayment = {
  schedulingPath: "family_selected" | "pt_chooses";
  bookingId: string | null;
  paymentStatus: string;
  pendingManualPayment?: boolean;
};

function money(amountCents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
}

function dueDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(value));
}

function academicYearPaymentReturnUrl() {
  return `${window.location.origin}/register/academic-year-tutoring?payment=return`;
}

function CardConfirmation({
  mode,
  token,
  onCompleted,
}: {
  mode: Extract<PreparedPayment, { kind: "payment_intent" | "setup_intent" }>;
  token: string;
  onCompleted: (result: FinalizedPayment) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function finalize(intentId: string) {
    const response = await fetch("/api/public/ay-tutoring-payment/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, intentId }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to complete payment.");
    onCompleted(data as FinalizedPayment);
  }

  async function confirm() {
    if (!stripe || !elements) {
      setError("The secure card form is still loading.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode.kind === "payment_intent") {
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: academicYearPaymentReturnUrl() },
          redirect: "if_required",
        });
        if (result.error || !result.paymentIntent?.id) {
          throw new Error(result.error?.message || "Payment authorization was not completed.");
        }
        await finalize(result.paymentIntent.id);
      } else {
        const result = await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: academicYearPaymentReturnUrl() },
          redirect: "if_required",
        });
        if (result.error || !result.setupIntent?.id) {
          throw new Error(result.error?.message || "Card setup was not completed.");
        }
        await finalize(result.setupIntent.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="public-ay-stack">
      <div className="stripe-card-box">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      {error ? <p className="validation-hint">{error}</p> : null}
      <button type="button" className="public-ay-primary" onClick={() => void confirm()} disabled={saving}>
        {saving
          ? "Confirming…"
          : mode.kind === "payment_intent"
            ? "Authorize and confirm registration"
            : "Save card and confirm registration"}
      </button>
    </div>
  );
}

export function PublicAyTutoringPaymentPanel({
  token,
  amountCents,
  dueAt,
  label,
  requiresCard,
  serviceFeeCents,
  returnedIntentId,
  onCompleted,
}: {
  token: string;
  amountCents: number;
  dueAt: string;
  label: string;
  requiresCard: boolean;
  serviceFeeCents: number;
  returnedIntentId?: string | null;
  onCompleted: (result: FinalizedPayment) => void;
}) {
  const [prepared, setPrepared] = useState<PreparedPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const stripePromise = useMemo(() => {
    if (!prepared || (prepared.kind !== "payment_intent" && prepared.kind !== "setup_intent")) return null;
    return loadStripe(prepared.publishableKey) as Promise<Stripe | null>;
  }, [prepared]);

  useEffect(() => {
    const controller = new AbortController();
    if (returnedIntentId) {
      void fetch("/api/public/ay-tutoring-payment/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, intentId: returnedIntentId }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || "Unable to complete payment.");
          onCompleted(data as FinalizedPayment);
        })
        .catch((caught: unknown) => {
          if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to complete payment.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }
    void fetch("/api/public/ay-tutoring-payment/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Unable to prepare payment.");
        setPrepared(data as PreparedPayment);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Unable to prepare payment.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [onCompleted, returnedIntentId, token]);

  async function completeManualPayment() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/public/ay-tutoring-payment/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Unable to confirm payment method.");
      onCompleted(data as FinalizedPayment);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to confirm payment method.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="public-ay-stack" aria-live="polite">
       <h2>Payment</h2>
      <p>
        {label}: <strong>{money(amountCents)}</strong> due {dueDate(dueAt)}.
      </p>
       {serviceFeeCents ? <p className="public-ay-help">Includes {money(serviceFeeCents)} 3.6% credit/debit card service fee.</p> : null}
      {loading ? <p>Preparing your secure payment step…</p> : null}
      {error ? <p className="validation-hint">{error}</p> : null}
      {!loading && !error && prepared?.kind === "manual" ? (
        <>
          <p>
            You selected an alternative payment method. Confirm that selection to finish your registration.
          </p>
          <button type="button" className="public-ay-primary" onClick={() => void completeManualPayment()} disabled={saving}>
            {saving ? "Confirming…" : "Confirm payment method and registration"}
          </button>
        </>
      ) : null}
      {!loading && !error && prepared?.kind === "completed" ? (
        <p>This payment step was already completed. You can safely return to your registration confirmation.</p>
      ) : null}
      {!loading &&
      !error &&
      prepared &&
      (prepared.kind === "payment_intent" || prepared.kind === "setup_intent") &&
      stripePromise &&
      prepared.clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret: prepared.clientSecret }}>
          <CardConfirmation mode={prepared} token={token} onCompleted={onCompleted} />
        </Elements>
      ) : null}
      {!loading && !error && !requiresCard && !prepared ? <p>Preparing payment method confirmation…</p> : null}
    </section>
  );
}