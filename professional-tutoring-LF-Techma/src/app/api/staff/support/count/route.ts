import { NextResponse } from "next/server";
import { count, ne } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { supportCases } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const [row] = await database
      .select({ value: count() })
      .from(supportCases)
      .where(ne(supportCases.status, "resolved"));

    return NextResponse.json({ ok: true, openCount: Number(row?.value ?? 0) });
  } catch (error) {
    console.warn("[staff/support/count] soft-fail", error);
    return NextResponse.json({ ok: true, openCount: 0 });
  }
}
