import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { cancellationPolicyVersions } from "@/lib/db/schema";
import {
  DEFAULT_CANCELLATION_RULES,
  listCancellationPolicies,
  loadActiveCancellationPolicy,
} from "@/lib/policy/cancellation";
import type { CancellationPolicyRules } from "@/lib/policy/rules";
import { getStaffContext } from "@/lib/staff/session";

function mapVersion(row: typeof cancellationPolicyVersions.$inferSelect) {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    effectiveFrom: row.effectiveFrom.toISOString(),
    status: row.status,
    rules: row.rules,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const [active, versions] = await Promise.all([
      loadActiveCancellationPolicy(),
      listCancellationPolicies().catch(() => []),
    ]);

    return NextResponse.json({
      ok: true,
      active,
      versions: versions.map(mapVersion),
    });
  } catch (error) {
    console.warn("[staff/settings/policy] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load policy versions." }, { status: 500 });
  }
}

type SaveBody = {
  code?: string;
  noticeHours?: number;
  defaultEligibleOutcome?: CancellationPolicyRules["defaultEligibleOutcome"];
  bankedExpiryMode?: CancellationPolicyRules["bankedExpiryMode"];
  bankedExpiryDays?: number | null;
  reason?: string;
};

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as SaveBody;
    const code = (body.code ?? "").trim();
    const reason = (body.reason ?? "").trim();
    const noticeHours = Number(body.noticeHours);
    const defaultEligibleOutcome = body.defaultEligibleOutcome;
    const bankedExpiryMode = body.bankedExpiryMode === "end_of_term" ? "end_of_term" : "days";
    const bankedExpiryDays =
      bankedExpiryMode === "end_of_term" ? null : Number(body.bankedExpiryDays ?? 90);

    if (!code || !reason) {
      return NextResponse.json({ ok: false, error: "Version code and audit reason are required." }, { status: 400 });
    }
    if (![24, 48, 72].includes(noticeHours)) {
      return NextResponse.json({ ok: false, error: "Notice window must be 24, 48, or 72 hours." }, { status: 400 });
    }
    if (
      defaultEligibleOutcome !== "banked_credit" &&
      defaultEligibleOutcome !== "refund_review" &&
      defaultEligibleOutcome !== "reschedule_only"
    ) {
      return NextResponse.json({ ok: false, error: "Invalid default eligible outcome." }, { status: 400 });
    }
    if (bankedExpiryMode === "days" && ![30, 60, 90].includes(Number(bankedExpiryDays))) {
      return NextResponse.json({ ok: false, error: "Banked expiry must be 30, 60, or 90 days." }, { status: 400 });
    }

    const active = await loadActiveCancellationPolicy();
    const rules: CancellationPolicyRules = {
      ...DEFAULT_CANCELLATION_RULES,
      ...active.rules,
      noticeHours,
      defaultEligibleOutcome,
      bankedExpiryMode,
      bankedExpiryDays,
    };

    const database = requireDb();
    const now = new Date();

    await database
      .update(cancellationPolicyVersions)
      .set({ status: "retired", updatedAt: now })
      .where(and(eq(cancellationPolicyVersions.kind, "cancellation"), eq(cancellationPolicyVersions.status, "active")));

    const [created] = await database
      .insert(cancellationPolicyVersions)
      .values({
        code,
        kind: "cancellation",
        effectiveFrom: now,
        status: "active",
        rules,
        createdByStaffId: context.staff.id,
        reason,
        updatedAt: now,
      })
      .returning();

    const versions = await listCancellationPolicies();
    return NextResponse.json({
      ok: true,
      active: {
        id: created.id,
        code: created.code,
        effectiveFrom: created.effectiveFrom.toISOString(),
        status: created.status,
        rules: created.rules,
        reason: created.reason,
      },
      versions: versions.map(mapVersion),
    });
  } catch (error) {
    console.warn("[staff/settings/policy] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to save policy version." }, { status: 500 });
  }
}
