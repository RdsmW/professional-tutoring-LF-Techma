import { eq, or, sql, type SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";

/**
 * Staff must never be guardians. Product solution = hard-block writes + clean bad rows.
 * Do not use directory filters as a substitute.
 */
export const STAFF_AS_GUARDIAN_ERROR =
  "Staff accounts cannot be added as guardians. Use a different email (or Clerk account).";

export type StaffGuardianIdentity = {
  email?: string | null;
  clerkUserId?: string | null;
};

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  return trimmed || null;
}

function normalizeClerkId(clerkUserId: string | null | undefined): string | null {
  const trimmed = (clerkUserId ?? "").trim();
  return trimmed || null;
}

/** True when email or clerkUserId matches any staff_profiles row. */
export async function isStaffIdentity(identity: StaffGuardianIdentity): Promise<boolean> {
  const email = normalizeEmail(identity.email);
  const clerkUserId = normalizeClerkId(identity.clerkUserId);
  if (!email && !clerkUserId) return false;

  const database = requireDb();
  const conditions: SQL[] = [];
  if (email) {
    conditions.push(sql`lower(${staffProfiles.email}) = ${email}`);
  }
  if (clerkUserId) {
    conditions.push(eq(staffProfiles.clerkUserId, clerkUserId));
  }

  const [row] = await database
    .select({ id: staffProfiles.id })
    .from(staffProfiles)
    .where(or(...conditions)!)
    .limit(1);

  return Boolean(row);
}

/** Returns a clear error when identity overlaps staff; otherwise null. */
export async function assertNotStaffAsGuardian(
  identity: StaffGuardianIdentity,
): Promise<string | null> {
  return (await isStaffIdentity(identity)) ? STAFF_AS_GUARDIAN_ERROR : null;
}
