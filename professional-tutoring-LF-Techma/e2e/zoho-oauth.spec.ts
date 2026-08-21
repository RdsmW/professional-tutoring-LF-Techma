import { expect, test } from "@playwright/test";
import { getZohoConfig, ZOHO_SCOPES } from "../src/lib/zoho/config";
import {
  buildZohoAuthorizationUrl,
  createZohoState,
  hashZohoState,
  matchesZohoState,
} from "../src/lib/zoho/oauth";

const configKeys = [
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REDIRECT_URI",
  "ZOHO_ACCOUNTS_DOMAIN",
  "ZOHO_API_DOMAIN",
] as const;

function withZohoConfiguration(run: () => void) {
  const previous = new Map(configKeys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    ZOHO_CLIENT_ID: "test-client",
    ZOHO_CLIENT_SECRET: "test-secret",
    ZOHO_REDIRECT_URI: "https://portal.example.test/api/integrations/zoho/callback",
    ZOHO_ACCOUNTS_DOMAIN: "https://accounts.zoho.com",
    ZOHO_API_DOMAIN: "https://www.zohoapis.com",
  });

  try {
    run();
  } finally {
    for (const key of configKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test.describe("Zoho OAuth configuration", () => {
  test("builds an offline, read-only authorization URL with a state value", () => {
    withZohoConfiguration(() => {
      const state = createZohoState();
      const url = new URL(buildZohoAuthorizationUrl(getZohoConfig(), state));

      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("access_type")).toBe("offline");
      expect(url.searchParams.get("prompt")).toBe("consent");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "https://portal.example.test/api/integrations/zoho/callback",
      );
      expect(url.searchParams.get("scope")).toBe(ZOHO_SCOPES.join(","));
      expect(url.searchParams.get("state")).toBe(state);
    });
  });

  test("accepts only the original one-time state value", () => {
    const original = createZohoState();
    const storedHash = hashZohoState(original);

    expect(matchesZohoState(storedHash, original)).toBe(true);
    expect(matchesZohoState(storedHash, `${original}changed`)).toBe(false);
    expect(matchesZohoState(undefined, original)).toBe(false);
    expect(storedHash).not.toBe(original);
  });

  test("requires the exact HTTPS callback path", () => {
    withZohoConfiguration(() => {
      process.env.ZOHO_REDIRECT_URI = "https://portal.example.test/other-callback";
      expect(() => getZohoConfig()).toThrow(/exact HTTPS Zoho callback/i);
    });
  });

  test("rejects a non-domain OAuth host", () => {
    withZohoConfiguration(() => {
      process.env.ZOHO_ACCOUNTS_DOMAIN = "https://1";
      expect(() => getZohoConfig()).toThrow(/HTTPS domain/i);
    });
  });

  test("uses the configured canonical app origin when the explicit URI is absent", () => {
    const previousRedirectUri = process.env.ZOHO_REDIRECT_URI;
    const previousOrigin = process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
    delete process.env.ZOHO_REDIRECT_URI;
    process.env.CLERK_INVITATION_REDIRECT_ORIGIN = "https://portal.example.test";

    try {
      withZohoConfiguration(() => {
        delete process.env.ZOHO_REDIRECT_URI;
        expect(getZohoConfig().redirectUri).toBe(
          "https://portal.example.test/api/integrations/zoho/callback",
        );
      });
    } finally {
      if (previousRedirectUri === undefined) delete process.env.ZOHO_REDIRECT_URI;
      else process.env.ZOHO_REDIRECT_URI = previousRedirectUri;
      if (previousOrigin === undefined) delete process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
      else process.env.CLERK_INVITATION_REDIRECT_ORIGIN = previousOrigin;
    }
  });
});