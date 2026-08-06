import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyProfilePage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Profile"
        title="Profile"
        description="Guardian contact and preferences for the signed-in adult. Credentials are never shared between guardians."
      />
      <div className="profile-layout">
        <Panel title="Household profile" eyebrow="Stage 1 shell">
          <p style={{ color: "var(--muted)", fontSize: 12 }}>
            Stage 2 adds editable guardian fields, Add Student from Profile, and staff-review for restricted changes.
          </p>
          <ComingStageNote feature="Profile edit, Account & Security, and audit history" />
        </Panel>
        <Panel title="Account & Security" eyebrow="Clerk-backed">
          <p style={{ color: "var(--muted)", fontSize: 12 }}>
            Sign-in email and password are managed by Clerk. Use the account button in the sidebar.
          </p>
        </Panel>
      </div>
    </>
  );
}
