import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, requireDb } from "@/lib/db";
import { staffProfiles } from "@/lib/db/schema";

export type StaffContext = {
  userId: string;
  staff: typeof staffProfiles.$inferSelect;
};

export async function getStaffContext(): Promise<StaffContext | null> {
  const session = await auth();
  if (!session.userId || !db) return null;

  try {
    const database = requireDb();
    const [staff] = await database
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.clerkUserId, session.userId))
      .limit(1);

    if (!staff || !staff.active) return null;

    return { userId: session.userId, staff };
  } catch (error) {
    console.warn("[staff] getStaffContext soft-fail", error);
    return null;
  }
}
