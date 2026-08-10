import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { EnrollCoursesWizard } from "@/components/enroll-courses-wizard";

export default function FamilyEnrollCoursesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Enroll in Courses"
        title="Enroll in Courses"
        description="Fixed SAT/ACT cohorts with course-specific enrollment and billing. No tutor matching for courses."
      />
      <Suspense fallback={<div className="panel">Loading enrollment wizard…</div>}>
        <EnrollCoursesWizard />
      </Suspense>
    </>
  );
}
