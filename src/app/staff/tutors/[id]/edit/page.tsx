import { StaffTutorEditClient } from "@/components/staff-tutor-edit-client";

export default async function StaffTutorEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffTutorEditClient tutorId={id} />;
}
