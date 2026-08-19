import { StaffFamilyEditClient } from "@/components/staff-family-edit-client";

export default async function StaffFamilyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffFamilyEditClient familyId={id} />;
}
