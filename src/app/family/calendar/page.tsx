import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyCalendarPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Calendar & Changes"
        title="Calendar & Changes"
        description="Confirmed tutoring and courses appear here. Change requests are policy-guided and staff-reviewed."
      />
      <Panel title="Upcoming" eyebrow="Stage 1 shell">
        <div className="empty-action">
          <div className="empty-symbol">📅</div>
          <p>No calendar items yet. Stage 2 links bookings and course sessions here.</p>
        </div>
        <ComingStageNote feature="Booking/Session Detail and policy-gated change requests" />
      </Panel>
    </>
  );
}
