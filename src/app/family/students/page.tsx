import Link from "next/link";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyStudentsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Students"
        title="Students"
        description="Each student card will open Student Detail. Restricted education fields stay minimized and permissioned."
        action={
          <Link href="/family/students" className="primary-button family-primary" style={{ textDecoration: "none", padding: "10px 14px", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 11 }}>
            Add student
          </Link>
        }
      />
      <Panel title="Your students" eyebrow="Stage 1 shell">
        <div className="family-student-grid">
          <button type="button" className="add-student-tile">
            <span>+</span>
            <h3>Add student</h3>
            <p>Multi-step flow arrives in Stage 2</p>
          </button>
        </div>
        <ComingStageNote feature="Add Student wizard with review, confirmation, and Student Detail" />
      </Panel>
    </>
  );
}
