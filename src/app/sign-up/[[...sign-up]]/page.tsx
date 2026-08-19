import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell formLabel="Create account">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/post-login"
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
