import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell formLabel="Sign in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/post-login"
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
