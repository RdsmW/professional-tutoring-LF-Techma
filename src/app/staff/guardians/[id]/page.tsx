import { StaffGuardianDetailClient } from "@/components/staff-guardian-detail-client";

export default async function StaffGuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffGuardianDetailClient guardianId={id} />;
}
