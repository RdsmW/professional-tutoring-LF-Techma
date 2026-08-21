import { NextResponse } from "next/server";
import { listStaffGuardians } from "@/lib/staff/guardians";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();
    const sort = (searchParams.get("sort") ?? "").trim();

    const guardians = await listStaffGuardians({ q, status, sort });

    return NextResponse.json({
      ok: true,
      guardians,
    });
  } catch (error) {
    console.warn("[staff/guardians] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load guardians." }, { status: 500 });
  }
}
