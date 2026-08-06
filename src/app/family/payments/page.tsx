import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyPaymentsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Payments & Receipts"
        title="Payments & Receipts"
        description="Card details stay with Stripe. This portal will show tokenized status and receipts only."
      />
      <div className="hosted-payment">
        <span className="shield">◇</span>
        <div>
          <span className="eyebrow">Payment method</span>
          <h3>Hosted payment profile</h3>
          <p>Stage 2+ shows masked method and synthetic-safe receipts. No raw card data is stored here.</p>
        </div>
        <span className="pill">Pending setup</span>
      </div>
      <Panel title="Transactions" eyebrow="Stage 1 shell">
        <ComingStageNote feature="Payment detail rows and receipt download" />
      </Panel>
    </>
  );
}
