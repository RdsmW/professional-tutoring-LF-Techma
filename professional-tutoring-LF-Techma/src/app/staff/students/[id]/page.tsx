import { StaffStudentDetailClient } from "@/components/staff-student-detail-client";

export default async function StaffStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffStudentDetailClient studentId={id} />;
}
