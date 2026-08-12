import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { cancellationPolicyVersions } from "@/lib/db/schema";
import {
  DEFAULT_CANCELLATION_POLICY_CODE,
  DEFAULT_CANCELLATION_RULES,
  type CancellationPolicyRules,
} from "@/lib/policy/rules";

export {
  DEFAULT_CANCELLATION_POLICY_CODE,
  DEFAULT_CANCELLATION_RULES,
  type CancellationPolicyRules,
};

export type ActiveCancellationPolicy = {
  id: string | null;
  code: string;
  effectiveFrom: string;
  status: string;
  rules: CancellationPolicyRules;
  reason: string | null;
};

function fallbackPolicy(reason: string): ActiveCancellationPolicy {
  return {
    id: null,
    code: DEFAULT_CANCELLATION_POLICY_CODE,
    effectiveFrom: "2026-08-01T04:00:00.000Z",
    status: "active",
    rules: DEFAULT_CANCELLATION_RULES,
    reason,
  };
}

export async function loadActiveCancellationPolicy(): Promise<ActiveCancellationPolicy> {
  try {
    const database = requireDb();
    const [chosen] = await database
      .select()
      .from(cancellationPolicyVersions)
      .where(and(eq(cancellationPolicyVersions.kind, "cancellation"), eq(cancellationPolicyVersions.status, "active")))
      .orderBy(desc(cancellationPolicyVersions.createdAt))
      .limit(1);

    if (!chosen) {
      return fallbackPolicy("Fallback defaults; apply drizzle/0006_policy_versions.sql");
    }

    return {
      id: chosen.id,
      code: chosen.code,
      effectiveFrom: chosen.effectiveFrom.toISOString(),
      status: chosen.status,
      rules: chosen.rules,
      reason: chosen.reason,
    };
  } catch (error) {
    console.warn("[policy] loadActiveCancellationPolicy soft-fail", error);
    return fallbackPolicy("Fallback defaults");
  }
}

export async function listCancellationPolicies() {
  const database = requireDb();
  return database
    .select()
    .from(cancellationPolicyVersions)
    .where(eq(cancellationPolicyVersions.kind, "cancellation"))
    .orderBy(desc(cancellationPolicyVersions.createdAt));
}
