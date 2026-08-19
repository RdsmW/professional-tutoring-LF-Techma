import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { supportCaseMessages, supportCases } from "@/lib/db/schema";
import {
  supportDisplayCode,
  supportPriorityLabel,
  supportStatusLabel,
  isOpenSupportStatus,
} from "@/lib/support";

type ReplyBody = {
  message?: string;
};

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as ReplyBody;
    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: "Enter a reply message." }, { status: 400 });
    }

    const database = requireDb();
    const [row] = await database
      .select()
      .from(supportCases)
      .where(and(eq(supportCases.id, id), eq(supportCases.householdId, context.household.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Support case not found." }, { status: 404 });
    }
    if (row.status !== "waiting_on_family") {
      return NextResponse.json(
        { ok: false, error: "Staff has not requested a family reply on this case yet." },
        { status: 400 },
      );
    }

    const now = new Date();
    await database.insert(supportCaseMessages).values([
      {
        caseId: row.id,
        body: message,
        authorRole: "family",
        authorGuardianId: context.guardian.id,
      },
      {
        caseId: row.id,
        body: "Family reply posted in app",
        authorRole: "system",
      },
      {
        caseId: row.id,
        body: "Status changed to Under review",
        authorRole: "system",
      },
    ]);

    const [updated] = await database
      .update(supportCases)
      .set({ status: "under_review", updatedAt: now })
      .where(eq(supportCases.id, row.id))
      .returning();

    const messages = await database
      .select()
      .from(supportCaseMessages)
      .where(eq(supportCaseMessages.caseId, row.id))
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
        studentId: updated.studentId,
        status: updated.status,
        statusLabel: supportStatusLabel(updated.status),
        open: isOpenSupportStatus(updated.status),
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
    console.warn("[family/support/reply] soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to post reply." }, { status: 500 });
  }
}
