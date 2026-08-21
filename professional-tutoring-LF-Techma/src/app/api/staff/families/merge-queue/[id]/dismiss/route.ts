import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { identityMergeRequests } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const staffContext = await getStaffContext();
    if (!staffContext) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const database = requireDb();
    const [requestRow] = await database
      .select()
      .from(identityMergeRequests)
      .where(eq(identityMergeRequests.id, id))
      .limit(1);

    if (!requestRow) {
      return NextResponse.json({ ok: false, error: "Merge request not found." }, { status: 404 });
    }

    if (requestRow.status !== "queued") {
      return NextResponse.json(
        { ok: false, error: `Request is already ${requestRow.status}.` },
        { status: 400 },
      );
    }

    const now = new Date();
    const [dismissed] = await database
      .update(identityMergeRequests)
      .set({
        status: "dismissed",
        resolvedByStaffId: staffContext.staff.id,
        resolvedAt: now,
      })
      .where(eq(identityMergeRequests.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      request: {
        id: dismissed.id,
        status: dismissed.status,
        resolvedAt: dismissed.resolvedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.warn("[staff/families/merge-queue/dismiss] soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to dismiss merge request." }, { status: 500 });
  }
}
