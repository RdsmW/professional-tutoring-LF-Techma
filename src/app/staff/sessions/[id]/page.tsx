import { StaffSessionDetailClient } from "@/components/staff-session-detail-client";

export default async function StaffSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffSessionDetailClient sessionId={id} />;
}
