import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, staffProfiles, supportCaseMessages, supportCases } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
import {
  isOpenSupportStatus,
  isSupportStatus,
  supportDisplayCode,
  supportPriorityLabel,
  supportStatusLabel,
} from "@/lib/support";

type PatchBody = {
  status?: string;
  assigneeStaffId?: string | null;
};

async function loadCaseDetail(caseId: string) {
  const database = requireDb();
  const [joined] = await database
    .select({
      case: supportCases,
      householdName: households.displayName,
    })
    .from(supportCases)
    .innerJoin(households, eq(supportCases.householdId, households.id))
    .where(eq(supportCases.id, caseId))
    .limit(1);

  if (!joined) return null;

  const messages = await database
    .select()
    .from(supportCaseMessages)
    .where(eq(supportCaseMessages.caseId, caseId))
    .orderBy(asc(supportCaseMessages.createdAt));

  let assigneeName = "Unassigned";
  if (joined.case.assigneeStaffId) {
    const [assignee] = await database
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.id, joined.case.assigneeStaffId))
      .limit(1);
    if (assignee) assigneeName = assignee.fullName;
  }

  const staffOptions = await database
    .select({ id: staffProfiles.id, fullName: staffProfiles.fullName })
    .from(staffProfiles)
    .where(eq(staffProfiles.active, true))
    .orderBy(asc(staffProfiles.fullName));

  return {
    id: joined.case.id,
    displayCode: supportDisplayCode(joined.case.id),
    topic: joined.case.topic,
    priority: joined.case.priority,
    priorityLabel: supportPriorityLabel(joined.case.priority),
    relatedLabel: joined.case.relatedLabel,
    status: joined.case.status,
    statusLabel: supportStatusLabel(joined.case.status),
    open: isOpenSupportStatus(joined.case.status),
    householdName: joined.householdName,
    assigneeStaffId: joined.case.assigneeStaffId,
    assigneeName,
    createdAt: joined.case.createdAt.toISOString(),
    updatedAt: joined.case.updatedAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      authorRole: m.authorRole,
      createdAt: m.createdAt.toISOString(),
    })),
    staffOptions,
  };
}

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const detail = await loadCaseDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Support case not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, case: detail });
  } catch (error) {
    console.warn("[staff/support/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load support case." }, { status: 500 });
  }
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

    const [existing] = await database.select().from(supportCases).where(eq(supportCases.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Support case not found." }, { status: 404 });
    }

    const updates: Partial<typeof supportCases.$inferInsert> = { updatedAt: new Date() };
    const history: string[] = [];

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!isSupportStatus(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
      }
      if (status !== existing.status) {
        updates.status = status;
        history.push(`Status changed to ${supportStatusLabel(status)}`);
      }
    }

    if (body.assigneeStaffId !== undefined) {
      const assigneeStaffId = body.assigneeStaffId?.trim() || null;
      if (assigneeStaffId) {
        const [assignee] = await database
          .select()
          .from(staffProfiles)
          .where(eq(staffProfiles.id, assigneeStaffId))
          .limit(1);
        if (!assignee) {
          return NextResponse.json({ ok: false, error: "Assignee not found." }, { status: 400 });
        }
        if (assigneeStaffId !== existing.assigneeStaffId) {
          updates.assigneeStaffId = assigneeStaffId;
          history.push(`Assigned to ${assignee.fullName}`);
        }
      } else if (existing.assigneeStaffId) {
        updates.assigneeStaffId = null;
        history.push("Assigned to Unassigned");
      }
    }

    if (Object.keys(updates).length > 1 || history.length > 0) {
      await database.update(supportCases).set(updates).where(eq(supportCases.id, id));
      if (history.length > 0) {
        await database.insert(supportCaseMessages).values(
          history.map((bodyText) => ({
            caseId: id,
            body: bodyText,
            authorRole: "system" as const,
            authorStaffId: context.staff.id,
          })),
        );
      }
    }

    const detail = await loadCaseDetail(id);
    return NextResponse.json({ ok: true, case: detail });
  } catch (error) {
    console.warn("[staff/support/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update support case." }, { status: 500 });
  }
}
