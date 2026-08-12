import {
  isDateFilter,
  isServiceFilter,
  type ReportFilters,
} from "@/lib/reports/types";

export function parseReportFilters(searchParams: URLSearchParams): ReportFilters | { error: string } {
  const dateRaw = (searchParams.get("date") ?? "all").trim();
  const serviceRaw = (searchParams.get("service") ?? "all").trim();
  if (!isDateFilter(dateRaw)) return { error: "Invalid date filter." };
  if (!isServiceFilter(serviceRaw)) return { error: "Invalid service filter." };
  return { date: dateRaw, service: serviceRaw };
}
