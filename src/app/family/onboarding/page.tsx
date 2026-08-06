import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyOnboardingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Onboarding"
        title="Complete your family profile"
        description="First-time families finish profile details before entering the full portal."
      />
      <Panel title="Onboarding checklist" eyebrow="Stage 1 shell">
        <div className="onboarding-checklist">
          {["Confirm household contact", "Billing owner", "Add first student", "Choose a service"].map((item) => (
            <div key={item}>
              <span>○</span>
              {item}
            </div>
          ))}
        </div>
        <ComingStageNote feature="Guided onboarding with required fields and portal unlock" />
      </Panel>
    </>
  );
}
