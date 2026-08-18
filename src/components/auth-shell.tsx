import Image from "next/image";
import { PT_Sans } from "next/font/google";
import { AUTH_BRAND_STATS, AuthStatIcon } from "@/components/auth-brand-stats";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

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
          <div className="auth-brand-lockup" title="Professional Tutoring, LLC">
            <Image
              src="/brand/professional-tutoring-logo.png"
              alt=""
              width={48}
              height={48}
              className="auth-brand-mark"
              priority
            />
            <strong className="auth-brand-wordmark">
              rofessional
              <br />
              Tutoring, LLC
            </strong>
          </div>
          <div className="auth-brand-main">
            <h1 className="auth-brand-headline">
              Northern Virginia’s Trusted Tutoring Center Since 1994
            </h1>
            <p className="auth-brand-lead">
              Elite academic coaching that gives students the tools, confidence, and competitive
              edge to thrive in school and impress top-tier universities.
            </p>
            <ul className="auth-brand-stats">
              {AUTH_BRAND_STATS.map((item) => (
                <li key={item.label}>
                  <span className="auth-brand-stat-icon">
                    <AuthStatIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </li>
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
