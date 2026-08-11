import { Suspense } from "react";
import { FamilyCalendarClient } from "@/components/family-calendar-client";

export default function FamilyCalendarPage() {
  return (
    <Suspense fallback={<div className="panel">Loading calendar…</div>}>
      <FamilyCalendarClient />
    </Suspense>
  );
}
