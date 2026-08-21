import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, identityMergeRequests, students } from "@/lib/db/schema";
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

    const sourceId = requestRow.sourceHouseholdId;
    const targetId = requestRow.targetHouseholdId;
    if (sourceId === targetId) {
      return NextResponse.json(
        { ok: false, error: "Source and target households must be different." },
        { status: 400 },
      );
    }

    const [source] = await database.select().from(households).where(eq(households.id, sourceId)).limit(1);
    const [target] = await database.select().from(households).where(eq(households.id, targetId)).limit(1);

    if (!source || !target) {
      return NextResponse.json({ ok: false, error: "Source or target household missing." }, { status: 404 });
    }

    const now = new Date();
    const warnings: string[] = [];

    // Soft-fail billing: keep target billing owner; clear billing flags on moved source guardians.
    const sourceGuardians = await database.select().from(guardians).where(eq(guardians.householdId, sourceId));
    const hadSourceBillingOwner = sourceGuardians.some((g) => g.isBillingOwner);
    if (hadSourceBillingOwner) {
      warnings.push("Source billing owner cleared; target billing owner kept.");
    }

    await database
      .update(guardians)
      .set({
        householdId: targetId,
        isBillingOwner: false,
        updatedAt: now,
      })
      .where(eq(guardians.householdId, sourceId));

    const movedStudents = await database
      .update(students)
      .set({ householdId: targetId, updatedAt: now })
      .where(eq(students.householdId, sourceId))
      .returning({ id: students.id });

    await database
      .update(households)
      .set({
        status: "archived",
        billingOwnerGuardianId: null,
        updatedAt: now,
      })
      .where(eq(households.id, sourceId));

    // Ensure at most one billing owner remains on target (keep household pointer if still valid).
    if (target.billingOwnerGuardianId) {
      await database
        .update(guardians)
        .set({ isBillingOwner: false, updatedAt: now })
        .where(
          and(eq(guardians.householdId, targetId), eq(guardians.isBillingOwner, true)),
        );
      await database
        .update(guardians)
        .set({ isBillingOwner: true, updatedAt: now })
        .where(eq(guardians.id, target.billingOwnerGuardianId));
    }

    const [merged] = await database
      .update(identityMergeRequests)
      .set({
        status: "merged",
        resolvedByStaffId: staffContext.staff.id,
        resolvedAt: now,
      })
      .where(eq(identityMergeRequests.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      request: {
        id: merged.id,
        status: merged.status,
        resolvedAt: merged.resolvedAt?.toISOString() ?? null,
      },
      moved: {
        guardians: sourceGuardians.length,
        students: movedStudents.length,
      },
      warnings,
    });
  } catch (error) {
    console.warn("[staff/families/merge-queue/merge] soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to merge households." }, { status: 500 });
  }
}
