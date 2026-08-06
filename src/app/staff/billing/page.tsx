import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function StaffBillingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Billing"
        title="Billing"
        description="Money amounts will use integer cents. Card details never live in this app — Stripe hosts payment capture later."
      />
      <section className="billing-summary">
        {["Open invoices", "Paid this month", "Needs review"].map((label) => (
          <article key={label}>
            <small>{label}</small>
            <strong>—</strong>
            <span>Stage 2+ live totals</span>
          </article>
        ))}
      </section>
      <Panel title="Billing records" eyebrow="Stage 1 shell">
        <div className="empty-action">
          <div className="empty-symbol">$</div>
          <p>Billing detail, line items, and controlled refund/credit workflows arrive after the core booking journeys.</p>
        </div>
        <ComingStageNote feature="Billing Detail and history-preserving actions" />
      </Panel>
    </>
  );
}
