import { Suspense } from "react";
import { PageIntro } from "@/components/ui";
import { BookTutoringWizard } from "@/components/book-tutoring-wizard";

export default function FamilyBookTutoringPage() {
  return (
    <>
      <PageIntro title="Book Tutoring" />
      <Suspense fallback={<div className="panel">Loading booking wizard…</div>}>
        <BookTutoringWizard />
      </Suspense>
    </>
  );
}
