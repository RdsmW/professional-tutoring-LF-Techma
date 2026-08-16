import { and, desc, eq, ilike, isNotNull, isNull, lt, ne, or, SQL, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  guardians,
  householdNotes,
  households,
  students,
} from "@/lib/db/schema";
import type { StaffFamilyListRow } from "@/lib/staff/family-list-types";
import {
  notePurgeAtFromDeletedAt,
  noteRecycleCutoffDate,
  type StaffRecycledNote,
} from "@/lib/staff/staff-notes-recycle";

export type { StaffFamilyListRow };

export type StaffHouseholdNote = {
  id: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  editorDisplayName: string | null;
  updatedAt: string | null;
};

export type ListStaffFamiliesFilters = {
  q?: string;
  /** Exact status, `all` for every status, or omit / empty for non-archived default. */
  status?: string;
};

const HOUSEHOLD_STATUSES = new Set(["pending", "active", "inactive", "archived"]);

function serializeHouseholdNote(note: typeof householdNotes.$inferSelect): StaffHouseholdNote {
  return {
    id: note.id,
    body: note.body,
    authorDisplayName: note.authorDisplayName,
    createdAt: note.createdAt.toISOString(),
    editorDisplayName: note.editorDisplayName ?? null,
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
  };
}

export { serializeHouseholdNote };

/** Permanently remove soft-deleted household notes past the retention window. */
export async function purgeExpiredHouseholdNotes() {
  const database = requireDb();
  await database
    .delete(householdNotes)
    .where(and(isNotNull(householdNotes.deletedAt), lt(householdNotes.deletedAt, noteRecycleCutoffDate())));
}

export async function softDeleteHouseholdNote(input: {
  householdId: string;
  noteId: string;
  staffId: string;
}): Promise<StaffHouseholdNote | null> {
  const database = requireDb();
  await purgeExpiredHouseholdNotes();
  const now = new Date();
  const [note] = await database
    .update(householdNotes)
    .set({
      deletedAt: now,
      deletedByStaffId: input.staffId,
    })
    .where(
      and(
        eq(householdNotes.id, input.noteId),
        eq(householdNotes.householdId, input.householdId),
        isNull(householdNotes.deletedAt),
      ),
    )
    .returning();
  return note ? serializeHouseholdNote(note) : null;
}

export async function restoreHouseholdNote(
  noteId: string,
): Promise<{ id: string; householdId: string } | null> {
  const database = requireDb();
  await purgeExpiredHouseholdNotes();
  const [note] = await database
    .update(householdNotes)
    .set({
      deletedAt: null,
      deletedByStaffId: null,
    })
    .where(and(eq(householdNotes.id, noteId), isNotNull(householdNotes.deletedAt)))
    .returning({ id: householdNotes.id, householdId: householdNotes.householdId });
  return note ?? null;
}

export async function listDeletedHouseholdNotes(): Promise<StaffRecycledNote[]> {
  const database = requireDb();
  await purgeExpiredHouseholdNotes();

  const rows = await database
    .select({
      note: householdNotes,
      displayName: households.displayName,
    })
    .from(householdNotes)
    .innerJoin(households, eq(householdNotes.householdId, households.id))
    .where(isNotNull(householdNotes.deletedAt))
    .orderBy(desc(householdNotes.deletedAt));

  return rows
    .filter((row): row is typeof row & { note: typeof row.note & { deletedAt: Date } } =>
      Boolean(row.note.deletedAt),
    )
    .map((row) => {
      const deletedAt = row.note.deletedAt;
      const householdId = row.note.householdId;
      const entityLabel = row.displayName.trim() || "Family";
      return {
        ...serializeHouseholdNote(row.note),
        kind: "household_note" as const,
        entityId: householdId,
        entityLabel,
        entityHref: `/staff/families/${householdId}`,
        deletedAt: deletedAt.toISOString(),
        purgeAt: notePurgeAtFromDeletedAt(deletedAt).toISOString(),
      };
    });
}

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
      bookingCount: sql<number>`count(distinct ${bookings.id})::int`.mapWith(Number),
      enrollmentCount: sql<number>`count(distinct ${courseEnrollments.id})::int`.mapWith(Number),
    })
    .from(households)
    .leftJoin(students, eq(students.householdId, households.id))
    .leftJoin(guardians, eq(guardians.householdId, households.id))
    .leftJoin(bookings, eq(bookings.householdId, households.id))
    .leftJoin(courseEnrollments, eq(courseEnrollments.householdId, households.id))
    .where(whereParts.length > 0 ? and(...whereParts) : undefined)
    .groupBy(
      households.id,
      households.displayName,
      households.status,
      households.primaryPhone,
      households.updatedAt,
    )
    .orderBy(desc(households.updatedAt));

  return rows.map((row) => {
    const studentCount = Number(row.studentCount ?? 0);
    const guardianCount = Number(row.guardianCount ?? 0);
    const bookingCount = Number(row.bookingCount ?? 0);
    const enrollmentCount = Number(row.enrollmentCount ?? 0);
    return {
      id: row.id,
      displayName: row.displayName,
      status: row.status,
      primaryPhone: row.primaryPhone,
      studentCount,
      guardianCount,
      canDelete: studentCount === 0 && bookingCount === 0 && enrollmentCount === 0,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}
