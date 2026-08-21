import { NextResponse } from "next/server";
import { getZohoIntegrationStaff, zohoIntegrationAuthError } from "@/lib/staff/integration-session";
import { retryAcademicYearZohoSync } from "@/lib/zoho/academic-year";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Explicit staff operation for syncing an existing Academic Year registration.
 * Public intake never invokes CRM writes automatically.
 */
export async function POST(request: Request) {
  const staff = await getZohoIntegrationStaff();
  if (!staff) {
    const authError = zohoIntegrationAuthError();
    return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
  }

  const body = (await request.json().catch(() => null)) as { tutoringRequestId?: unknown } | null;
  const tutoringRequestId = typeof body?.tutoringRequestId === "string" ? body.tutoringRequestId.trim() : "";
  if (!tutoringRequestId) {
    return NextResponse.json({ ok: false, error: "A tutoring request ID is required." }, { status: 400 });
  }

  try {
    const result = await retryAcademicYearZohoSync(tutoringRequestId);
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Zoho Academic Year sync was not completed." },
      { status: 409 },
    );
  }
}