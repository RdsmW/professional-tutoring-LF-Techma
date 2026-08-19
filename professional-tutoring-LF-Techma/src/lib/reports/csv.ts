import type { ReportResult } from "@/lib/reports/types";

function csvEscape(value: string | number | boolean | null | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function reportToCsv(report: ReportResult) {
  const headers = ["name", "detail", "service", "period", "group", "value", "href", "id"];
  const lines = [
    headers.map(csvEscape).join(","),
    ...report.rows.map((row) =>
      [row.name, row.detail, row.service, row.period, row.group, row.value, row.href, row.id]
        .map(csvEscape)
        .join(","),
    ),
  ];
  return lines.join("\n");
}
