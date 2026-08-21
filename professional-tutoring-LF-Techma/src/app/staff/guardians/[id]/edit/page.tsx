import { StaffGuardianEditClient } from "@/components/staff-guardian-edit-client";

export default async function StaffGuardianEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffGuardianEditClient guardianId={id} />;
}
