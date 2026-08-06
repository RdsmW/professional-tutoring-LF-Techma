import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyBookTutoringPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Book Tutoring"
        title="Book Tutoring"
        description="Academic-Year or Summer tutoring. Parents choose from suitable and available tutors — Best Fit is staff-only assist."
      />
      <Panel title="Booking journey" eyebrow="Mockup steps">
        <div className="wizard-progress">
          {["Student", "Service", "Subject", "Pattern", "Window", "Tutor", "Slot", "Review"].map((step, index) => (
            <div key={step} className={index === 0 ? "complete" : undefined}>
              <span>{index + 1}</span>
              <small>{step}</small>
            </div>
          ))}
        </div>
        <ComingStageNote feature="Full Book Tutoring wizard with capacity-safe confirmation" />
      </Panel>
    </>
  );
}
