import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { changeRequests, households, students } from "@/lib/db/schema";
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

    const database = requireDb();
    const rows = await database
      .select({
        id: changeRequests.id,
        status: changeRequests.status,
        changeType: changeRequests.changeType,
        reason: changeRequests.reason,
        householdId: changeRequests.householdId,
        policyRecommendation: changeRequests.policyRecommendation,
        createdAt: changeRequests.createdAt,
        studentName: students.displayName,
        householdName: households.displayName,
      })
      .from(changeRequests)
      .innerJoin(students, eq(changeRequests.studentId, students.id))
      .innerJoin(households, eq(changeRequests.householdId, households.id))
      .where(status ? eq(changeRequests.status, status as typeof changeRequests.$inferSelect.status) : undefined)
      .orderBy(desc(changeRequests.createdAt));

    return NextResponse.json({
      ok: true,
      exceptions: rows.map((row) => ({
        id: row.id,
        status: row.status,
        changeType: row.changeType,
        reason: row.reason,
        studentName: row.studentName,
        householdName: row.householdName,
        householdId: row.householdId,
        policyRecommendation: row.policyRecommendation,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[staff/exceptions] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load exceptions." }, { status: 500 });
  }
}
