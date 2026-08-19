import { StaffEnrollmentDetailClient } from "@/components/staff-enrollment-detail-client";

export default async function StaffFamilyEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string; enrollmentId: string }>;
}) {
  const { id, enrollmentId } = await params;
  return <StaffEnrollmentDetailClient familyId={id} enrollmentId={enrollmentId} />;
}
