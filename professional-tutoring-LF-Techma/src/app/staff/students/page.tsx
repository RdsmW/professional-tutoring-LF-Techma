import { Suspense } from "react";
import { StaffStudentsClient } from "@/components/staff-students-client";

export default function StaffStudentsPage() {
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading students…</p>}>
      <StaffStudentsClient />
    </Suspense>
  );
}
