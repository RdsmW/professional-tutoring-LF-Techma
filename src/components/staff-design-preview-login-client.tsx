import Link from "next/link";
import { PT_Sans } from "next/font/google";
import { AuthBrandPanel } from "@/components/auth-shell";
import "./staff-design-preview-login.css";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export function StaffDesignPreviewLoginClient() {
  return (
    <>
      <section className="view-intro page-header-band">
        <div className="page-header-copy">
          <span className="eyebrow">Design preview</span>
          <h1>Login sheet</h1>
          <p>Same left-panel layout as live sign-in</p>
        </div>
        <div className="page-header-action design-preview-header-links">
          <Link href="/staff/design-preview/sessions" className="secondary-button">
            Sessions mock →
          </Link>
        </div>
      </section>

      <p className="design-preview-note">
        Full-height navy sheet. Matches <Link href="/sign-in">live sign-in</Link>
        {" · "}
        <Link href="/staff/settings">Back to Settings</Link>
      </p>

      <div
        className={`auth-shell login-preview-sheet ${ptSans.className}`}
        aria-label="Login sample"
      >
        <AuthBrandPanel heading="h2" />
        <section className="auth-form" aria-label="Sign-in placeholder">
          <div className="auth-form-inner">
            <div className="login-preview-clerk">Sign-in (Clerk)</div>
          </div>
        </section>
      </div>
    </>
  );
}
