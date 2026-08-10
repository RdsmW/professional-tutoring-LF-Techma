import { PageIntro, Panel } from "@/components/ui";
import { FamilyOnboardingForm } from "@/components/family-onboarding-form";

export default function FamilyOnboardingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Onboarding"
        title="Complete your family profile"
        description="First-time families finish profile details before entering the full portal."
      />
      <section className="wizard-shell panel">
        <span className="eyebrow">First-time family setup</span>
        <h2>Family profile</h2>
        <p className="wizard-lead">
          The parent/guardian owns the Family account. Student records are the children added beneath
          it.
        </p>
        <FamilyOnboardingForm />
      </section>
      <Panel title="What unlocks next" eyebrow="After profile">
        <div className="onboarding-checklist">
          {["Confirm household contact", "Billing owner on file", "Add first student", "Choose a service"].map(
            (item) => (
              <div key={item}>
                <span>○</span>
                {item}
              </div>
            ),
          )}
        </div>
      </Panel>
    </>
  );
}
