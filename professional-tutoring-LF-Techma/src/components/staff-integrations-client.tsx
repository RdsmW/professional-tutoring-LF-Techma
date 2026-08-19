"use client";

import { PageIntro, Panel } from "@/components/ui";

type IntegrationCard = {
  name: string;
  purpose: string;
  status: string;
  tone: "green" | "amber";
};

export function IntegrationStatusPanel({ stripeConfigured }: { stripeConfigured: boolean }) {
  const cards: IntegrationCard[] = [
    {
      name: "Stripe",
      purpose: "Payment processor",
      status: stripeConfigured ? "Configured" : "Not configured",
      tone: stripeConfigured ? "green" : "amber",
    },
    {
      name: "Zoho CRM",
      purpose: "CRM / inquiry sync",
      status: "Not connected · Stage 4",
      tone: "amber",
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
      <p style={{ margin: "14px 0 0", fontSize: 14, color: "var(--muted)" }}>
        Status only — this screen does not charge, sync, or write outbound.
      </p>
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
