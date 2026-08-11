import { StaffFamilyDetailClient } from "@/components/staff-family-detail-client";

export default async function StaffFamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffFamilyDetailClient familyId={id} />;
}
