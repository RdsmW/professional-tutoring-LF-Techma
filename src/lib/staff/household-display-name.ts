import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";

/** Auto family name: `{StudentLastName} - {billingGuardianEmail}` with sensible fallbacks. */
export function buildHouseholdDisplayName(input: {
  studentLastName?: string | null;
  billingLastName?: string | null;
  billingEmail?: string | null;
}): string {
  const email = (input.billingEmail ?? "").trim().toLowerCase();
  const studentLast = (input.studentLastName ?? "").trim();
  const billingLast = (input.billingLastName ?? "").trim();
  const last = studentLast || billingLast;

  if (last && email) return `${last} - ${email}`;
  if (last) return `${last} Family`;
  if (email) return email;
  return "Family";
}

/**
 * Refresh household.displayName when displayNameManual is false.
 * Call after students/guardians/billing owner changes.
 */
export async function refreshHouseholdDisplayNameIfAuto(householdId: string) {
  const database = requireDb();
  const [household] = await database
    .select({
      id: households.id,
      displayNameManual: households.displayNameManual,
      billingOwnerGuardianId: households.billingOwnerGuardianId,
    })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household || household.displayNameManual) return null;

  const guardianRows = await database
    .select({
      id: guardians.id,
      lastName: guardians.lastName,
      email: guardians.email,
      isBillingOwner: guardians.isBillingOwner,
    })
    .from(guardians)
    .where(eq(guardians.householdId, householdId));

  const billing =
    guardianRows.find((g) => g.id === household.billingOwnerGuardianId) ||
    guardianRows.find((g) => g.isBillingOwner) ||
    guardianRows[0];

  const [firstStudent] = await database
    .select({ lastName: students.lastName })
    .from(students)
    .where(eq(students.householdId, householdId))
    .orderBy(asc(students.createdAt))
    .limit(1);

  const nextName = buildHouseholdDisplayName({
    studentLastName: firstStudent?.lastName,
    billingLastName: billing?.lastName,
    billingEmail: billing?.email,
  });

  const [updated] = await database
    .update(households)
    .set({ displayName: nextName, updatedAt: new Date() })
    .where(eq(households.id, householdId))
    .returning({ id: households.id, displayName: households.displayName });

  return updated ?? null;
}

export const MAX_GUARDIANS_PER_HOUSEHOLD = 2;
export const HOUSEHOLD_COUNTRY_US = "United States";
