import Link from "next/link";
import { FamilyHomeHero } from "@/components/family-home-hero";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

/** Fast first paint: no Clerk Backend or DB awaits on this page. */
export default function FamilyHomePage() {
  return (
    <>
      <FamilyHomeHero />

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
            Go to Students
          </Link>
        </div>
        <ComingStageNote feature="Live student cards, schedule, and service history on Home" />
      </Panel>
    </>
  );
}
