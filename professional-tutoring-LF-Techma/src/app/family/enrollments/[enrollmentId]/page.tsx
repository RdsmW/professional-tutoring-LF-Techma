import { FamilyEnrollmentDetailClient } from "@/components/family-enrollment-detail-client";

export default async function FamilyEnrollmentPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  return <FamilyEnrollmentDetailClient enrollmentId={enrollmentId} />;
}
