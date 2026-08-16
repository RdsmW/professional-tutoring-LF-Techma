import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { refreshHouseholdDisplayNameIfAuto } from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

/**
 * Unassign guardian from this family (orphan: householdId = null).
 * Does not delete the guardian. Clear billing ownership when needed.
 */
export async function POST(
  _request: Request,
  contextParams: { params: Promise<{ id: string; guardianId: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId, guardianId } = await contextParams.params;
    const database = requireDb();

    const [existing] = await database
      .select()
      .from(guardians)
      .where(and(eq(guardians.id, guardianId), eq(guardians.householdId, householdId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Guardian not found on this family." }, { status: 404 });
    }

    const [household] = await database
      .select({ billingOwnerGuardianId: households.billingOwnerGuardianId })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    if (household?.billingOwnerGuardianId === guardianId) {
      await database
        .update(households)
        .set({ billingOwnerGuardianId: null, updatedAt: new Date() })
        .where(eq(households.id, householdId));
    }

    await database
      .update(guardians)
      .set({
        householdId: null,
        isBillingOwner: false,
        updatedAt: new Date(),
      })
      .where(eq(guardians.id, guardianId));

    // Keep a single payer when another guardian remains.
    const remaining = await database
      .select({ id: guardians.id })
      .from(guardians)
      .where(eq(guardians.householdId, householdId))
      .limit(1);
    if (remaining[0]) {
      await database
        .update(guardians)
        .set({ isBillingOwner: false, updatedAt: new Date() })
        .where(eq(guardians.householdId, householdId));
      await database
        .update(guardians)
        .set({ isBillingOwner: true, updatedAt: new Date() })
        .where(eq(guardians.id, remaining[0].id));
      await database
        .update(households)
        .set({ billingOwnerGuardianId: remaining[0].id, updatedAt: new Date() })
        .where(eq(households.id, householdId));
    }

    await refreshHouseholdDisplayNameIfAuto(householdId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/families/guardians/unassign] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to unassign guardian." }, { status: 500 });
  }
}
