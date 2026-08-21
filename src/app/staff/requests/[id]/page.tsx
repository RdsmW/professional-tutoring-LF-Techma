import { StaffRequestReviewClient } from "@/components/staff-request-review-client";

export default async function StaffRequestReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffRequestReviewClient requestId={id} />;
}
