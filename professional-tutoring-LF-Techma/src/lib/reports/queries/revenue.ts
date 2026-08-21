import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, paymentRecords } from "@/lib/db/schema";
import { amountLabel } from "@/lib/billing";
import { isInstantInRange, periodLabelForInstant, type YmdRange } from "@/lib/reports/date-range";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { serviceFilterLabel } from "@/lib/reports/labels";
import {
  applyServiceFilter,
  groupRows,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
  type ServiceLabel,
} from "@/lib/reports/types";

export async function queryRevenueReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  const database = requireDb();
  const paymentRows = await database
    .select({
      payment: paymentRecords,
      householdName: households.displayName,
    })
    .from(paymentRecords)
    .innerJoin(households, eq(paymentRecords.householdId, households.id));

  const assembled: ReportRow[] = [];
  for (const { payment, householdName } of paymentRows) {
    const activityAt = payment.paidAt ?? payment.createdAt;
    if (!isInstantInRange(activityAt, range)) continue;
    assembled.push({
      id: payment.id,
      name: householdName,
      detail: `${statusGroup(payment.status)} · processor not posted · QBO not posted`,
      service: serviceForPayment(payment.relatedEntityType, payment.status),
      period: periodLabelForInstant(activityAt, range),
      group: statusGroup(payment.status),
      value: amountLabel(payment.amountCents, payment.currency),
      href: `/staff/families/${payment.householdId}`,
    });
  }

  const rows = applyServiceFilter(assembled, filters.service);
  const amountSum = rows.reduce((sum, row) => {
    const cents = Number(row.value.replace(/[^0-9.-]/g, ""));
    return sum + (Number.isFinite(cents) ? cents : 0);
  }, 0);

  return {
    ...REPORT_DEFINITIONS.revenue,
    metrics: [
      { label: "Filtered result count", value: String(rows.length), detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      { label: "Listed amount", value: `$${amountSum.toFixed(2)}`, detail: "From visible rows · not a processor total" },
    ],
    groups: groupRows(rows),
    rows,
  };
}

function statusGroup(status: string) {
  if (status === "paid") return "Paid / matched";
  if (status === "refunded" || status === "failed" || status === "waived") return "Exceptions";
  return "Invoiced";
}

function serviceForPayment(relatedEntityType: string | null, status: string): ServiceLabel {
  if (status === "refunded" || status === "failed" || status === "waived") return "Exceptions";
  if (relatedEntityType === "course_enrollment") return "Courses";
  return "Tutoring";
}
