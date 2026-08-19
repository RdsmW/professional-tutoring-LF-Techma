import { Suspense } from "react";
import { StaffFamilyDetailClient } from "@/components/staff-family-detail-client";

export default async function StaffFamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading family…</p>}>
      <StaffFamilyDetailClient familyId={id} />
    </Suspense>
  );
}
