import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { supportCaseMessages, supportCases } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
import {
  isOpenSupportStatus,
  supportDisplayCode,
  supportPriorityLabel,
  supportStatusLabel,
} from "@/lib/support";

type ReplyBody = {
  message?: string;
};

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as ReplyBody;
    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: "Enter a reply message." }, { status: 400 });
    }

    const database = requireDb();
    const [existing] = await database.select().from(supportCases).where(eq(supportCases.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Support case not found." }, { status: 404 });
    }

    const now = new Date();
    await database.insert(supportCaseMessages).values([
      {
        caseId: id,
        body: message,
        authorRole: "staff",
        authorStaffId: context.staff.id,
      },
      {
        caseId: id,
        body: "Staff reply posted in app",
        authorRole: "system",
        authorStaffId: context.staff.id,
      },
    ]);

    const nextStatus = existing.status === "submitted" ? "under_review" : existing.status;
    const [updated] = await database
      .update(supportCases)
      .set({
        status: nextStatus,
        updatedAt: now,
        assigneeStaffId: existing.assigneeStaffId ?? context.staff.id,
      })
      .where(eq(supportCases.id, id))
      .returning();

    if (nextStatus !== existing.status) {
      await database.insert(supportCaseMessages).values({
        caseId: id,
        body: `Status changed to ${supportStatusLabel(nextStatus)}`,
        authorRole: "system",
        authorStaffId: context.staff.id,
      });
    }

    const messages = await database
      .select()
      .from(supportCaseMessages)
      .where(eq(supportCaseMessages.caseId, id))
      .orderBy(asc(supportCaseMessages.createdAt));

    return NextResponse.json({
      ok: true,
      case: {
        id: updated.id,
        displayCode: supportDisplayCode(updated.id),
        topic: updated.topic,
        priority: updated.priority,
        priorityLabel: supportPriorityLabel(updated.priority),
        relatedLabel: updated.relatedLabel,
        status: updated.status,
        statusLabel: supportStatusLabel(updated.status),
        open: isOpenSupportStatus(updated.status),
        assigneeStaffId: updated.assigneeStaffId,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        messages: messages.map((m) => ({
          id: m.id,
          body: m.body,
          authorRole: m.authorRole,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.warn("[staff/support/reply] soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to post reply." }, { status: 500 });
  }
}
