import { eq, or, sql, type SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function phoneMatchSql(column: typeof guardians.phone | typeof households.primaryPhone, digits: string) {
  const trimmed = digits.length > 10 ? digits.slice(-10) : digits;
  return sql`regexp_replace(coalesce(${column}, ''), '[^0-9]', '', 'g') like ${`%${trimmed}%`}`;
}

export type HouseholdMatchCandidate = {
  householdId: string;
  householdName: string;
  householdStatus: string;
  guardian: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    matchOn: Array<"email" | "phone">;
  };
};

export async function findHouseholdMatchCandidates(input: {
  email?: string;
  phone?: string;
}): Promise<HouseholdMatchCandidate[]> {
  const email = normalizeEmail(input.email ?? "");
  const phoneDigits = normalizePhoneDigits(input.phone ?? "");

  if (!email && !phoneDigits) return [];

  const database = requireDb();
  const conditions: SQL[] = [];
  if (email) {
    conditions.push(sql`lower(${guardians.email}) = ${email}`);
  }
  if (phoneDigits) {
    conditions.push(phoneMatchSql(guardians.phone, phoneDigits));
    conditions.push(phoneMatchSql(households.primaryPhone, phoneDigits));
  }

  const rows = await database
    .select({
      householdId: households.id,
      householdName: households.displayName,
      householdStatus: households.status,
      householdPhone: households.primaryPhone,
      guardianId: guardians.id,
      guardianEmail: guardians.email,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianPhone: guardians.phone,
    })
    .from(guardians)
    .innerJoin(households, eq(guardians.householdId, households.id))
    .where(conditions.length === 1 ? conditions[0] : or(...conditions));

  const byGuardian = new Map<string, HouseholdMatchCandidate>();
  for (const row of rows) {
    const matchOn: Array<"email" | "phone"> = [];
    const rowEmail = normalizeEmail(row.guardianEmail);
    if (email && rowEmail === email) matchOn.push("email");

    const guardianDigits = normalizePhoneDigits(row.guardianPhone ?? "");
    const householdDigits = normalizePhoneDigits(row.householdPhone ?? "");
    const needle = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;
    if (
      phoneDigits &&
      ((guardianDigits && guardianDigits.endsWith(needle)) ||
        (householdDigits && householdDigits.endsWith(needle)) ||
        (guardianDigits && guardianDigits.includes(needle)) ||
        (householdDigits && householdDigits.includes(needle)))
    ) {
      matchOn.push("phone");
    }

    if (matchOn.length === 0) continue;

    const existing = byGuardian.get(row.guardianId);
    if (existing) {
      for (const key of matchOn) {
        if (!existing.guardian.matchOn.includes(key)) existing.guardian.matchOn.push(key);
      }
      continue;
    }

    byGuardian.set(row.guardianId, {
      householdId: row.householdId,
      householdName: row.householdName,
      householdStatus: row.householdStatus,
      guardian: {
        id: row.guardianId,
        name: `${row.guardianFirstName} ${row.guardianLastName}`.trim(),
        email: row.guardianEmail,
        phone: row.guardianPhone,
        matchOn,
      },
    });
  }

  return Array.from(byGuardian.values());
}
