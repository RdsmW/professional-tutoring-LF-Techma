import Link from "next/link";
import { ComingStageNote, MetricGrid, PageIntro, Panel } from "@/components/ui";
import { FAMILY_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { courseOfferings, households, students, tutors } from "@/lib/db/schema";

async function loadDashboardCounts() {
  if (!db) {
    return {
      families: 1,
      students: 1,
      tutors: 1,
      courses: 3,
      familyNames: ["Ross Family"],
      studentNames: ["Maya Lawson · Westfield High School"],
      courseNames: ["SAT/ACT First Class", "The Express", "Summer Master Class"],
      tutorNames: ["Alex Tutor"],
    };
  }

  const [familyRows, studentRows, tutorRows, courseRows] = await Promise.all([
    db.select().from(households),
    db.select().from(students),
    db.select().from(tutors),
    db.select().from(courseOfferings),
  ]);

  return {
    families: familyRows.length,
    students: studentRows.length,
    tutors: tutorRows.length,
    courses: courseRows.length,
    familyNames: familyRows.map((row) => `${row.displayName} · ${row.status}`),
    studentNames: studentRows.map((row) => `${row.displayName} · ${row.schoolName ?? "School pending"}`),
    courseNames: courseRows.map((row) => row.name),
    tutorNames: tutorRows.map((row) => row.displayName),
  };
}

export default async function StaffDashboardPage() {
  const counts = await loadDashboardCounts();

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Dashboard"
        title="Direct service onboarding"
        description="Submitted Professional Tutoring service forms create Family and Student records here. General inquiries remain in Zoho CRM — this app has no Leads module."
      />

      <section className="flow-rail" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["Form submitted", "Family + student", "Match / course", "Booking / roster", "Billing", "Service active"].map(
          (label) => (
            <span
              key={label}
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                padding: "8px 10px",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {label}
            </span>
          ),
        )}
      </section>

      <MetricGrid
        items={[
          { label: "Families", value: String(counts.families), detail: "Household records in database" },
          { label: "Students", value: String(counts.students), detail: "Children under family accounts" },
          { label: "Tutors", value: String(counts.tutors), detail: "Staff-managed tutor directory" },
          { label: "Courses", value: String(counts.courses), detail: "SAT/ACT offerings" },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
        <Panel title="Families in workspace" eyebrow="Live database">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {counts.familyNames.map((name) => (
              <li key={name} style={{ marginBottom: 8, fontSize: 12 }}>
                {name}
              </li>
            ))}
          </ul>
          <Link href="/staff/families" className="text-button" style={{ display: "inline-block", marginTop: 12, color: "var(--blue)", fontWeight: 800, fontSize: 10 }}>
            Open Families →
          </Link>
        </Panel>
        <Panel title="Family status roll-up" eyebrow="Mockup rule">
          <div className="family-status-key">
            {FAMILY_STATUS_LABELS.map((label) => (
              <div key={label}>
                <span className="pill">{label}</span>
                <span>Display labels from the approved mockup. Stage 2 expands DB statuses to match.</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="System boundaries" eyebrow="Do not change in Stage 1">
        <p style={{ marginTop: 0, fontSize: 12, color: "var(--muted)" }}>
          Zoho owns inquiries. Acuity owns calendar reminders later. Stripe owns card data. QuickBooks owns the ledger.
          This app owns bookings, capacity, and workflow — with an integration outbox in later stages.
        </p>
        <ComingStageNote feature="Full booking, enrollment, attendance, billing actions, and reports" />
      </Panel>
    </>
  );
}
