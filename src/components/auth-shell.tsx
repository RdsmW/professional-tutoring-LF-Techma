import Image from "next/image";
import { PT_Sans } from "next/font/google";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const BRAND_STATS = [
  "4,000 tutoring spots per year",
  "72% of our College Coaching students attend Top 10 ranked universities",
  "31 years of teaching SAT and ACT Preparation",
  "7 Caring and very qualified tutors",
  "100% Grade school admissions rate",
  "Impressive score improvements: 150-250 points and more for SAT & 5 points and often more for ACT",
] as const;

export function AuthShell({
  formLabel,
  children,
}: {
  formLabel: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`auth-shell ${ptSans.className}`}>
      <section className="auth-brand" aria-label="Professional Tutoring brand">
        <div className="auth-brand-inner">
          <div className="auth-brand-main">
            <Image
              src="/brand/julia-ross-pt-logo-white.svg"
              alt="Professional Tutoring, LLC"
              width={220}
              height={62}
              className="auth-brand-logo"
              priority
              unoptimized
            />
            <h1 className="auth-brand-headline">
              Northern Virginia’s Trusted Tutoring Center Since 1994
            </h1>
            <p className="auth-brand-lead">
              Elite academic coaching that gives students the tools, confidence, and competitive
              edge to thrive in school and impress top-tier universities.
            </p>
            <ul className="auth-brand-stats">
              {BRAND_STATS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="auth-brand-close">
              Competence Builds Confidence. Skills today. Success tomorrow.
            </p>
            <p className="auth-brand-close">With us, prepare your students for college and beyond</p>
          </div>
          <p className="auth-brand-footer">© 2026 Professional Tutoring, LLC</p>
        </div>
      </section>
      <section className="auth-form" aria-label={formLabel}>
        <div className="auth-form-inner">
          <div className="auth-form-card">{children}</div>
        </div>
      </section>
    </main>
  );
}
