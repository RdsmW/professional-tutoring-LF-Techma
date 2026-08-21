import { and, eq } from "drizzle-orm";
import { db, requireDb, withDbRetry } from "@/lib/db";
import { resolveStaffPortalGate } from "@/lib/auth/clerk";
import { staffProfiles } from "@/lib/db/schema";

/**
 * OAuth can replace the integration's long-lived credential, so unlike general
 * staff data routes it must never auto-provision a staff profile. A caller
 * needs both Clerk's explicit staff entitlement and an existing active record.
 */
export async function getZohoIntegrationStaff() {
  const identity = await resolveStaffPortalGate("Staff");
  const userId = identity.userId;
  if (!userId || identity.role !== "staff" || !db) return null;

  return withDbRetry(async () => {
    const database = requireDb();
    const [staff] = await database
      .select()
      .from(staffProfiles)
      .where(and(eq(staffProfiles.clerkUserId, userId), eq(staffProfiles.active, true)))
      .limit(1);
    return staff ?? null;
  });
}

export function zohoIntegrationAuthError() {
  if (!db) return { error: "Database not configured. Set DATABASE_URL and restart the server.", status: 503 };
  return { error: "An active staff profile is required for Zoho integration access.", status: 403 };
}