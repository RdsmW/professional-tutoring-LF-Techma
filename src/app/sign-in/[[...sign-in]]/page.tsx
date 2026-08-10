import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--canvas)",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 24, color: "var(--navy)" }}>
          <span className="brand-mark" style={{ color: "var(--navy)", borderColor: "var(--line)" }}>
            PT
          </span>
          <span>
            <strong style={{ color: "var(--ink)" }}>Professional Tutoring</strong>
            <small>Sign in with your email and password below</small>
          </span>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/post-login"
          forceRedirectUrl="/post-login"
        />
        <p style={{ marginTop: 18, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
          After sign-in you go to Staff or Family based on your Clerk role.
          Staff users need public metadata <code>{`{ "role": "staff" }`}</code>.
        </p>
      </div>
    </main>
  );
}
