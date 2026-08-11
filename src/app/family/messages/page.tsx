import Link from "next/link";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyMessagesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Messages / Support"
        title="Messages / Support"
        description="Create an in-app case that appears in the Staff Support inbox."
      />

      <Panel title="Need a scheduling change?" eyebrow="Calendar bridge">
        <p style={{ margin: "0 0 12px", fontSize: 11, maxWidth: 640 }}>
          Cancellation, make-up, and refund review requests stay on Calendar &amp; Changes so they stay
          linked to a specific booking or enrollment.
        </p>
        <Link
          href="/family/calendar"
          className="family-primary"
          style={{ textDecoration: "none", display: "inline-block", padding: "10px 14px" }}
        >
          Open Calendar &amp; changes
        </Link>
        <p style={{ margin: "12px 0 0", fontSize: 9, color: "var(--muted)" }}>
          Open a booking or enrollment there, then choose Request cancellation / make-up / refund review.
        </p>
      </Panel>

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
