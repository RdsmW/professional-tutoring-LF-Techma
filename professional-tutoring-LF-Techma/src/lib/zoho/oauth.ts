import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ZOHO_SCOPES, type ZohoConfig } from "@/lib/zoho/config";

// __Secure- permits a callback-only cookie path; __Host- would require "/".
export const ZOHO_STATE_COOKIE = "__Secure-pt-zoho-oauth-state";
export const ZOHO_STATE_TTL_SECONDS = 10 * 60;

export function createZohoState() {
  return randomBytes(32).toString("base64url");
}

export function hashZohoState(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function matchesZohoState(expectedHash: string | undefined, received: string | null) {
  if (!expectedHash || !received) return false;
  const actualHash = hashZohoState(received);
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function buildZohoAuthorizationUrl(config: ZohoConfig, state: string) {
  const url = new URL(config.authorizationUrl);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: ZOHO_SCOPES.join(","),
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  return url.toString();
}