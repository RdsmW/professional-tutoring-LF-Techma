import { NextResponse } from "next/server";
import { requireDb, withDbRetry } from "@/lib/db";
import { zohoOAuthStates } from "@/lib/db/schema";
import { getZohoIntegrationStaff, zohoIntegrationAuthError } from "@/lib/staff/integration-session";
import { getZohoConfig } from "@/lib/zoho/config";
import {
  buildZohoAuthorizationUrl,
  createZohoState,
  hashZohoState,
  ZOHO_STATE_COOKIE,
  ZOHO_STATE_TTL_SECONDS,
} from "@/lib/zoho/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getZohoIntegrationStaff();
  if (!staff) {
    const authError = zohoIntegrationAuthError();
    return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
  }

  try {
    const state = createZohoState();
    const authorizationUrl = buildZohoAuthorizationUrl(getZohoConfig(), state);
    await withDbRetry(async () => {
      const database = requireDb();
      await database.insert(zohoOAuthStates).values({
        stateHash: hashZohoState(state),
        staffProfileId: staff.id,
        expiresAt: new Date(Date.now() + ZOHO_STATE_TTL_SECONDS * 1000),
      });
    });
    const response = NextResponse.json({ ok: true, authorizationUrl });
    response.cookies.set({
      name: ZOHO_STATE_COOKIE,
      value: hashZohoState(state),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/integrations/zoho/callback",
      maxAge: ZOHO_STATE_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Zoho OAuth is not configured." }, { status: 503 });
  }
}