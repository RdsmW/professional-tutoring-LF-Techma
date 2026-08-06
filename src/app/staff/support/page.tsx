import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function StaffSupportPage() {
  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Support"
        title="Support inbox"
        description="Family Messages / Support cases route here for assign, reply, and resolve."
      />
      <Panel title="Open cases" eyebrow="Stage 1 shell">
        <div className="empty-action">
          <div className="empty-symbol">✉</div>
          <p>No support cases yet. Stage 2 wires the Family → Staff case loop from the mockup.</p>
        </div>
        <ComingStageNote feature="Case detail, badge counts, and family-visible replies" />
      </Panel>
    </>
  );
}
