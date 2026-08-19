import { Suspense } from "react";
import { StaffGuardiansClient } from "@/components/staff-guardians-client";

export default function StaffGuardiansPage() {
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading guardians…</p>}>
      <StaffGuardiansClient />
    </Suspense>
  );
}
