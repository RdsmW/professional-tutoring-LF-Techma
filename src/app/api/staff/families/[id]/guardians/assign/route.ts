import { NextResponse } from "next/server";
import { and, count, eq, ne, or, isNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import {
  MAX_GUARDIANS_PER_HOUSEHOLD,
  refreshHouseholdDisplayNameIfAuto,
} from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

/** Assign an existing guardian (orphan or other household) to this family. */
export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId } = await contextParams.params;
    const body = (await request.json()) as { guardianId?: string };
    const guardianId = (body.guardianId ?? "").trim();
    if (!guardianId) {
      return NextResponse.json({ ok: false, error: "guardianId is required." }, { status: 400 });
    }

    const database = requireDb();
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const [guardian] = await database.select().from(guardians).where(eq(guardians.id, guardianId)).limit(1);
    if (!guardian) {
      return NextResponse.json({ ok: false, error: "Guardian not found." }, { status: 404 });
    }
    if (guardian.householdId === householdId) {
      return NextResponse.json({ ok: false, error: "Guardian is already on this family." }, { status: 400 });
    }

    const [guardianCount] = await database
      .select({ value: count() })
      .from(guardians)
      .where(eq(guardians.householdId, householdId));
    if (Number(guardianCount?.value ?? 0) >= MAX_GUARDIANS_PER_HOUSEHOLD) {
      return NextResponse.json(
        {
          ok: false,
          error: `This family already has ${MAX_GUARDIANS_PER_HOUSEHOLD} guardians. Unassign one before assigning another.`,
        },
        { status: 400 },
      );
    }

    const previousHouseholdId = guardian.householdId;

    if (previousHouseholdId) {
      const [prev] = await database
        .select({ billingOwnerGuardianId: households.billingOwnerGuardianId })
        .from(households)
        .where(eq(households.id, previousHouseholdId))
        .limit(1);
      if (prev?.billingOwnerGuardianId === guardianId) {
        await database
          .update(households)
          .set({ billingOwnerGuardianId: null, updatedAt: new Date() })
          .where(eq(households.id, previousHouseholdId));
      }
    }

    await database
      .update(guardians)
      .set({
        householdId,
        isBillingOwner: false,
        updatedAt: new Date(),
      })
      .where(eq(guardians.id, guardianId));

    if (previousHouseholdId) {
      await refreshHouseholdDisplayNameIfAuto(previousHouseholdId);
    }
    await refreshHouseholdDisplayNameIfAuto(householdId);

    return NextResponse.json({ ok: true, guardianId });
  } catch (error) {
    console.warn("[staff/families/guardians/assign] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to assign guardian." }, { status: 500 });
  }
}

/** List guardians available to assign (orphans + other households). */
export async function GET(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id: householdId } = await contextParams.params;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();

    const database = requireDb();
    const [household] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const rows = await database
      .select({
        id: guardians.id,
        firstName: guardians.firstName,
        lastName: guardians.lastName,
        email: guardians.email,
        householdId: guardians.householdId,
        householdDisplayName: households.displayName,
      })
      .from(guardians)
      .leftJoin(households, eq(guardians.householdId, households.id))
      .where(or(isNull(guardians.householdId), ne(guardians.householdId, householdId))!)
      .limit(80);

    const filtered = q
      ? rows.filter((row) => {
          const hay = `${row.firstName} ${row.lastName} ${row.email} ${row.householdDisplayName ?? ""}`.toLowerCase();
          return hay.includes(q);
        })
      : rows;

    return NextResponse.json({
      ok: true,
      guardians: filtered.map((row) => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        householdId: row.householdId,
        householdDisplayName: row.householdDisplayName || "Unassigned",
      })),
    });
  } catch (error) {
    console.warn("[staff/families/guardians/assign] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load guardians." }, { status: 500 });
  }
}
