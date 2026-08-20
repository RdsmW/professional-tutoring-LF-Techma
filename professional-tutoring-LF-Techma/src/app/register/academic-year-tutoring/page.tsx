import { PublicAyTutoringRegistrationForm } from "@/components/public-ay-tutoring-registration-form";
import { FORM_META } from "@/lib/forms";
import { getPublishedPublicForm, issuePublicFormVersionToken } from "@/lib/staff/public-forms";

export const dynamic = "force-dynamic";

export default async function AcademicYearTutoringRegisterPage() {
  const form = await getPublishedPublicForm("academic_year_tutoring");
  const versionToken = issuePublicFormVersionToken("academic_year_tutoring", form.versionId);
  return (
    <main className="public-ay">
      <PublicAyTutoringRegistrationForm
        title={FORM_META.academic_year_tutoring.title}
        formContent={form.content}
        formVersionToken={versionToken}
      />
    </main>
  );
}
