export const ZOHO_SCOPES = [
  "ZohoCRM.modules.accounts.READ",
  "ZohoCRM.modules.accounts.CREATE",
  "ZohoCRM.modules.accounts.UPDATE",
  "ZohoCRM.modules.contacts.READ",
  "ZohoCRM.modules.contacts.CREATE",
  "ZohoCRM.modules.contacts.UPDATE",
  "ZohoCRM.modules.deals.READ",
  "ZohoCRM.modules.deals.CREATE",
  "ZohoCRM.modules.deals.UPDATE",
  "ZohoCRM.settings.fields.READ",
] as const;

export type ZohoConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiOrigin: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}

function domainOrigin(raw: string, name: string) {
  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    throw new Error(`${name} must be a valid HTTPS domain.`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !url.hostname.includes(".") ||
    /^[\d.]+$/.test(url.hostname) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must contain only an HTTPS domain.`);
  }

  return url.origin;
}

function callbackUri(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("ZOHO_REDIRECT_URI must be a valid absolute URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/api/integrations/zoho/callback"
  ) {
    throw new Error("ZOHO_REDIRECT_URI must be the exact HTTPS Zoho callback URL.");
  }

  return url.toString();
}

function configuredCallbackUri() {
  const explicit = process.env.ZOHO_REDIRECT_URI?.trim();
  if (explicit) return callbackUri(explicit);

  // The existing canonical app origin is static configuration, not a request
  // header. It keeps the already-registered callback stable until operators
  // choose to set the more explicit ZOHO_REDIRECT_URI.
  const configuredOrigin = required("CLERK_INVITATION_REDIRECT_ORIGIN");
  let origin: URL;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must be a valid HTTPS application origin.");
  }
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("CLERK_INVITATION_REDIRECT_ORIGIN must contain only an HTTPS application origin.");
  }
  return callbackUri(`${origin.origin}/api/integrations/zoho/callback`);
}

/**
 * All OAuth configuration is intentionally server-only. In particular, the
 * redirect URI is configured, never inferred from the request host.
 */
export function getZohoConfig(): ZohoConfig {
  const accountsOrigin = domainOrigin(required("ZOHO_ACCOUNTS_DOMAIN"), "ZOHO_ACCOUNTS_DOMAIN");
  const apiOrigin = domainOrigin(required("ZOHO_API_DOMAIN"), "ZOHO_API_DOMAIN");

  return {
    clientId: required("ZOHO_CLIENT_ID"),
    clientSecret: required("ZOHO_CLIENT_SECRET"),
    redirectUri: configuredCallbackUri(),
    authorizationUrl: `${accountsOrigin}/oauth/v2/auth`,
    tokenUrl: `${accountsOrigin}/oauth/v2/token`,
    apiOrigin,
  };
}

export function isZohoConfigured() {
  try {
    getZohoConfig();
    return true;
  } catch {
    return false;
  }
}