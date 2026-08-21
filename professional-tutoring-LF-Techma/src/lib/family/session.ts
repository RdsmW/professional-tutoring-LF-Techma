import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";

export type FamilyContext = {
  userId: string;
  guardian: typeof guardians.$inferSelect;
  household: typeof households.$inferSelect;
};

export async function getFamilyContext(): Promise<FamilyContext | null> {
  const session = await auth();
  if (!session.userId || !db) return null;

  try {
    const database = requireDb();
    const [guardian] = await database
      .select()
      .from(guardians)
      .where(eq(guardians.clerkUserId, session.userId))
      .limit(1);

    if (!guardian) return null;
    const householdId = guardian.householdId;
    if (!householdId) return null;

    const [household] = await database
      .select()
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    if (!household) return null;

    return { userId: session.userId, guardian, household };
  } catch (error) {
    console.warn("[family] getFamilyContext soft-fail", error);
    return null;
  }
}

export async function listHouseholdStudents(householdId: string) {
  const database = requireDb();
  return database.select().from(students).where(eq(students.householdId, householdId));
}
