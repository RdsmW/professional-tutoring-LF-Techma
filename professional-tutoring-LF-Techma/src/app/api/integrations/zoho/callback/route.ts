import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb, withDbRetry } from "@/lib/db";
import { zohoOAuthStates } from "@/lib/db/schema";
import { getZohoConfig } from "@/lib/zoho/config";
import { storeZohoRefreshToken } from "@/lib/zoho/credentials";
import { hashZohoState, matchesZohoState, ZOHO_STATE_COOKIE } from "@/lib/zoho/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function callbackResult(result: "authorized" | "rejected") {
  let url: URL;
  try {
    url = new URL("/staff/settings", getZohoConfig().redirectUri);
  } catch {
    return NextResponse.json({ ok: false, error: "Zoho OAuth callback rejected." }, { status: 400 });
  }
  url.searchParams.set("tab", "integrations");
  url.searchParams.set("zoho", result);
  const response = NextResponse.redirect(url, 303);
  response.cookies.set({
    name: ZOHO_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/integrations/zoho/callback",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const receivedState = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");
  const stateCookie = (await cookies()).get(ZOHO_STATE_COOKIE)?.value;

  // Clear the state before the token request so it cannot be replayed after a
  // provider error, invalid code, or successful callback.
  if (providerError || !code || !matchesZohoState(stateCookie, receivedState)) {
    return callbackResult("rejected");
  }
  if (!receivedState) return callbackResult("rejected");

  try {
    // A delete with an expiry condition consumes the state atomically before
    // exchanging the code. Parallel or replayed callbacks cannot reuse it.
    const stateHash = hashZohoState(receivedState);
    const consumed = await withDbRetry(async () => {
      const database = requireDb();
      const [state] = await database
        .delete(zohoOAuthStates)
        .where(and(eq(zohoOAuthStates.stateHash, stateHash), gt(zohoOAuthStates.expiresAt, new Date())))
        .returning({ stateHash: zohoOAuthStates.stateHash });
      return state ?? null;
    });
    if (!consumed) return callbackResult("rejected");

    const config = getZohoConfig();
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });
    if (!response.ok) return callbackResult("rejected");

    const body = (await response.json()) as { refresh_token?: unknown };
    if (typeof body.refresh_token !== "string" || !body.refresh_token) {
      return callbackResult("rejected");
    }

    await storeZohoRefreshToken(body.refresh_token);
    return callbackResult("authorized");
  } catch {
    return callbackResult("rejected");
  }
}