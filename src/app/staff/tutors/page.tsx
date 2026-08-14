import { Suspense } from "react";
import { StaffTutorsClient } from "@/components/staff-tutors-client";

export default function StaffTutorsPage() {
  return (
    <Suspense fallback={<p className="dashboard-empty">Loading tutors…</p>}>
      <StaffTutorsClient />
    </Suspense>
  );
}
