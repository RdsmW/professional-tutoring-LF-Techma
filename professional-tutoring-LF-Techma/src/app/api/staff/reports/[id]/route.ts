import { NextResponse } from "next/server";
import { parseReportFilters } from "@/lib/reports/parse-filters";
import { runReport } from "@/lib/reports/run";
import { isReportId } from "@/lib/reports/types";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await params;
    if (!isReportId(id)) {
      return NextResponse.json({ ok: false, error: "Unknown saved report." }, { status: 404 });
    }

    const filters = parseReportFilters(new URL(request.url).searchParams);
    if ("error" in filters) {
      return NextResponse.json({ ok: false, error: filters.error }, { status: 400 });
    }

    const report = await runReport(id, filters);
    return NextResponse.json({ ok: true, filters, report });
  } catch (error) {
    console.warn("[staff/reports/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load report." }, { status: 500 });
  }
}
