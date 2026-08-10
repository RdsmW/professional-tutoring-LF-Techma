"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

type SavedCard = {
  brand: string | null;
  last4: string | null;
};

type StripeCardSaverProps = {
  consent: boolean;
  savedCard: SavedCard | null;
  onSaved: (card: SavedCard) => void;
  onUseSaved: () => void;
};

function SetupForm({
  onSaved,
}: {
  onSaved: (card: SavedCard) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });
      if (result.error) {
        setError(result.error.message || "Unable to save card.");
        return;
      }
      const setupIntent = result.setupIntent;
      if (!setupIntent?.id) {
        setError("Card setup did not complete.");
        return;
      }
      const response = await fetch("/api/family/billing/confirm-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          setupIntentId: setupIntent.id,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to store payment method.");
        return;
      }
      onSaved({
        brand: data.paymentMethod.brand,
        last4: data.paymentMethod.last4,
      });
    } catch {
      setError("Unable to save card.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stripe-card-box">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <div className="validation-hint">{error}</div> : null}
      <button type="button" className="family-primary" disabled={!stripe || submitting} onClick={() => void handleSave()}>
        {submitting ? "Saving…" : "Save card securely"}
      </button>
    </div>
  );
}

export function StripeCardSaver({ consent, savedCard, onSaved, onUseSaved }: StripeCardSaverProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replaceMode, setReplaceMode] = useState(!savedCard);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey) as Promise<Stripe | null>;
  }, [publishableKey]);

  useEffect(() => {
    if (!consent || !replaceMode) {
      setClientSecret(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch("/api/family/billing/setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Unable to start card setup");
        }
        setClientSecret(data.clientSecret);
        setPublishableKey(data.publishableKey);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to start card setup");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [consent, replaceMode]);

  if (!consent) {
    return (
      <div className="validation-hint">
        Check the save-card permission above to unlock secure card entry.
      </div>
    );
  }

  if (savedCard?.last4 && !replaceMode) {
    return (
      <div className="saved-card-panel">
        <strong>
          Saved card: {(savedCard.brand || "Card").toUpperCase()} ···· {savedCard.last4}
        </strong>
        <div className="wizard-footer" style={{ borderTop: 0, marginTop: 10, paddingTop: 0 }}>
          <button type="button" className="family-primary" onClick={onUseSaved}>
            Use saved card
          </button>
          <button type="button" className="wizard-back" onClick={() => setReplaceMode(true)}>
            Replace card
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="validation-hint">Preparing secure card form…</div>;
  if (error) return <div className="validation-hint">{error}</div>;
  if (!clientSecret || !stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SetupForm onSaved={onSaved} />
    </Elements>
  );
}
