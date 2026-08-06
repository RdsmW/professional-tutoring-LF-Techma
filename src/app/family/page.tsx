import Link from "next/link";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

export default function FamilyHomePage() {
  return (
    <>
      <section className="family-hero">
        <div>
          <span className="eyebrow">Family Portal</span>
          <h1 style={{ margin: "6px 0 10px", font: "700 32px/1.15 Georgia, serif" }}>Welcome home</h1>
          <p>
            Parent = Family account. Add students, then choose Book Tutoring or Enroll in Courses. General inquiries stay in
            Zoho — this portal is for registered service journeys.
          </p>
          <div className="hero-actions" style={{ marginTop: 16 }}>
            <Link href="/family/book-tutoring" className="primary-button family-primary" style={{ textDecoration: "none", display: "inline-block", padding: "10px 14px", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 11 }}>
              Book Tutoring
            </Link>
            <Link href="/family/enroll-courses" className="secondary-button" style={{ textDecoration: "none", display: "inline-block", padding: "10px 14px", border: "1px solid var(--line)", fontWeight: 800, fontSize: 11 }}>
              Enroll in Courses
            </Link>
          </div>
        </div>
      </section>

      <PageIntro
        eyebrow="Onboarding sequence"
        title="Your family journey"
        description="Create Family account → complete profile → full portal → add Student(s) → choose a service."
      />

      <section className="service-decision">
        <article>
          <span className="service-number">1</span>
          <div>
            <h3>Book Tutoring</h3>
            <p>Scheduled individual tutoring for Academic-Year or Summer terms.</p>
          </div>
          <Link href="/family/book-tutoring">Start →</Link>
        </article>
        <article>
          <span className="service-number">2</span>
          <div>
            <h3>Enroll in Courses</h3>
            <p>First Class, The Express, or Summer Master Class cohorts.</p>
          </div>
          <Link href="/family/enroll-courses">Start →</Link>
        </article>
      </section>

      <Panel title="Students" eyebrow="Family dashboard">
        <div className="add-student-card">
          <div>
            <h3>Add a student</h3>
            <p>Available from Home, Students, and Profile — same as the mockup.</p>
          </div>
          <div className="field-cloud">
            <span>School lookup</span>
            <span>Grade / grad year</span>
            <span>Restricted fields protected</span>
          </div>
          <Link href="/family/students" className="primary-button family-primary" style={{ textDecoration: "none", padding: "10px 14px", background: "var(--coral)", color: "#fff", fontWeight: 800, fontSize: 11 }}>
            Go to Students
          </Link>
        </div>
        <ComingStageNote feature="Live student cards, schedule, and service history on Home" />
      </Panel>
    </>
  );
}
