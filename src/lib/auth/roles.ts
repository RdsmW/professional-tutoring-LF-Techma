import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, staffProfiles } from "@/lib/db/schema";

export type AppRole = "staff" | "family";

type ClerkPublicMetadata = {
  role?: string;
};

export async function resolveAppRole(clerkUserId: string): Promise<AppRole> {
  const user = await currentUser();
  const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
  if (metadataRole === "staff") return "staff";
  if (metadataRole === "family") return "family";

  try {
    const database = requireDb();
    const [staff] = await database
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.clerkUserId, clerkUserId))
      .limit(1);
    if (staff) return "staff";
  } catch {
    // DB may be unset during local UI-only setup.
  }

  return "family";
}

export async function requireSignedIn() {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function ensureFamilyGuardian() {
  const user = await currentUser();
  if (!user) return null;

  const database = requireDb();
  const clerkUserId = user.id;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@example.local`;
  const firstName = user.firstName ?? "Parent";
  const lastName = user.lastName ?? "Guardian";

  const [existing] = await database
    .select()
    .from(guardians)
    .where(eq(guardians.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) return existing;

  const [household] = await database
    .insert(households)
    .values({
      displayName: `${lastName} Family`,
      status: "pending",
      timezone: "America/New_York",
    })
    .returning();

  const [guardian] = await database
    .insert(guardians)
    .values({
      householdId: household.id,
      clerkUserId,
      email,
      firstName,
      lastName,
      isBillingOwner: true,
    })
    .returning();

  await database
    .update(households)
    .set({ billingOwnerGuardianId: guardian.id, updatedAt: new Date() })
    .where(eq(households.id, household.id));

  return guardian;
}

export async function ensureStaffProfile() {
  const user = await currentUser();
  if (!user) return null;

  const database = requireDb();
  const clerkUserId = user.id;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@example.local`;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Staff Member";

  const [existing] = await database
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) return existing;

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
