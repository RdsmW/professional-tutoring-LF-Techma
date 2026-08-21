import { NextResponse } from "next/server";
import { getZohoIntegrationStaff, zohoIntegrationAuthError } from "@/lib/staff/integration-session";
import { verifyZohoReadOnlyAccess } from "@/lib/zoho/read-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getZohoIntegrationStaff();
  if (!staff) {
    const authError = zohoIntegrationAuthError();
    return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
  }

  try {
    const status = await verifyZohoReadOnlyAccess();
    return NextResponse.json({ ok: true, ...status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Zoho read-only check could not be completed.",
      },
      { status: 503 },
    );
  }
}