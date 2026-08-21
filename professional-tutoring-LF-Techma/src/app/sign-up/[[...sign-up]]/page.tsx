"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import {
  invitationAuthReturnTarget,
  invitationAuthUrls,
  invitationReturnPath,
} from "@/lib/auth/invitation-return-path";
import { authClerkAppearance } from "@/lib/ui/clerk-appearance";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const returnPath = invitationReturnPath(searchParams.get("redirect_url"));
  const redirectUrl = invitationAuthReturnTarget(
    returnPath,
    typeof window === "undefined" ? undefined : window.location.origin,
  );
  const { signInUrl } = invitationAuthUrls(redirectUrl);

  return (
    <AuthShell formLabel="Create account">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        appearance={authClerkAppearance()}
      />
    </AuthShell>
  );
}
