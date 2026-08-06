import { ComingStageNote, PageIntro, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";

export default async function StaffStudentsPage() {
  const rows = db ? await db.select().from(students) : [];

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Students"
        title="Students"
        description="School is a student attribute and reporting lookup — not a standalone Schools module."
      />
      <Panel title="Student directory" eyebrow="Live database">
        {rows.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No students yet — or DATABASE_URL is not connected.</p>
        ) : (
          <div className="student-grid">
            {rows.map((row) => (
              <article key={row.id} className="student-card">
                <div className="student-card-top">
                  <span className="pill">{row.lifecycle}</span>
                </div>
                <h3>{row.displayName}</h3>
                <p>{row.schoolName ?? "School pending"}</p>
                <div className="mini-fields">
                  <span>
                    <small>Grade</small>
                    <strong>{row.gradeLabel ?? "—"}</strong>
                  </span>
                  <span>
                    <small>Grad year</small>
                    <strong>{row.graduationYear ?? "—"}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
        <ComingStageNote feature="Student Detail, Best Fit assist, filters, and staff notes" />
      </Panel>
    </>
  );
}
