import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { households, paymentRecords, students } from "@/lib/db/schema";
import { listTutoringAssignmentQueue } from "@/lib/staff/tutoring-assignment-queue";
import { PageIntro } from "@/components/ui";

type QueueFilter = "all" | "assignments" | "payments";

type PriorityQueueItem = {
  id: string;
  kind: Exclude<QueueFilter, "all">;
  title: string;
  detail: string;
  action: string;
  href: string;
  createdAt: string;
};

function validFilter(value: string | undefined): QueueFilter {
  if (value === "assignments" || value === "payments") return value;
  return "all";
}

async function loadPriorityQueue() {
  const assignments = await listTutoringAssignmentQueue();
  const paymentRows = db
    ? await db
        .select({
          id: paymentRecords.id,
          amountCents: paymentRecords.amountCents,
          currency: paymentRecords.currency,
          createdAt: paymentRecords.createdAt,
          householdName: households.displayName,
          studentName: students.displayName,
        })
        .from(paymentRecords)
        .innerJoin(households, eq(paymentRecords.householdId, households.id))
        .leftJoin(students, eq(students.id, paymentRecords.relatedEntityId))
        .where(
          and(
            inArray(paymentRecords.status, ["unpaid", "pending", "failed", "partial"]),
          ),
        )
        .orderBy(desc(paymentRecords.createdAt))
    : [];

  return [
    ...assignments.map<PriorityQueueItem>((item) => ({
      id: item.id,
      kind: "assignments",
      title: item.studentName,
      detail: `${item.familyName} · ${item.subjectName}`,
      action: item.reason,
      href: `/staff/tutoring-requests/${item.id}`,
      createdAt: item.createdAt,
    })),
    ...paymentRows.map<PriorityQueueItem>((item) => ({
      id: item.id,
      kind: "payments",
      title: item.householdName || "Family",
      detail: item.studentName || "Payment needs attention",
      action: `${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: item.currency || "USD",
      }).format(item.amountCents / 100)}`,
      href: "/staff/billing",
      createdAt: item.createdAt.toISOString(),
    })),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

const filters: Array<{ id: QueueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "assignments", label: "New assignments" },
  { id: "payments", label: "Payment issues" },
];

export default async function StaffPriorityQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const filter = validFilter((await searchParams).filter);
  const rows = await loadPriorityQueue();
  const visibleRows = filter === "all" ? rows : rows.filter((row) => row.kind === filter);

  return (
    <>
      <PageIntro
        eyebrow="Needs attention"
        title="Priority Queue"
        description="Review new tutor assignments and payment issues from one focused queue."
        action={
          <Link href="/staff" className="text-button">
            Back to Dashboard
          </Link>
        }
      />
      <nav className="filter-row priority-queue-filters" aria-label="Priority queue filters">
        {filters.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/staff/priority-queue" : `/staff/priority-queue?filter=${item.id}`}
            className={`filter-chip ${filter === item.id ? "active" : ""}`}
            aria-current={filter === item.id ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <section className="panel priority-queue-panel">
        {visibleRows.length === 0 ? (
          <p className="dashboard-empty">No items match this filter.</p>
        ) : (
          <div className="attention-list priority-queue-list">
            {visibleRows.map((item) => (
              <Link key={`${item.kind}-${item.id}`} href={item.href} className="attention-row">
                <span className={`dashboard-priority-status dashboard-priority-status--${item.kind === "assignments" ? "assignment" : "payment"}`}>
                  {item.kind === "assignments" ? "New assignment" : "Payment issue"}
                </span>
                <span className="attention-row-name">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="attention-row-amount">{item.action}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}