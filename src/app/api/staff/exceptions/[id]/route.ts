import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { changeRequests, households, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const PATCH_STATUSES = new Set(["under_review", "approved", "declined", "applied"]);

type PatchBody = {
  status?: string;
  staffNotes?: string | null;
};

async function loadException(id: string) {
  const database = requireDb();
  const [row] = await database
    .select({
      id: changeRequests.id,
      status: changeRequests.status,
      changeType: changeRequests.changeType,
      reason: changeRequests.reason,
      householdId: changeRequests.householdId,
      policyRecommendation: changeRequests.policyRecommendation,
      staffNotes: changeRequests.staffNotes,
      createdAt: changeRequests.createdAt,
      studentName: students.displayName,
      householdName: households.displayName,
    })
    .from(changeRequests)
    .innerJoin(students, eq(changeRequests.studentId, students.id))
    .innerJoin(households, eq(changeRequests.householdId, households.id))
    .where(eq(changeRequests.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    changeType: row.changeType,
    reason: row.reason,
    studentName: row.studentName,
    householdName: row.householdName,
    householdId: row.householdId,
    policyRecommendation: row.policyRecommendation,
    staffNotes: row.staffNotes,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database
      .select()
      .from(changeRequests)
      .where(eq(changeRequests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Exception not found." }, { status: 404 });
    }

    const updates: Partial<typeof changeRequests.$inferInsert> = { updatedAt: new Date() };

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!PATCH_STATUSES.has(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
      }
      updates.status = status as typeof changeRequests.$inferSelect.status;
      if (status === "approved" || status === "declined" || status === "applied") {
        updates.resolvedByStaffId = context.staff.id;
        updates.resolvedAt = new Date();
      } else {
        updates.resolvedByStaffId = null;
        updates.resolvedAt = null;
      }
    }

    if (body.staffNotes !== undefined) {
      updates.staffNotes = body.staffNotes?.trim() || null;
    }

    if (Object.keys(updates).length > 1) {
      await database.update(changeRequests).set(updates).where(eq(changeRequests.id, id));
    }

    const exception = await loadException(id);
    return NextResponse.json({ ok: true, exception });
  } catch (error) {
    console.warn("[staff/exceptions/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update exception." }, { status: 500 });
  }
}
