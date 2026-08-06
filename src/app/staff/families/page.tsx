import { ComingStageNote, PageIntro, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { households, students } from "@/lib/db/schema";

export default async function StaffFamiliesPage() {
  const rows = db ? await db.select().from(households) : [];
  const studentRows = db ? await db.select().from(students) : [];

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Families"
        title="Families"
        description="Each Family account is owned by a parent/guardian. Students are children under the household. There is no Leads module here."
      />
      <Panel title="Household directory" eyebrow="Live database">
        {rows.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No households yet — or DATABASE_URL is not connected.</p>
        ) : (
          <div className="table-panel">
            {rows.map((row) => {
              const kids = studentRows.filter((student) => student.householdId === row.id);
              return (
                <button key={row.id} className="family-row" type="button">
                  <span className="avatar" style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--blue-soft)", color: "var(--blue)", display: "grid", placeItems: "center", fontWeight: 800 }}>
                    {row.displayName.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{row.displayName}</strong>
                    <small>
                      {row.status} · {kids.length} student{kids.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <span className="pill">{row.status}</span>
                  <b>Detail →</b>
                </button>
              );
            })}
          </div>
        )}
        <ComingStageNote feature="Family Detail, New Family wizard, guardian invites, and status override" />
      </Panel>
    </>
  );
}
