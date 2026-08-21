import { NextResponse } from "next/server";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { students, supportCaseMessages, supportCases } from "@/lib/db/schema";
import {
  isOpenSupportStatus,
  isSupportPriority,
  isSupportTopic,
  supportDisplayCode,
  supportPriorityLabel,
  supportStatusLabel,
} from "@/lib/support";

type CreateBody = {
  topic?: string;
  priority?: string;
  message?: string;
  studentId?: string | null;
};

function serializeMessage(row: typeof supportCaseMessages.$inferSelect) {
  return {
    id: row.id,
    body: row.body,
    authorRole: row.authorRole,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeCase(
  row: typeof supportCases.$inferSelect,
  messages: ReturnType<typeof serializeMessage>[],
  studentName: string | null,
) {
  return {
    id: row.id,
    displayCode: supportDisplayCode(row.id),
    topic: row.topic,
    priority: row.priority,
    priorityLabel: supportPriorityLabel(row.priority),
    relatedLabel: row.relatedLabel,
    studentId: row.studentId,
    studentName,
    status: row.status,
    statusLabel: supportStatusLabel(row.status),
    open: isOpenSupportStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messages,
  };
}

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const database = requireDb();
    const cases = await database
      .select()
      .from(supportCases)
      .where(eq(supportCases.householdId, context.household.id))
      .orderBy(desc(supportCases.createdAt));

    const studentRows = await listHouseholdStudents(context.household.id);
    const studentNameById = new Map(studentRows.map((s) => [s.id, s.displayName]));

    const payload = [];
    for (const row of cases) {
      const messages = await database
        .select()
        .from(supportCaseMessages)
        .where(eq(supportCaseMessages.caseId, row.id))
        .orderBy(asc(supportCaseMessages.createdAt));
      payload.push(
        serializeCase(
          row,
          messages.map(serializeMessage),
          row.studentId ? studentNameById.get(row.studentId) ?? null : null,
        ),
      );
    }

    return NextResponse.json({
      ok: true,
      students: studentRows.map((s) => ({ id: s.id, displayName: s.displayName })),
      cases: payload,
      hasOpenCase: payload.some((c) => c.open),
    });
  } catch (error) {
    console.warn("[family/support] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load support cases." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    if (context.household.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Complete family onboarding before contacting support." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as CreateBody;
    const topic = (body.topic ?? "").trim();
    const priority = (body.priority ?? "normal").trim();
    const message = (body.message ?? "").trim();
    const studentId = body.studentId?.trim() || null;

    if (!isSupportTopic(topic) || !message) {
      return NextResponse.json(
        { ok: false, error: "Choose a topic and enter a message." },
        { status: 400 },
      );
    }
    if (!isSupportPriority(priority)) {
      return NextResponse.json({ ok: false, error: "Invalid priority." }, { status: 400 });
    }

    const database = requireDb();

    const [openCase] = await database
      .select({ id: supportCases.id })
      .from(supportCases)
      .where(
        and(eq(supportCases.householdId, context.household.id), ne(supportCases.status, "resolved")),
      )
      .limit(1);

    if (openCase) {
      return NextResponse.json(
        {
          ok: false,
          error: "An open request already exists. Open it instead of creating a duplicate.",
        },
        { status: 400 },
      );
    }

    let relatedLabel: string | null = null;
    if (studentId) {
      const [student] = await database
        .select()
        .from(students)
        .where(and(eq(students.id, studentId), eq(students.householdId, context.household.id)))
        .limit(1);
      if (!student) {
        return NextResponse.json({ ok: false, error: "Related student not found." }, { status: 400 });
      }
      relatedLabel = student.displayName;
    }

    const [created] = await database
      .insert(supportCases)
      .values({
        householdId: context.household.id,
        createdByGuardianId: context.guardian.id,
        topic,
        priority,
        relatedLabel,
        studentId,
        status: "submitted",
      })
      .returning();

    const guardianName =
      [context.guardian.firstName, context.guardian.lastName].filter(Boolean).join(" ") || "Guardian";

    await database.insert(supportCaseMessages).values([
      {
        caseId: created.id,
        body: message,
        authorRole: "family",
        authorGuardianId: context.guardian.id,
      },
      {
        caseId: created.id,
        body: `Submitted by ${guardianName} in Family Portal`,
        authorRole: "system",
      },
      {
        caseId: created.id,
        body: "In-app Staff Support badge incremented",
        authorRole: "system",
      },
    ]);

    const messages = await database
      .select()
      .from(supportCaseMessages)
      .where(eq(supportCaseMessages.caseId, created.id))
      .orderBy(asc(supportCaseMessages.createdAt));

    return NextResponse.json({
      ok: true,
      case: serializeCase(created, messages.map(serializeMessage), relatedLabel),
    });
  } catch (error) {
    console.warn("[family/support] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create support case." }, { status: 500 });
  }
}
