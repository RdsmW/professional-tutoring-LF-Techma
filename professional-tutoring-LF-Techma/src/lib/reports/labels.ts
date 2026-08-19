import type { ServiceFilter } from "@/lib/reports/types";

export function serviceFilterLabel(service: ServiceFilter) {
  if (service === "all") return "All services";
  if (service === "tutoring") return "Tutoring only";
  if (service === "courses") return "Courses only";
  return "Exceptions only";
}
