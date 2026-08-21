import { auth } from "@clerk/nextjs/server";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { resolveAppRoleSafe, safeCurrentUser } from "@/lib/auth/clerk";
import { requireDb } from "@/lib/db";
import { guardians, households, staffProfiles } from "@/lib/db/schema";
import { normalizeGuardianEmail } from "@/lib/family/portal-invitation-linking";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";

export type AppRole = "staff" | "family";

/** Role comes from Clerk metadata first — never wait on the database for login routing. */
export async function resolveAppRole(_clerkUserId?: string): Promise<AppRole> {
  void _clerkUserId;
  return resolveAppRoleSafe();
}

export async function requireSignedIn() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function ensureFamilyGuardian() {
  const user = await safeCurrentUser();
  if (!user) return null;

  const database = requireDb();
  const clerkUserId = user.id;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@example.local`;

  // Staff must never be created or linked as guardians.
  const staffBlock = await assertNotStaffAsGuardian({ email, clerkUserId });
  if (staffBlock) {
    console.warn("[ensureFamilyGuardian] blocked staff identity", { clerkUserId, email });
    return null;
  }

  const clerkFirst = user.firstName?.trim() || null;
  const clerkLast = user.lastName?.trim() || null;
  const firstName = clerkFirst || "Parent";
  const lastName = clerkLast || "Guardian";

  return database.transaction(async (tx) => {
    // Match the invitation acceptance lock. Bootstrap must wait for a
    // concurrent acceptance before deciding this Clerk identity is new.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${clerkUserId}))`);

    const [existing] = await tx
      .select()
      .from(guardians)
      .where(eq(guardians.clerkUserId, clerkUserId))
      .limit(1);

    if (existing) {
      const updates: Partial<typeof guardians.$inferInsert> = {};
      if (clerkFirst && clerkFirst !== existing.firstName) updates.firstName = clerkFirst;
      if (clerkLast && clerkLast !== existing.lastName) updates.lastName = clerkLast;
      if (email && email !== existing.email) updates.email = email;
      if (Object.keys(updates).length === 0) return existing;

      const [updated] = await tx
        .update(guardians)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(guardians.id, existing.id))
        .returning();
      return updated ?? existing;
    }

    // An invite page is responsible for linking an existing guardian after
    // verifying its bearer token and the signed-in email. Never race it by
    // creating a generic household for the same invited address.
    const [pendingInvite] = await tx
      .select({ id: guardians.id })
      .from(guardians)
      .where(
        and(
          sql`lower(${guardians.email}) = ${normalizeGuardianEmail(email)}`,
          isNotNull(guardians.inviteToken),
          isNull(guardians.inviteAcceptedAt),
          isNull(guardians.clerkUserId),
        ),
      )
      .limit(1);
    if (pendingInvite) {
      console.info("[ensureFamilyGuardian] waiting for guardian invitation acceptance", { clerkUserId });
      return null;
    }

    const [household] = await tx
      .insert(households)
      .values({
        displayName: `${lastName} Family`,
        status: "pending",
        timezone: "America/New_York",
      })
      .returning();

    const [guardian] = await tx
      .insert(guardians)
      .values({
        householdId: household.id,
        clerkUserId,
        email,
        firstName,
        lastName,
        relationshipRole: "parent_1",
        isBillingOwner: true,
      })
      .returning();

    await tx
      .update(households)
      .set({ billingOwnerGuardianId: guardian.id, updatedAt: new Date() })
      .where(eq(households.id, household.id));

    return guardian;
  });
}

export async function ensureStaffProfile() {
  const user = await safeCurrentUser();
  if (!user) return null;

  const database = requireDb();
  const clerkUserId = user.id;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@example.local`;
  const clerkFullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const fullName = clerkFullName || "Staff Member";

  const [existing] = await database
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) {
    const updates: Partial<typeof staffProfiles.$inferInsert> = {};
    if (clerkFullName && clerkFullName !== existing.fullName) updates.fullName = clerkFullName;
    if (email && email !== existing.email) updates.email = email;
    if (Object.keys(updates).length === 0) return existing;

    const [updated] = await database
      .update(staffProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staffProfiles.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await database
    .insert(staffProfiles)
    .values({
      clerkUserId,
      email,
      fullName,
      role: "admin",
      active: true,
    })
    .returning();

  return created;
}
