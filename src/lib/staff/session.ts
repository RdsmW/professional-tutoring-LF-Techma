import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { ensureStaffProfile } from "@/lib/auth/roles";
import { db, requireDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";

export type StaffContext = {
  userId: string;
  staff: typeof staffProfiles.$inferSelect;
};

type SessionClaims = {
  email?: string;
  email_address?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
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

async function bootstrapStaffFromSession(userId: string, claims: SessionClaims | null | undefined) {
  const database = requireDb();
  const email =
    (typeof claims?.email === "string" && claims.email) ||
    (typeof claims?.email_address === "string" && claims.email_address) ||
    `${userId}@staff.local`;
  const fullName =
    [claims?.firstName ?? claims?.first_name, claims?.lastName ?? claims?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Staff Member";

  const [created] = await database
    .insert(staffProfiles)
    .values({
      clerkUserId: userId,
      email,
      fullName,
      role: "admin",
      active: true,
    })
    .returning();

  return created ?? null;
}

/**
 * Staff APIs (especially detail) must work from session + DB.
 * Do not depend on Clerk Backend (`currentUser`) succeeding.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const session = await auth();
  if (!session.userId) return null;
  if (!db) return null;

  try {
    // 1) Existing profile — enough for detail APIs
    let staff = await loadStaffByClerkId(session.userId);
    if (staff?.active) {
      return { userId: session.userId, staff };
    }
    if (staff && !staff.active) return null;

    // 2) Prefer Clerk user upsert when Backend is up
    try {
      staff = await ensureStaffProfile();
    } catch (error) {
      console.warn("[staff] ensureStaffProfile soft-fail", error);
    }
    if (staff?.active) {
      return { userId: session.userId, staff };
    }

    // 3) Last resort: create a row from the signed-in session
    staff = await bootstrapStaffFromSession(
      session.userId,
      session.sessionClaims as SessionClaims | null | undefined,
    );
    if (!staff?.active) return null;

    return { userId: session.userId, staff };
  } catch (error) {
    console.warn("[staff] getStaffContext soft-fail", error);
    return null;
  }
}
