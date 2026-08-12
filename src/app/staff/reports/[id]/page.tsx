import { notFound } from "next/navigation";
import { StaffReportDetailClient } from "@/components/staff-report-detail-client";
import { isReportId } from "@/lib/reports/types";

export default async function StaffReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isReportId(id)) notFound();
  return <StaffReportDetailClient reportId={id} />;
}
