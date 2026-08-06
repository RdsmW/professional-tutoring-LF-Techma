import { ComingStageNote, PageIntro, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { tutors } from "@/lib/db/schema";

export default async function StaffTutorsPage() {
  const rows = db ? await db.select().from(tutors) : [];

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Tutors"
        title="Tutor directory"
        description="Operational tutor records with capacity and coverage. Best Fit is a staff assist later — parent choice remains final in booking."
      />
      <Panel title="Active tutors" eyebrow="Live database">
        {rows.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No tutors yet — or DATABASE_URL is not connected.</p>
        ) : (
          <div className="tutor-directory">
            <div className="tutor-directory-head">
              <span>Tutor</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Capacity</span>
              <span>Status</span>
            </div>
            {rows.map((row) => (
              <button key={row.id} className="tutor-directory-row" type="button">
                <span>
                  <strong>{row.displayName}</strong>
                  <small>Staff-managed profile</small>
                </span>
                <span>{row.email ?? "—"}</span>
                <span>{row.phone ?? "—"}</span>
                <span>{row.maxSeatsPerSlot} seat(s)/slot</span>
                <span>{row.active ? "Active" : "Inactive"}</span>
              </button>
            ))}
          </div>
        )}
        <ComingStageNote feature="Tutor Detail, Add Tutor, workload %, and archive safeguards" />
      </Panel>
    </>
  );
}
