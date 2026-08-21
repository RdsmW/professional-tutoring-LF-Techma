"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import {
  invitationAuthReturnTarget,
  invitationAuthUrls,
  invitationReturnPath,
} from "@/lib/auth/invitation-return-path";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const returnPath = invitationReturnPath(searchParams.get("redirect_url"));
  const redirectUrl = invitationAuthReturnTarget(
    returnPath,
    typeof window === "undefined" ? undefined : window.location.origin,
  );
  const { signUpUrl } = invitationAuthUrls(redirectUrl);

  return (
    <AuthShell formLabel="Sign in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
