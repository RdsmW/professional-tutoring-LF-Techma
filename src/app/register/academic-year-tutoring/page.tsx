import { PublicAyTutoringRegistrationForm } from "@/components/public-ay-tutoring-registration-form";
import { FORM_META } from "@/lib/forms";

export default function AcademicYearTutoringRegisterPage() {
  return (
    <main className="public-ay">
      <PublicAyTutoringRegistrationForm title={FORM_META.academic_year_tutoring.title} />
    </main>
  );
}
