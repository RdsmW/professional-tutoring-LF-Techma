import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireDb } from "@/lib/db";
import { households, identityMergeRequests } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreateBody = {
  sourceHouseholdId?: string;
  targetHouseholdId?: string;
  matchOn?: string;
  notes?: string;
};

function optionalText(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export async function GET(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const statusFilter = new URL(request.url).searchParams.get("status")?.trim() || "queued";
    const database = requireDb();
    const sourceHousehold = alias(households, "source_household");
    const targetHousehold = alias(households, "target_household");

    const selectShape = {
      id: identityMergeRequests.id,
      sourceHouseholdId: identityMergeRequests.sourceHouseholdId,
      targetHouseholdId: identityMergeRequests.targetHouseholdId,
      matchOn: identityMergeRequests.matchOn,
      status: identityMergeRequests.status,
      notes: identityMergeRequests.notes,
      createdByStaffId: identityMergeRequests.createdByStaffId,
      resolvedByStaffId: identityMergeRequests.resolvedByStaffId,
      createdAt: identityMergeRequests.createdAt,
      resolvedAt: identityMergeRequests.resolvedAt,
      sourceDisplayName: sourceHousehold.displayName,
      targetDisplayName: targetHousehold.displayName,
    };

    const rows =
      statusFilter === "all"
        ? await database
            .select(selectShape)
            .from(identityMergeRequests)
            .innerJoin(sourceHousehold, eq(identityMergeRequests.sourceHouseholdId, sourceHousehold.id))
            .innerJoin(targetHousehold, eq(identityMergeRequests.targetHouseholdId, targetHousehold.id))
            .orderBy(desc(identityMergeRequests.createdAt))
        : await database
            .select(selectShape)
            .from(identityMergeRequests)
            .innerJoin(sourceHousehold, eq(identityMergeRequests.sourceHouseholdId, sourceHousehold.id))
            .innerJoin(targetHousehold, eq(identityMergeRequests.targetHouseholdId, targetHousehold.id))
            .where(eq(identityMergeRequests.status, statusFilter))
            .orderBy(desc(identityMergeRequests.createdAt));

    return NextResponse.json({
      ok: true,
      requests: rows.map((row) => ({
        id: row.id,
        sourceHouseholdId: row.sourceHouseholdId,
        targetHouseholdId: row.targetHouseholdId,
        sourceDisplayName: row.sourceDisplayName,
        targetDisplayName: row.targetDisplayName,
        matchOn: row.matchOn,
        status: row.status,
        notes: row.notes,
        createdByStaffId: row.createdByStaffId,
        resolvedByStaffId: row.resolvedByStaffId,
        createdAt: row.createdAt.toISOString(),
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.warn("[staff/families/merge-queue] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load merge queue." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as CreateBody;
    const sourceHouseholdId = (body.sourceHouseholdId ?? "").trim();
    const targetHouseholdId = (body.targetHouseholdId ?? "").trim();

    if (!UUID_RE.test(sourceHouseholdId) || !UUID_RE.test(targetHouseholdId)) {
      return NextResponse.json(
        { ok: false, error: "sourceHouseholdId and targetHouseholdId are required UUIDs." },
        { status: 400 },
      );
    }

    if (sourceHouseholdId === targetHouseholdId) {
      return NextResponse.json(
        { ok: false, error: "Source and target households must be different." },
        { status: 400 },
      );
    }

    const database = requireDb();
    const [source] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, sourceHouseholdId))
      .limit(1);
    const [target] = await database
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, targetHouseholdId))
      .limit(1);

    if (!source || !target) {
      return NextResponse.json({ ok: false, error: "Source or target household not found." }, { status: 404 });
    }

    const [row] = await database
      .insert(identityMergeRequests)
      .values({
        sourceHouseholdId,
        targetHouseholdId,
        matchOn: optionalText(body.matchOn),
        notes: optionalText(body.notes),
        status: "queued",
        createdByStaffId: context.staff.id,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      request: {
        id: row.id,
        sourceHouseholdId: row.sourceHouseholdId,
        targetHouseholdId: row.targetHouseholdId,
        matchOn: row.matchOn,
        status: row.status,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.warn("[staff/families/merge-queue] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create merge request." }, { status: 500 });
  }
}
