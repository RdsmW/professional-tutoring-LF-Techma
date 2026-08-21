import { Suspense } from "react";
import { StaffFamilyMergesClient } from "@/components/staff-family-merges-client";

export default function StaffFamilyMergesPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--muted)", fontSize: 14 }}>Loading merge queue…</p>}>
      <StaffFamilyMergesClient />
    </Suspense>
  );
}
