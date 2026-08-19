import { Suspense } from "react";
import { StaffSessionsClient } from "@/components/staff-sessions-client";

export default function StaffSessionsPage() {
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading sessions…</p>}>
      <StaffSessionsClient />
    </Suspense>
  );
}
