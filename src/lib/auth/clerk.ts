import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

type ClerkPublicMetadata = {
  role?: string;
};

type SessionClaims = {
  metadata?: ClerkPublicMetadata;
  publicMetadata?: ClerkPublicMetadata;
  public_metadata?: ClerkPublicMetadata;
  email?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
};

/** Never throw on Clerk Backend API blips — layouts must still render. */
export async function safeCurrentUser(): Promise<User | null> {
  try {
    return await currentUser();
  } catch (error) {
    console.warn("[clerk] currentUser soft-fail", error);
    return null;
  }
}

function roleFromClaims(claims: SessionClaims | null | undefined): string | undefined {
  return claims?.metadata?.role ?? claims?.publicMetadata?.role ?? claims?.public_metadata?.role;
}

export async function resolveAppRoleSafe(): Promise<"staff" | "family"> {
  try {
    const session = await auth();
    const claims = session.sessionClaims as SessionClaims | null | undefined;
    if (roleFromClaims(claims) === "staff") return "staff";

    const user = await safeCurrentUser();
    const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
    if (metadataRole === "staff") return "staff";
  } catch (error) {
    console.warn("[clerk] resolveAppRole soft-fail", error);
  }
  return "family";
}

export async function resolveDisplayName(fallback: string): Promise<string> {
  const user = await safeCurrentUser();
  const fromUser =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;

  if (fromUser) return fromUser;

  try {
    const session = await auth();
    const claims = session.sessionClaims as SessionClaims | null | undefined;
    const fromClaims =
      [claims?.firstName ?? claims?.first_name, claims?.lastName ?? claims?.last_name]
        .filter(Boolean)
        .join(" ") || claims?.email;
    if (fromClaims) return fromClaims;
  } catch {
    // ignore
  }

  return fallback;
}
