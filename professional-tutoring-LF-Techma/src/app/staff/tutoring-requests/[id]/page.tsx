import { StaffTutoringRequestAssignClient } from "@/components/staff-tutoring-request-assign-client";

export default async function StaffTutoringRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffTutoringRequestAssignClient requestId={id} />;
}
