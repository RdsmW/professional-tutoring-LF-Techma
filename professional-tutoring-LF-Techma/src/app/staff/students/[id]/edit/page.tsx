import { StaffStudentEditClient } from "@/components/staff-student-edit-client";

export default async function StaffStudentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffStudentEditClient studentId={id} />;
}
