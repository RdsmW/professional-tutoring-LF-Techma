import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";

async function loadFamilyHomeContext() {
  if (!db) return { pending: false, householdName: null as string | null };

  try {
    const session = await auth();
    if (!session.userId) return { pending: false, householdName: null };

    const [guardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.clerkUserId, session.userId))
      .limit(1);

    if (!guardian) return { pending: false, householdName: null };

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, guardian.householdId))
      .limit(1);

    return {
      pending: household?.status === "pending",
      householdName: household?.displayName ?? null,
    };
  } catch {
    return { pending: false, householdName: null };
  }
}

export default async function FamilyHomePage() {
  const context = await loadFamilyHomeContext();

  return (
    <>
      <section className="family-hero">
        <div>
          <span className="eyebrow">Family Portal</span>
          <h1 style={{ margin: "6px 0 10px", font: "700 32px/1.15 Georgia, serif" }}>
            {context.householdName ? `Welcome, ${context.householdName}` : "Welcome home"}
          </h1>
          <p>
            Parent = Family account. Add students, then choose Book Tutoring or Enroll in Courses.
            General inquiries stay in Zoho — this portal is for registered service journeys.
          </p>
          <div className="hero-actions" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {context.pending ? (
              <Link
                href="/family/onboarding"
                className="primary-button family-primary"
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "10px 14px",
                  background: "var(--coral)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                Complete onboarding
              </Link>
            ) : null}
            <Link
              href="/family/book-tutoring"
              className="primary-button family-primary"
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "10px 14px",
                background: "var(--coral)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              Book Tutoring
            </Link>
            <Link
              href="/family/enroll-courses"
              className="secondary-button"
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "10px 14px",
                border: "1px solid var(--line)",
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              Enroll in Courses
            </Link>
          </div>
        </div>
      </section>

      {context.pending ? (
        <section className="recommendation-banner" style={{ marginBottom: 16 }}>
          <span>i</span>
          <div>
            <strong>Onboarding still pending</strong>
            <p>
              Finish your family profile so staff can place students and unlock the full portal journey.
            </p>
          </div>
        </section>
      ) : null}

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
            href="/family/students"
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
