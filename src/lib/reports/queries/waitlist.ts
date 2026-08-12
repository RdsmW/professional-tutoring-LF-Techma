import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { serviceFilterLabel } from "@/lib/reports/labels";
import type { ReportFilters, ReportResult } from "@/lib/reports/types";
import type { YmdRange } from "@/lib/reports/date-range";

/** Track 2 fills this query. Catalog can already list the definition. */
export async function queryWaitlistReport(
  filters: ReportFilters,
  range: YmdRange,
): Promise<ReportResult> {
  return {
    ...REPORT_DEFINITIONS.waitlist,
    metrics: [
      { label: "Filtered result count", value: "0", detail: "Matches visible rows" },
      { label: "Date range", value: range.label, detail: "Default is explicitly All dates" },
      { label: "Service", value: serviceFilterLabel(filters.service), detail: "Combined locally" },
      { label: "Result state", value: "Empty", detail: "Waitlist aging query ships next" },
    ],
    groups: [],
    rows: [],
  };
}
