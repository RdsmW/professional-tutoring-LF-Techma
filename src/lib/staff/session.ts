import { auth } from "@clerk/nextjs/server";
import { ensureStaffProfile, resolveAppRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
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

export async function getStaffContext(): Promise<StaffContext | null> {
  const session = await auth();
  if (!session.userId) return null;
  if (!db) return null;

  try {
    const role = await resolveAppRole(session.userId);
    if (role !== "staff") return null;

    // Self-heal: create/update staff_profiles before APIs that require context
    // (bootstrap is async and can race list page loads).
    const ensured = await ensureStaffProfile();
    if (!ensured || !ensured.active) return null;

    return { userId: session.userId, staff: ensured };
  } catch (error) {
    console.warn("[staff] getStaffContext soft-fail", error);
    return null;
  }
}
