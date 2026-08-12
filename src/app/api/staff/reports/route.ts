import { NextResponse } from "next/server";
import { listReportCatalog } from "@/lib/reports/run";
import { getStaffContext } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const catalog = await listReportCatalog();
    return NextResponse.json({ ok: true, ...catalog });
  } catch (error) {
    console.warn("[staff/reports] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load saved reports." }, { status: 500 });
  }
}
