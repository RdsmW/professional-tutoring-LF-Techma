import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { BookTutoringWizard } from "@/components/book-tutoring-wizard";

export default function FamilyBookTutoringPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Book Tutoring"
        title="Book Tutoring"
        description="Academic-Year or Summer tutoring. Parents choose from suitable and available tutors — Best Fit is staff-only assist."
      />
      <Suspense fallback={<div className="panel">Loading booking wizard…</div>}>
        <BookTutoringWizard />
      </Suspense>
    </>
  );
}
