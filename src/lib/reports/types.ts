export const REPORT_IDS = [
  "active",
  "tutors",
  "attendance",
  "courses",
  "waitlist",
  "revenue",
  "school",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export const DATE_FILTERS = ["all", "week", "month", "term"] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const SERVICE_FILTERS = ["all", "tutoring", "courses", "exceptions"] as const;
export type ServiceFilter = (typeof SERVICE_FILTERS)[number];

export const SERVICE_LABELS = {
  tutoring: "Tutoring",
  courses: "Courses",
  exceptions: "Exceptions",
} as const;

export type ServiceLabel = (typeof SERVICE_LABELS)[keyof typeof SERVICE_LABELS];

export type ReportFilters = {
  date: DateFilter;
  service: ServiceFilter;
};

export type ReportRow = {
  id: string;
  name: string;
  detail: string;
  service: ServiceLabel;
  period: string;
  group: string;
  value: string;
  href: string;
};

export type ReportGroup = {
  name: string;
  count: number;
};

export type ReportMetric = {
  label: string;
  value: string;
  detail: string;
};

export type ReportDefinition = {
  id: ReportId;
  name: string;
  summary: string;
  columns: string;
};

export type ReportResult = ReportDefinition & {
  metrics: ReportMetric[];
  groups: ReportGroup[];
  rows: ReportRow[];
};

export type ReportCatalogItem = ReportDefinition & {
  count?: number | null;
};

export function isReportId(value: string): value is ReportId {
  return (REPORT_IDS as readonly string[]).includes(value);
}

export function isDateFilter(value: string): value is DateFilter {
  return (DATE_FILTERS as readonly string[]).includes(value);
}

export function isServiceFilter(value: string): value is ServiceFilter {
  return (SERVICE_FILTERS as readonly string[]).includes(value);
}

export function groupRows(rows: ReportRow[]): ReportGroup[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.group, (counts.get(row.group) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export function applyServiceFilter(rows: ReportRow[], service: ServiceFilter): ReportRow[] {
  if (service === "all") return rows;
  const label = SERVICE_LABELS[service];
  return rows.filter((row) => row.service === label);
}
