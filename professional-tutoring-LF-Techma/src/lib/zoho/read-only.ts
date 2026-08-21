import { getZohoConfig } from "@/lib/zoho/config";
import { getZohoRefreshToken } from "@/lib/zoho/credentials";

type CheckName = "Accounts" | "Contacts" | "Deals" | "Field metadata";

export type ZohoReadOnlyStatus = {
  configured: boolean;
  authorized: boolean;
  checks: Array<{ name: CheckName; ok: boolean }>;
};

const CHECKS: Array<{ name: CheckName; path: string }> = [
  { name: "Accounts", path: "/crm/v8/Accounts?fields=id&per_page=1" },
  { name: "Contacts", path: "/crm/v8/Contacts?fields=id&per_page=1" },
  { name: "Deals", path: "/crm/v8/Deals?fields=id&per_page=1" },
  { name: "Field metadata", path: "/crm/v8/settings/fields?module=Accounts" },
];

export type ZohoAccessToken = {
  config: ReturnType<typeof getZohoConfig>;
  value: string;
};

async function refreshAccessToken(
  config: ReturnType<typeof getZohoConfig>,
  refreshToken: string,
) {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  if (!response.ok) return { value: null, retryable: false };

  const body = (await response.json().catch(() => null)) as { access_token?: unknown } | null;
  if (typeof body?.access_token === "string" && body.access_token) {
    return { value: body.access_token, retryable: false };
  }
  // Zoho once returned HTTP 200 without an access token or a safe error code.
  // Retry only that malformed-success case; provider errors remain failures.
  return { value: null, retryable: true };
}

export async function getZohoAccessToken(): Promise<ZohoAccessToken | null> {
  const config = getZohoConfig();
  const refreshToken = await getZohoRefreshToken();
  if (!refreshToken) return null;

  const first = await refreshAccessToken(config, refreshToken);
  if (first.value) return { config, value: first.value };
  if (!first.retryable) return null;

  const retry = await refreshAccessToken(config, refreshToken);
  return retry.value ? { config, value: retry.value } : null;
}

/**
 * This verifier deliberately sends only GET requests. It returns endpoint
 * outcomes, never response bodies, records, tokens, or provider errors.
 */
export async function verifyZohoReadOnlyAccess(): Promise<ZohoReadOnlyStatus> {
  let config;
  try {
    config = getZohoConfig();
  } catch {
    return { configured: false, authorized: false, checks: [] };
  }

  let token: Awaited<ReturnType<typeof getZohoAccessToken>>;
  try {
    token = await getZohoAccessToken();
  } catch {
    token = null;
  }
  if (!token) {
    return {
      configured: true,
      authorized: false,
      checks: CHECKS.map(({ name }) => ({ name, ok: false })),
    };
  }

  const checks = await Promise.all(
    CHECKS.map(async ({ name, path }) => {
      try {
        const response = await fetch(`${config.apiOrigin}${path}`, {
          method: "GET",
          cache: "no-store",
          headers: { Authorization: `Zoho-oauthtoken ${token.value}` },
        });
        return { name, ok: response.ok };
      } catch {
        return { name, ok: false };
      }
    }),
  );

  return { configured: true, authorized: true, checks };
}