import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { EnrollCoursesWizard } from "@/components/enroll-courses-wizard";

export default function FamilyEnrollCoursesPage() {
  return (
    <>
      <PageIntro title="Enroll in Courses" />
      <Suspense fallback={<div className="panel">Loading enrollment wizard…</div>}>
        <EnrollCoursesWizard />
      </Suspense>
    </>
  );
}
