import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

export type AppRole = "staff" | "family";

type ClerkPublicMetadata = {
  role?: string;
};

type SessionClaims = {
  metadata?: ClerkPublicMetadata;
  publicMetadata?: ClerkPublicMetadata;
  public_metadata?: ClerkPublicMetadata;
  email?: string;
  email_address?: string;
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

function roleFromClaims(claims: SessionClaims | null | undefined): AppRole | null {
  const role = claims?.metadata?.role ?? claims?.publicMetadata?.role ?? claims?.public_metadata?.role;
  if (role === "staff") return "staff";
  if (role === "family") return "family";
  return null;
}

function nameFromClaims(claims: SessionClaims | null | undefined): string | null {
  if (!claims) return null;
  const named = [claims.firstName ?? claims.first_name, claims.lastName ?? claims.last_name]
    .filter(Boolean)
    .join(" ");
  return named || claims.email || claims.email_address || null;
}

function nameFromUser(user: User | null | undefined): string | null {
  if (!user) return null;
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    null
  );
}

async function readSession() {
  const session = await auth();
  const claims = session.sessionClaims as SessionClaims | null | undefined;
  return { session, claims };
}

/**
 * Fast family-shell gate: local JWT/`auth()` only — no Clerk Backend round-trip.
 * Staff role in JWT claims still redirects away. Bootstrap fills the real display name.
 */
export async function resolveFamilyPortalGate(fallbackName = "Family"): Promise<{
  userId: string | null;
  role: AppRole;
  displayName: string;
}> {
  const { session, claims } = await readSession();
  if (!session.userId) {
    return { userId: null, role: "family", displayName: fallbackName };
  }

  if (roleFromClaims(claims) === "staff") {
    return {
      userId: session.userId,
      role: "staff",
      displayName: nameFromClaims(claims) || fallbackName,
    };
  }

  return {
    userId: session.userId,
    role: "family",
    displayName: nameFromClaims(claims) || fallbackName,
  };
}

/**
 * Staff gate may need one Backend lookup when `role` is only in publicMetadata (not JWT).
 */
export async function resolveStaffPortalGate(fallbackName = "Staff"): Promise<{
  userId: string | null;
  role: AppRole;
  displayName: string;
}> {
  const { session, claims } = await readSession();
  if (!session.userId) {
    return { userId: null, role: "family", displayName: fallbackName };
  }

  const claimRole = roleFromClaims(claims);
  if (claimRole === "staff") {
    return {
      userId: session.userId,
      role: "staff",
      displayName: nameFromClaims(claims) || fallbackName,
    };
  }

  const user = await safeCurrentUser();
  const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
  if (metadataRole === "staff") {
    return {
      userId: session.userId,
      role: "staff",
      displayName: nameFromUser(user) || nameFromClaims(claims) || fallbackName,
    };
  }

  return {
    userId: session.userId,
    role: "family",
    displayName: nameFromUser(user) || nameFromClaims(claims) || fallbackName,
  };
}

/** Home/router: claims first, one Backend call only when role is missing from JWT. */
export async function resolvePortalIdentity(fallbackName: string): Promise<{
  userId: string | null;
  role: AppRole;
  displayName: string;
}> {
  const { session, claims } = await readSession();
  if (!session.userId) {
    return { userId: null, role: "family", displayName: fallbackName };
  }

  const claimRole = roleFromClaims(claims);
  if (claimRole) {
    return {
      userId: session.userId,
      role: claimRole,
      displayName: nameFromClaims(claims) || fallbackName,
    };
  }

  const user = await safeCurrentUser();
  const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
  return {
    userId: session.userId,
    role: metadataRole === "staff" ? "staff" : "family",
    displayName: nameFromUser(user) || nameFromClaims(claims) || fallbackName,
  };
}

export async function resolveAppRoleSafe(): Promise<AppRole> {
  const identity = await resolvePortalIdentity("User");
  return identity.role;
}

export async function resolveDisplayName(fallback: string): Promise<string> {
  const identity = await resolvePortalIdentity(fallback);
  return identity.displayName;
}
