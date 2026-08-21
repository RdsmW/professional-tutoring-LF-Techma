import { Suspense } from "react";
import { StaffGuardianDetailClient } from "@/components/staff-guardian-detail-client";

export default async function StaffGuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading guardian…</p>}>
      <StaffGuardianDetailClient guardianId={id} />
    </Suspense>
  );
}
