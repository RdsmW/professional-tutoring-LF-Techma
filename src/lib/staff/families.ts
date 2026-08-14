import { and, desc, eq, ilike, ne, or, SQL, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";

export type { StaffFamilyListRow };

export type ListStaffFamiliesFilters = {
  q?: string;
  /** Exact status, `all` for every status, or omit / empty for non-archived default. */
  status?: string;
};

const HOUSEHOLD_STATUSES = new Set(["pending", "active", "inactive", "archived"]);

/** Single aggregated query for the staff Families directory. */
export async function listStaffFamilies(
  filters: ListStaffFamiliesFilters = {},
): Promise<StaffFamilyListRow[]> {
  const database = requireDb();
  const q = (filters.q ?? "").trim();
  const status = (filters.status ?? "").trim();

  const whereParts: SQL[] = [];
  if (q) {
    whereParts.push(
      or(ilike(households.displayName, `%${q}%`), ilike(households.primaryPhone, `%${q}%`))!,
    );
  }
  if (status === "all") {
    // no status constraint
  } else if (status && HOUSEHOLD_STATUSES.has(status)) {
    whereParts.push(eq(households.status, status as typeof households.$inferSelect.status));
  } else {
    // Default Active bucket: exclude archived
    whereParts.push(ne(households.status, "archived"));
  }

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
    .where(whereParts.length > 0 ? and(...whereParts) : undefined)
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
