"use client";

import Image from "next/image";
import Link from "next/link";
import { PT_Sans } from "next/font/google";
import { AUTH_BRAND_STATS, AuthStatIcon } from "@/components/auth-brand-stats";
import "./staff-design-preview-login.css";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const HEADLINE = "Northern Virginia’s trusted tutoring since 1994";
const COMPACT_STATS = AUTH_BRAND_STATS.slice(0, 4);

function Lockup() {
  return (
    <div className="auth-brand-lockup login-preview-lockup" title="Professional Tutoring, LLC">
      <Image
        src="/brand/professional-tutoring-logo.png"
        alt=""
        width={48}
        height={48}
        className="auth-brand-mark"
      />
      <strong className="auth-brand-wordmark">
        rofessional
        <br />
        Tutoring, LLC
      </strong>
    </div>
  );
}

function StatList({
  items,
  className,
}: {
  items: typeof AUTH_BRAND_STATS;
  className?: string;
}) {
  return (
    <ul className={`auth-brand-stats ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <li key={item.label}>
          <span className="auth-brand-stat-icon">
            <AuthStatIcon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function WhyUs({ slogans }: { slogans?: boolean }) {
  return (
    <details className="login-preview-why">
      <summary>Why us</summary>
      <div className="login-preview-why-body">
        <StatList items={AUTH_BRAND_STATS} className="login-preview-stats" />
        {slogans ? (
          <>
            <p className="auth-brand-close">
              Competence Builds Confidence. Skills today. Success tomorrow.
            </p>
            <p className="auth-brand-close">With us, prepare your students for college and beyond</p>
          </>
        ) : null}
      </div>
    </details>
  );
}

function ClerkPlaceholder() {
  return (
    <section className="auth-form" aria-label="Sign-in placeholder">
      <div className="auth-form-inner">
        <div className="login-preview-clerk">Sign-in (Clerk)</div>
      </div>
    </section>
  );
}

function Sheet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={`auth-shell login-preview-sheet ${ptSans.className}`} aria-label={label}>
      <section className="auth-brand" aria-label="Professional Tutoring brand sample">
        <div className="auth-brand-inner">{children}</div>
      </section>
      <ClerkPlaceholder />
    </div>
  );
}

export function StaffDesignPreviewLoginClient() {
  return (
    <>
      <section className="view-intro page-header-band">
        <div className="page-header-copy">
          <span className="eyebrow">Design preview</span>
          <h1>Login sheet</h1>
          <p>Sample only · pick a left-panel layout · live sign-in is unchanged</p>
        </div>
        <div className="page-header-action design-preview-header-links">
          <Link href="/staff/design-preview/sessions" className="secondary-button">
            Sessions mock →
          </Link>
        </div>
      </section>

      <p className="design-preview-note">
        Full-height navy sheet mockups. Same navy, Georgia, and logo as sign-in.{" "}
        <Link href="/staff/settings">Back to Settings</Link>
        {" · "}
        <Link href="/sign-in">Live sign-in</Link>
      </p>

      <div className="login-preview-gallery">
        <article className="login-preview-option">
          <h2>Option A — sample only</h2>
          <p>Tight identity, four proof lines, headline at the bottom of the sheet.</p>
          <Sheet label="Option A login sample">
            <Lockup />
            <div className="login-preview-middle">
              <StatList items={COMPACT_STATS} className="login-preview-stats" />
            </div>
            <h3 className="login-preview-headline">{HEADLINE}</h3>
            <p className="auth-brand-footer">© 2026 Professional Tutoring, LLC</p>
          </Sheet>
        </article>

        <article className="login-preview-option">
          <h2>Option B — sample only</h2>
          <p>Quiet sheet. Open Why us for the full list and slogans.</p>
          <Sheet label="Option B login sample">
            <Lockup />
            <div className="login-preview-middle is-end">
              <WhyUs slogans />
            </div>
            <h3 className="login-preview-headline">{HEADLINE}</h3>
            <p className="auth-brand-footer">© 2026 Professional Tutoring, LLC</p>
          </Sheet>
        </article>

        <article className="login-preview-option">
          <h2>Option C — sample only</h2>
          <p>One proof line on the sheet. Stats stay inside Why us.</p>
          <Sheet label="Option C login sample">
            <Lockup />
            <div className="login-preview-middle is-end">
              <p className="login-preview-proof">SAT &amp; ACT since 1994</p>
              <WhyUs />
            </div>
            <h3 className="login-preview-headline">{HEADLINE}</h3>
            <p className="auth-brand-footer">© 2026 Professional Tutoring, LLC</p>
          </Sheet>
        </article>
      </div>
    </>
  );
}
