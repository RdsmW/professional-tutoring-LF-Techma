import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { changeRequests } from "@/lib/db/schema";
import { exceptionsBaseQuery, mapExceptionRow } from "@/lib/staff/exceptions";
import { getStaffContext } from "@/lib/staff/session";

const EXCEPTION_STATUSES = new Set([
  "submitted",
  "under_review",
  "approved",
  "declined",
  "applied",
]);

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? "").trim();

    if (status && !EXCEPTION_STATUSES.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status filter." }, { status: 400 });
    }

    const rows = await exceptionsBaseQuery()
      .where(status ? eq(changeRequests.status, status as typeof changeRequests.$inferSelect.status) : undefined)
      .orderBy(desc(changeRequests.createdAt));

    return NextResponse.json({
      ok: true,
      exceptions: rows.map(mapExceptionRow),
    });
  } catch (error) {
    console.warn("[staff/exceptions] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load exceptions." }, { status: 500 });
  }
}
