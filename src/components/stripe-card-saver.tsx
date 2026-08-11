"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type CollectedCard = {
  /** Stripe payment method id, or null when using the household default on file. */
  id: string | null;
  brand: string | null;
  last4: string | null;
  savedForFuture: boolean;
};

export type StripeCardSaverHandle = {
  /** Confirm Stripe SetupIntent for this step. Returns null on validation/API failure. */
  confirm: () => Promise<CollectedCard | null>;
  /** True when Payment Element is mounted and ready (or using a saved card path). */
  isReady: () => boolean;
};

type SavedCard = {
  brand: string | null;
  last4: string | null;
};

type StripeCardSaverProps = {
  /** When true, confirm-method also stores the card on the household. */
  saveForFuture: boolean;
  savedCard: SavedCard | null;
  onCollected: (card: CollectedCard) => void;
  onUseSaved: () => void;
  onStartReplace?: () => void;
};

type SetupFormHandle = {
  confirm: (saveForFuture: boolean) => Promise<CollectedCard | null>;
  isReady: () => boolean;
};

const SetupForm = forwardRef<SetupFormHandle, { onError: (message: string | null) => void }>(
  function SetupForm({ onError }, ref) {
    const stripe = useStripe();
    const elements = useElements();

    useImperativeHandle(
      ref,
      () => ({
        isReady: () => Boolean(stripe && elements),
        confirm: async (saveForFuture: boolean) => {
          if (!stripe || !elements) {
            onError("Card form is still loading.");
            return null;
          }
          onError(null);
          const result = await stripe.confirmSetup({
            elements,
            redirect: "if_required",
          });
          if (result.error) {
            onError(result.error.message || "Unable to confirm card.");
            return null;
          }
          const setupIntent = result.setupIntent;
          if (!setupIntent?.id) {
            onError("Card setup did not complete.");
            return null;
          }
          const response = await fetch("/api/family/billing/confirm-method", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              saveForFuture,
              setupIntentId: setupIntent.id,
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.ok) {
            onError(data.error || "Unable to confirm payment method.");
            return null;
          }
          return {
            id: data.paymentMethod.id as string,
            brand: (data.paymentMethod.brand as string | null) ?? null,
            last4: (data.paymentMethod.last4 as string | null) ?? null,
            savedForFuture: Boolean(data.savedForFuture),
          };
        },
      }),
      [stripe, elements, onError],
    );

    return (
      <div className="stripe-card-box">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
    );
  },
);

export const StripeCardSaver = forwardRef<StripeCardSaverHandle, StripeCardSaverProps>(
  function StripeCardSaver({ saveForFuture, savedCard, onCollected, onUseSaved, onStartReplace }, ref) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [publishableKey, setPublishableKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [replaceMode, setReplaceMode] = useState(!savedCard?.last4);
    const formRef = useRef<SetupFormHandle>(null);
    const saveForFutureRef = useRef(saveForFuture);
    saveForFutureRef.current = saveForFuture;

    const stripePromise = useMemo(() => {
      if (!publishableKey) return null;
      return loadStripe(publishableKey) as Promise<Stripe | null>;
    }, [publishableKey]);

    useEffect(() => {
      if (!replaceMode) {
        setClientSecret(null);
        return;
      }

      const controller = new AbortController();
      setLoading(true);
      setError(null);
      void fetch("/api/family/billing/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    }, [replaceMode]);

    useImperativeHandle(
      ref,
      () => ({
        isReady: () => {
          if (!replaceMode && savedCard?.last4) return true;
          return Boolean(formRef.current?.isReady());
        },
        confirm: async () => {
          if (!replaceMode && savedCard?.last4) {
            onUseSaved();
            return {
              id: null,
              brand: savedCard.brand,
              last4: savedCard.last4,
              savedForFuture: true,
            };
          }
          const collected = await formRef.current?.confirm(saveForFutureRef.current);
          if (!collected) return null;
          onCollected(collected);
          return collected;
        },
      }),
      [replaceMode, savedCard, onCollected, onUseSaved],
    );

    if (savedCard?.last4 && !replaceMode) {
      return (
        <div className="saved-card-panel">
          <strong>
            Saved card: {(savedCard.brand || "Card").toUpperCase()} ···· {savedCard.last4}
          </strong>
          <p style={{ margin: "8px 0 0", fontSize: 9, color: "var(--muted)" }}>
            Continue uses this card for this request. Choose replace to enter a different card.
          </p>
          <div className="wizard-footer" style={{ borderTop: 0, marginTop: 10, paddingTop: 0 }}>
            <button
              type="button"
              className="family-primary"
              onClick={() => {
                onUseSaved();
              }}
            >
              Use saved card
            </button>
            <button
              type="button"
              className="wizard-back"
              onClick={() => {
                setReplaceMode(true);
                onStartReplace?.();
              }}
            >
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
      <>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SetupForm ref={formRef} onError={setError} />
        </Elements>
        {error ? <div className="validation-hint">{error}</div> : null}
        <p style={{ marginTop: 10, fontSize: 9, color: "var(--muted)" }}>
          Enter card details above, then Continue. The card is confirmed with Stripe for this request;
          it is saved on your family account only if you checked save-for-future.
        </p>
      </>
    );
  },
);
