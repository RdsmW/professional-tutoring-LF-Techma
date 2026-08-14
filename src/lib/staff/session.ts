import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ensureStaffProfile } from "@/lib/auth/roles";
import { db, requireDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";

export type StaffContext = {
  userId: string;
  staff: typeof staffProfiles.$inferSelect;
};

/** Distinguish missing DB vs missing/inactive staff profile for API responses. */
export function staffAuthErrorPayload(): { error: string; status: number } {
  if (!db) {
    return { error: "Database not configured. Set DATABASE_URL and restart the server.", status: 503 };
  }
  return { error: "Staff profile not found", status: 404 };
}

async function loadStaffByClerkId(clerkUserId: string) {
  const database = requireDb();
  const [staff] = await database
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.clerkUserId, clerkUserId))
    .limit(1);
  return staff ?? null;
}

export async function getStaffContext(): Promise<StaffContext | null> {
  const session = await auth();
  if (!session.userId) return null;
  if (!db) return null;

  try {
    // Prefer ensure (create/update from Clerk user). If Clerk Backend soft-fails,
    // fall back to an existing staff_profiles row for this session.
    let staff: typeof staffProfiles.$inferSelect | null = null;
    try {
      staff = await ensureStaffProfile();
    } catch (error) {
      console.warn("[staff] ensureStaffProfile soft-fail", error);
    }
    if (!staff) {
      staff = await loadStaffByClerkId(session.userId);
    }
    if (!staff || !staff.active) return null;

    return { userId: session.userId, staff };
  } catch (error) {
    console.warn("[staff] getStaffContext soft-fail", error);
    return null;
  }
}
