import Image from "next/image";
import { PT_Sans } from "next/font/google";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`auth-shell ${ptSans.className}`}>
      <section className="auth-brand" aria-label="Professional Tutoring brand">
        <div className="auth-brand-inner">
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
          <p className="auth-brand-support">Competence Builds Confidence</p>
        </div>
      </section>
      <section className="auth-form" aria-label={title}>
        <div className="auth-form-inner">
          <h2 className="auth-form-title">{title}</h2>
          {children}
        </div>
      </section>
    </main>
  );
}
