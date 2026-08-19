import Link from "next/link";
import { listTutoringAssignmentQueue } from "@/lib/staff/tutoring-assignment-queue";
import { getStaffContext } from "@/lib/staff/session";

function ageLabel(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default async function StaffTutoringRequestsPage() {
  const context = await getStaffContext();
  const rows = context ? await listTutoringAssignmentQueue() : [];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Needs attention</span>
          <h3 className="staff-section-title">Tutor assignment</h3>
        </div>
      </div>
      <p className="dashboard-preview-note">
        Preferred times from families are not confirmed seats. Assign a tutor only when Professional Tutoring needs to
        choose a time.
      </p>
      {rows.length === 0 ? (
        <p className="dashboard-empty">Nothing needs a tutor assignment right now.</p>
      ) : (
        <div className="attention-list">
          {rows.map((row) => (
            <Link key={row.id} href={`/staff/tutoring-requests/${row.id}`} className="attention-row">
              <span className="attention-row-name">
                <strong>{row.studentName}</strong>
                <small>{row.familyName}</small>
              </span>
              <span className="attention-row-student">{row.subjectName}</span>
              <span className="attention-row-amount">{row.reason}</span>
              <small>{ageLabel(row.createdAt)}</small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
