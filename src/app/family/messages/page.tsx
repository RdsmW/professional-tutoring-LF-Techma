import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyMessagesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Messages / Support"
        title="Messages / Support"
        description="Create an in-app case that appears in the Staff Support inbox."
      />
      <Panel title="Your cases" eyebrow="Stage 1 shell">
        <div className="empty-action">
          <div className="empty-symbol">✉</div>
          <p>No messages yet.</p>
        </div>
        <ComingStageNote feature="Validated case create, status, and staff replies" />
      </Panel>
    </>
  );
}
