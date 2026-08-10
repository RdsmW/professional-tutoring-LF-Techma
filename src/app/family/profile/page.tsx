import Link from "next/link";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyProfilePage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Profile"
        title="Profile"
        description="Guardian contact and preferences for the signed-in adult. Credentials are never shared between guardians."
        action={
          <Link
            href="/family/students?add=1"
            className="primary-button family-primary"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              background: "var(--coral)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 11,
            }}
          >
            + Add student
          </Link>
        }
      />
      <div className="profile-layout">
        <Panel title="Household profile" eyebrow="Family account">
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 0 }}>
            Use onboarding to update household contact details. Add children from Home, Students, or
            here.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link href="/family/onboarding" className="text-button" style={{ color: "var(--blue)", fontWeight: 800, fontSize: 10 }}>
              Open onboarding →
            </Link>
            <Link href="/family/students" className="text-button" style={{ color: "var(--blue)", fontWeight: 800, fontSize: 10 }}>
              Manage students →
            </Link>
          </div>
          <ComingStageNote feature="Profile edit, Account & Security history, and second-guardian invites" />
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
