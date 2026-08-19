import { NextResponse } from "next/server";
import { asc, desc, eq, inArray, ne } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, staffProfiles, supportCaseMessages, supportCases } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
import {
  isOpenSupportStatus,
  supportDisplayCode,
  supportPriorityLabel,
  supportStatusLabel,
} from "@/lib/support";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const openRows = await database
      .select({
        case: supportCases,
        householdName: households.displayName,
      })
      .from(supportCases)
      .innerJoin(households, eq(supportCases.householdId, households.id))
      .where(ne(supportCases.status, "resolved"))
      .orderBy(desc(supportCases.updatedAt));

    const resolvedRows = await database
      .select({
        case: supportCases,
        householdName: households.displayName,
      })
      .from(supportCases)
      .innerJoin(households, eq(supportCases.householdId, households.id))
      .where(eq(supportCases.status, "resolved"))
      .orderBy(desc(supportCases.updatedAt))
      .limit(20);

    const all = [...openRows, ...resolvedRows];
    const assigneeIds = [
      ...new Set(all.map((row) => row.case.assigneeStaffId).filter(Boolean) as string[]),
    ];
    const assignees =
      assigneeIds.length > 0
        ? await database.select().from(staffProfiles).where(inArray(staffProfiles.id, assigneeIds))
        : [];
    const assigneeNameById = new Map(assignees.map((s) => [s.id, s.fullName]));

    const staffOptions = await database
      .select({ id: staffProfiles.id, fullName: staffProfiles.fullName })
      .from(staffProfiles)
      .where(eq(staffProfiles.active, true))
      .orderBy(asc(staffProfiles.fullName));

    const cases = all.map(({ case: row, householdName }) => ({
      id: row.id,
      displayCode: supportDisplayCode(row.id),
      topic: row.topic,
      priority: row.priority,
      priorityLabel: supportPriorityLabel(row.priority),
      relatedLabel: row.relatedLabel,
      status: row.status,
      statusLabel: supportStatusLabel(row.status),
      open: isOpenSupportStatus(row.status),
      householdName,
      assigneeStaffId: row.assigneeStaffId,
      assigneeName: row.assigneeStaffId
        ? assigneeNameById.get(row.assigneeStaffId) ?? "Staff"
        : "Unassigned",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      openCount: openRows.length,
      staffOptions,
      cases,
    });
  } catch (error) {
    console.warn("[staff/support] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load support inbox." }, { status: 500 });
  }
}
