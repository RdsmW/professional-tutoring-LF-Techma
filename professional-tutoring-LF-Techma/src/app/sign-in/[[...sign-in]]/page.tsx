"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

function invitationReturnPath(value: string | null) {
  return value?.startsWith("/invite/") ? value : "/post-login";
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = invitationReturnPath(searchParams.get("redirect_url"));
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthShell formLabel="Sign in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
        forceRedirectUrl={redirectUrl}
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
