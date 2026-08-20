"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

function invitationReturnPath(value: string | null) {
  return value?.startsWith("/invite/") ? value : "/post-login";
}

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = invitationReturnPath(searchParams.get("redirect_url"));
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthShell formLabel="Create account">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        forceRedirectUrl={redirectUrl}
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
