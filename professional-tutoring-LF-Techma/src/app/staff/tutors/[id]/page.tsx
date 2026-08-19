import { StaffTutorDetailClient } from "@/components/staff-tutor-detail-client";

export default async function StaffTutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffTutorDetailClient tutorId={id} />;
}
