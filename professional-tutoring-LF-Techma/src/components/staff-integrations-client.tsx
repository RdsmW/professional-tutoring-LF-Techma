"use client";

import { PageIntro, Panel } from "@/components/ui";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type IntegrationCard = {
  name: string;
  purpose: string;
  status: string;
  tone: "green" | "amber";
};

type ZohoStatus = {
  configured: boolean;
  authorized: boolean;
  checks: Array<{ name: string; ok: boolean }>;
};

export function IntegrationStatusPanel({ stripeConfigured }: { stripeConfigured: boolean }) {
  const searchParams = useSearchParams();
  const callbackResult = searchParams.get("zoho");
  const [zoho, setZoho] = useState<ZohoStatus | null>(null);
  const [zohoLoading, setZohoLoading] = useState(true);
  const [zohoBusy, setZohoBusy] = useState(false);
  const [zohoMessage, setZohoMessage] = useState<string | null>(null);

  const loadZohoStatus = async () => {
    setZohoLoading(true);
    try {
      const response = await fetch("/api/integrations/zoho/status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setZoho(null);
        setZohoMessage(data.error || "Zoho status is unavailable.");
        return;
      }
      setZoho({
        configured: Boolean(data.configured),
        authorized: Boolean(data.authorized),
        checks: Array.isArray(data.checks) ? data.checks : [],
      });
      setZohoMessage(null);
    } catch {
      setZoho(null);
      setZohoMessage("Zoho status is unavailable.");
    } finally {
      setZohoLoading(false);
    }
  };

  useEffect(() => {
    void loadZohoStatus();
  }, []);

  const connectZoho = async () => {
    setZohoBusy(true);
    setZohoMessage(null);
    try {
      const response = await fetch("/api/integrations/zoho/authorize", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok || typeof data.authorizationUrl !== "string") {
        setZohoMessage(data.error || "Zoho authorization could not be started.");
        return;
      }
      window.location.assign(data.authorizationUrl);
    } catch {
      setZohoMessage("Zoho authorization could not be started.");
    } finally {
      setZohoBusy(false);
    }
  };

  const zohoStatus = zohoLoading
    ? "Checking CRM access"
    : !zoho?.configured
      ? "Not configured"
      : !zoho.authorized
        ? "Authorization required"
        : zoho.checks.every((check) => check.ok)
          ? "CRM access verified"
          : "CRM access check failed";

  const zohoTone: IntegrationCard["tone"] =
    zoho && zoho.configured && zoho.authorized && zoho.checks.every((check) => check.ok) ? "green" : "amber";
  const callbackMessage =
    callbackResult === "authorized"
      ? "Zoho authorization completed. Checking CRM access."
      : callbackResult === "rejected"
        ? "Zoho authorization was not completed."
        : null;
  const displayedMessage = zohoMessage ?? callbackMessage;

  const cards: IntegrationCard[] = [
    {
      name: "Stripe",
      purpose: "Payment processor",
      status: stripeConfigured ? "Configured" : "Not configured",
      tone: stripeConfigured ? "green" : "amber",
    },
    {
      name: "Zoho CRM",
      purpose: "CRM connection",
      status: zohoStatus,
      tone: zohoTone,
    },
    {
      name: "Acuity",
      purpose: "Schedule destination",
      status: "Not connected · Stage 4",
      tone: "amber",
    },
    {
      name: "QuickBooks",
      purpose: "Accounting ledger",
      status: "Not connected · Stage 4",
      tone: "amber",
    },
  ];

  return (
    <>
      <div className="integration-status-grid">
        {cards.map((card) => (
          <article key={card.name} className="integration-status-card">
            <div>
              <strong>{card.name}</strong>
              <small>{card.purpose}</small>
            </div>
            <span className={`pill ${card.tone}`}>{card.status}</span>
          </article>
        ))}
      </div>
      <p aria-live="polite" style={{ margin: "14px 0 0", fontSize: 14, color: "var(--muted)" }}>
        Status only — this screen does not charge, sync, or write outbound.
      </p>
      <section style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <strong>Zoho CRM authorization</strong>
        <p style={{ margin: "6px 0 12px", fontSize: 14, color: "var(--muted)" }}>
          Connects Accounts, Contacts, Deals, and field metadata. Access verification uses GET-only checks.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" className="primary-button" onClick={connectZoho} disabled={zohoBusy}>
            {zohoBusy ? "Opening Zoho…" : "Connect Zoho CRM"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadZohoStatus()}
            disabled={zohoLoading}
          >
            {zohoLoading ? "Checking…" : "Check CRM access"}
          </button>
        </div>
        {displayedMessage ? (
          <p className="form-error" role="alert">
            {displayedMessage}
          </p>
        ) : null}
        {!zohoLoading && zoho?.checks.length ? (
          <p aria-live="polite" style={{ margin: "12px 0 0", fontSize: 14, color: "var(--muted)" }}>
            {zoho.checks.map((check) => `${check.name}: ${check.ok ? "passed" : "failed"}`).join(" · ")}
          </p>
        ) : null}
      </section>
    </>
  );
}

/** Kept for any legacy imports; Settings owns the primary Integrations UI. */
export function StaffIntegrationsClient({ stripeConfigured }: { stripeConfigured: boolean }) {
  return (
    <>
      <PageIntro title="Integrations" />
      <Panel title="Connection status">
        <IntegrationStatusPanel stripeConfigured={stripeConfigured} />
      </Panel>
    </>
  );
}
