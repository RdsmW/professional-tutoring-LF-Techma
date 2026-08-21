const DEFAULT_POST_LOGIN_PATH = "/post-login";

/**
 * Keeps authentication returns on this application and limited to an invite
 * route. Absolute URLs are reduced to their invite path before reuse so an
 * arbitrary redirect_url can never become an external redirect.
 */
export function invitationReturnPath(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("/invite/")) return candidate;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" || !parsed.pathname.startsWith("/invite/")) {
      return DEFAULT_POST_LOGIN_PATH;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return DEFAULT_POST_LOGIN_PATH;
  }
}

export function invitationAuthReturnTarget(returnPath: string, currentOrigin?: string) {
  if (!currentOrigin) return returnPath;
  return new URL(returnPath, currentOrigin).toString();
}

export function invitationAuthUrls(returnTarget: string) {
  return {
    signInUrl: `/sign-in?redirect_url=${encodeURIComponent(returnTarget)}`,
    signUpUrl: `/sign-up?redirect_url=${encodeURIComponent(returnTarget)}`,
  };
}