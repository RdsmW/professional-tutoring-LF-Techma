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
      <div style={{ textAlign: "center" }}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 24, color: "var(--navy)" }}>
          <span className="brand-mark" style={{ color: "var(--navy)", borderColor: "var(--line)" }}>
            PT
          </span>
          <span>
            <strong style={{ color: "var(--ink)" }}>Professional Tutoring</strong>
            <small>Sign in to Staff Operations or the Family Portal</small>
          </span>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </main>
  );
}
