import { desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";

export type { StaffFamilyListRow };

/** Single aggregated query for the staff Families directory. */
export async function listStaffFamilies(): Promise<StaffFamilyListRow[]> {
  const database = requireDb();

  const rows = await database
    .select({
      id: households.id,
      displayName: households.displayName,
      status: households.status,
      primaryPhone: households.primaryPhone,
      updatedAt: households.updatedAt,
      studentCount: sql<number>`count(distinct ${students.id})::int`.mapWith(Number),
      guardianCount: sql<number>`count(distinct ${guardians.id})::int`.mapWith(Number),
    })
    .from(households)
    .leftJoin(students, eq(students.householdId, households.id))
    .leftJoin(guardians, eq(guardians.householdId, households.id))
    .groupBy(
      households.id,
      households.displayName,
      households.status,
      households.primaryPhone,
      households.updatedAt,
    )
    .orderBy(desc(households.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    status: row.status,
    primaryPhone: row.primaryPhone,
    studentCount: Number(row.studentCount ?? 0),
    guardianCount: Number(row.guardianCount ?? 0),
    updatedAt: row.updatedAt.toISOString(),
  }));
}
