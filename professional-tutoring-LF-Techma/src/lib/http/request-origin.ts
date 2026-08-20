/**
 * Provides the one configured application origin used in Clerk invitation
 * redirects. Invitation destinations must never be derived from request
 * headers, which can be influenced by the caller.
 */
export function invitationRedirectOrigin() {
  const configuredOrigin = process.env.CLERK_INVITATION_REDIRECT_ORIGIN?.trim();
  if (!configuredOrigin) {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must be configured before sending Clerk invitations.");
  }

  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must be a valid absolute URL.");
  }

  if (origin.protocol !== "https:") {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must use HTTPS.");
  }
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must contain only the HTTPS application origin.");
  }

  return origin.origin;
}