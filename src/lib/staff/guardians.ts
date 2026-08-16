import { and, count, desc, eq, ilike, inArray, isNotNull, isNull, lt, ne, or, SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  guardianNotes,
  guardians,
  households,
  students,
} from "@/lib/db/schema";
import { HOUSEHOLD_COUNTRY_US } from "@/lib/staff/household-display-name";
import {
  formatGuardianRelationshipRole,
  isGuardianRelationshipRole,
  type GuardianLinkStatus,
  type GuardianRelationshipRole,
  type StaffGuardianDetail,
  type StaffGuardianListRow,
  type StaffGuardianNote,
} from "@/lib/staff/guardian-shared";

/** Soft-deleted guardian notes are retained this long before purge. */
export const GUARDIAN_NOTE_RECYCLE_DAYS = 30;

export type StaffRecycledGuardianNote = StaffGuardianNote & {
  guardianId: string;
  guardianDisplayName: string;
  deletedAt: string;
  purgeAt: string;
};

export type {
  GuardianLinkStatus,
  GuardianRelationshipRole,
  StaffGuardianDetail,
  StaffGuardianListRow,
  StaffGuardianNote,
  StaffGuardianStudentRow,
} from "@/lib/staff/guardian-shared";
export { formatGuardianRelationshipRole, isGuardianRelationshipRole } from "@/lib/staff/guardian-shared";

export type ListStaffGuardiansFilters = {
  q?: string;
  /** `linked` | `invite_pending` | `all` (default). */
  status?: string;
};

function deriveLinkStatus(row: {
  clerkUserId: string | null;
  inviteToken: string | null;
  inviteAcceptedAt: Date | null;
}): GuardianLinkStatus {
  if (row.clerkUserId) return "linked";
  if (row.inviteToken && !row.inviteAcceptedAt) return "invite_pending";
  return "unlinked";
}

function serializeNote(note: typeof guardianNotes.$inferSelect): StaffGuardianNote {
  return {
    id: note.id,
    body: note.body,
    authorDisplayName: note.authorDisplayName,
    createdAt: note.createdAt.toISOString(),
    editorDisplayName: note.editorDisplayName ?? null,
    updatedAt: note.updatedAt ? note.updatedAt.toISOString() : null,
  };
}

function recycleCutoffDate(now = new Date()) {
  return new Date(now.getTime() - GUARDIAN_NOTE_RECYCLE_DAYS * 24 * 60 * 60 * 1000);
}

function purgeAtFromDeletedAt(deletedAt: Date) {
  return new Date(deletedAt.getTime() + GUARDIAN_NOTE_RECYCLE_DAYS * 24 * 60 * 60 * 1000);
}

/** Permanently remove soft-deleted guardian notes past the retention window. */
export async function purgeExpiredGuardianNotes() {
  const database = requireDb();
  await database
    .delete(guardianNotes)
    .where(and(isNotNull(guardianNotes.deletedAt), lt(guardianNotes.deletedAt, recycleCutoffDate())));
}

export async function softDeleteGuardianNote(input: {
  guardianId: string;
  noteId: string;
  staffId: string;
}): Promise<StaffGuardianNote | null> {
  const database = requireDb();
  await purgeExpiredGuardianNotes();
  const now = new Date();
  const [note] = await database
    .update(guardianNotes)
    .set({
      deletedAt: now,
      deletedByStaffId: input.staffId,
    })
    .where(
      and(
        eq(guardianNotes.id, input.noteId),
        eq(guardianNotes.guardianId, input.guardianId),
        isNull(guardianNotes.deletedAt),
      ),
    )
    .returning();
  return note ? serializeNote(note) : null;
}

export async function restoreGuardianNote(noteId: string): Promise<{ id: string; guardianId: string } | null> {
  const database = requireDb();
  await purgeExpiredGuardianNotes();
  const [note] = await database
    .update(guardianNotes)
    .set({
      deletedAt: null,
      deletedByStaffId: null,
    })
    .where(and(eq(guardianNotes.id, noteId), isNotNull(guardianNotes.deletedAt)))
    .returning({ id: guardianNotes.id, guardianId: guardianNotes.guardianId });
  return note ?? null;
}

export async function listDeletedGuardianNotes(): Promise<StaffRecycledGuardianNote[]> {
  const database = requireDb();
  await purgeExpiredGuardianNotes();

  const rows = await database
    .select({
      note: guardianNotes,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
    })
    .from(guardianNotes)
    .innerJoin(guardians, eq(guardianNotes.guardianId, guardians.id))
    .where(isNotNull(guardianNotes.deletedAt))
    .orderBy(desc(guardianNotes.deletedAt));

  return rows
    .filter((row): row is typeof row & { note: typeof row.note & { deletedAt: Date } } =>
      Boolean(row.note.deletedAt),
    )
    .map((row) => {
      const deletedAt = row.note.deletedAt;
      return {
        ...serializeNote(row.note),
        guardianId: row.note.guardianId,
        guardianDisplayName: `${row.firstName} ${row.lastName}`.trim() || "Guardian",
        deletedAt: deletedAt.toISOString(),
        purgeAt: purgeAtFromDeletedAt(deletedAt).toISOString(),
      };
    });
}

/** Next free Parent 1 / Parent 2 slot for a household, or null if both taken. */
export async function nextAvailableRelationshipRole(
  householdId: string,
  excludeGuardianId?: string,
): Promise<GuardianRelationshipRole | null> {
  const database = requireDb();
  const rows = await database
    .select({ id: guardians.id, relationshipRole: guardians.relationshipRole })
    .from(guardians)
    .where(eq(guardians.householdId, householdId));

  const taken = new Set(
    rows
      .filter((row) => !excludeGuardianId || row.id !== excludeGuardianId)
      .map((row) => row.relationshipRole)
      .filter((role): role is GuardianRelationshipRole => isGuardianRelationshipRole(role)),
  );

  if (!taken.has("parent_1")) return "parent_1";
  if (!taken.has("parent_2")) return "parent_2";
  return null;
}

/**
 * Ensure relationshipRole is unique within the household.
 * Returns an error message when another guardian already holds the role.
 */
export async function assertUniqueRelationshipRole(input: {
  householdId: string;
  guardianId: string;
  relationshipRole: GuardianRelationshipRole | null;
}): Promise<string | null> {
  if (!input.relationshipRole) return null;
  const database = requireDb();
  const [conflict] = await database
    .select({ id: guardians.id, firstName: guardians.firstName, lastName: guardians.lastName })
    .from(guardians)
    .where(
      and(
        eq(guardians.householdId, input.householdId),
        eq(guardians.relationshipRole, input.relationshipRole),
        ne(guardians.id, input.guardianId),
      ),
    )
    .limit(1);
  if (!conflict) return null;
  const label = formatGuardianRelationshipRole(input.relationshipRole);
  const name = `${conflict.firstName} ${conflict.lastName}`.trim();
  return `${label} is already assigned to ${name || "another guardian"} on this family.`;
}

/** Copy payer guardian mailing address onto household billing address (Family SoT). */
export async function syncHouseholdBillingAddressFromGuardian(
  householdId: string,
  guardianId: string,
) {
  const database = requireDb();
  const [guardian] = await database
    .select({
      id: guardians.id,
      addressLine1: guardians.addressLine1,
      addressLine2: guardians.addressLine2,
      city: guardians.city,
      state: guardians.state,
      postalCode: guardians.postalCode,
    })
    .from(guardians)
    .where(and(eq(guardians.id, guardianId), eq(guardians.householdId, householdId)))
    .limit(1);
  if (!guardian) return;

  await database
    .update(households)
    .set({
      addressLine1: guardian.addressLine1,
      addressLine2: guardian.addressLine2,
      city: guardian.city,
      state: guardian.state,
      postalCode: guardian.postalCode,
      country: HOUSEHOLD_COUNTRY_US,
      updatedAt: new Date(),
    })
    .where(eq(households.id, householdId));
}

/** Atomic household payer update (Family is source of truth). */
export async function setHouseholdBillingOwner(householdId: string, guardianId: string) {
  const database = requireDb();
  const [owner] = await database
    .select({ id: guardians.id })
    .from(guardians)
    .where(and(eq(guardians.id, guardianId), eq(guardians.householdId, householdId)))
    .limit(1);
  if (!owner) {
    throw new Error("Responsible for payment must be a household guardian.");
  }

  await database
    .update(guardians)
    .set({ isBillingOwner: false, updatedAt: new Date() })
    .where(eq(guardians.householdId, householdId));
  await database
    .update(guardians)
    .set({ isBillingOwner: true, updatedAt: new Date() })
    .where(eq(guardians.id, guardianId));
  await database
    .update(households)
    .set({ billingOwnerGuardianId: guardianId, updatedAt: new Date() })
    .where(eq(households.id, householdId));

  await syncHouseholdBillingAddressFromGuardian(householdId, guardianId);
}

/** Staff Guardians directory query. */
export async function listStaffGuardians(
  filters: ListStaffGuardiansFilters = {},
): Promise<StaffGuardianListRow[]> {
  const database = requireDb();
  const q = (filters.q ?? "").trim();
  const status = (filters.status ?? "").trim().toLowerCase();

  const whereParts: SQL[] = [];

  if (q) {
    whereParts.push(
      or(
        ilike(guardians.firstName, `%${q}%`),
        ilike(guardians.lastName, `%${q}%`),
        ilike(guardians.email, `%${q}%`),
        ilike(guardians.phone, `%${q}%`),
        ilike(households.displayName, `%${q}%`),
      )!,
    );
  }

  if (status === "linked") {
    whereParts.push(isNotNull(guardians.clerkUserId));
  } else if (status === "invite_pending") {
    whereParts.push(
      and(isNotNull(guardians.inviteToken), isNull(guardians.inviteAcceptedAt), isNull(guardians.clerkUserId))!,
    );
  }

  const rows = await database
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      email: guardians.email,
      phone: guardians.phone,
      relationshipRole: guardians.relationshipRole,
      clerkUserId: guardians.clerkUserId,
      inviteToken: guardians.inviteToken,
      inviteAcceptedAt: guardians.inviteAcceptedAt,
      isBillingOwner: guardians.isBillingOwner,
      canManageStudents: guardians.canManageStudents,
      canRequestServices: guardians.canRequestServices,
      updatedAt: guardians.updatedAt,
      householdId: households.id,
      householdDisplayName: households.displayName,
      householdStatus: households.status,
    })
    .from(guardians)
    .leftJoin(households, eq(guardians.householdId, households.id))
    .where(whereParts.length > 0 ? and(...whereParts) : undefined)
    .orderBy(desc(guardians.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    linkStatus: deriveLinkStatus(row),
    relationshipRole: isGuardianRelationshipRole(row.relationshipRole) ? row.relationshipRole : null,
    isBillingOwner: row.isBillingOwner,
    canManageStudents: row.canManageStudents,
    canRequestServices: row.canRequestServices,
    household: {
      id: row.householdId,
      displayName: row.householdDisplayName || "Unassigned",
      status: row.householdStatus || "pending",
    },
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getStaffGuardianDetail(guardianId: string): Promise<StaffGuardianDetail | null> {
  const database = requireDb();
  const [joined] = await database
    .select({
      guardian: guardians,
      householdId: households.id,
      householdDisplayName: households.displayName,
      householdStatus: households.status,
      billingOwnerGuardianId: households.billingOwnerGuardianId,
    })
    .from(guardians)
    .leftJoin(households, eq(guardians.householdId, households.id))
    .where(eq(guardians.id, guardianId))
    .limit(1);

  if (!joined) return null;

  const g = joined.guardian;
  const linkStatus = deriveLinkStatus(g);
  const householdId = joined.householdId;

  const siblingRows = householdId
    ? await database
        .select({
          id: guardians.id,
          firstName: guardians.firstName,
          lastName: guardians.lastName,
          relationshipRole: guardians.relationshipRole,
          isBillingOwner: guardians.isBillingOwner,
        })
        .from(guardians)
        .where(and(eq(guardians.householdId, householdId), ne(guardians.id, guardianId)))
    : [];

  let noteRows: StaffGuardianNote[] = [];
  try {
    await purgeExpiredGuardianNotes();
    const rows = await database
      .select()
      .from(guardianNotes)
      .where(and(eq(guardianNotes.guardianId, guardianId), isNull(guardianNotes.deletedAt)))
      .orderBy(desc(guardianNotes.createdAt));
    noteRows = rows.map(serializeNote);
  } catch (error) {
    console.warn("[staff/guardians] notes soft-fail", error);
  }

  const studentRows =
    g.isBillingOwner && householdId
      ? await database
          .select({
            id: students.id,
            displayName: students.displayName,
            gradeLabel: students.gradeLabel,
            schoolName: students.schoolName,
            lifecycle: students.lifecycle,
          })
          .from(students)
          .where(eq(students.householdId, householdId))
          .orderBy(desc(students.updatedAt))
      : [];

  const studentIds = studentRows.map((row) => row.id);
  const studentBookingCounts =
    studentIds.length > 0
      ? await database
          .select({ studentId: bookings.studentId, value: count() })
          .from(bookings)
          .where(inArray(bookings.studentId, studentIds))
          .groupBy(bookings.studentId)
      : [];
  const studentEnrollmentCounts =
    studentIds.length > 0
      ? await database
          .select({ studentId: courseEnrollments.studentId, value: count() })
          .from(courseEnrollments)
          .where(inArray(courseEnrollments.studentId, studentIds))
          .groupBy(courseEnrollments.studentId)
      : [];
  const bookingCountByStudent = new Map(
    studentBookingCounts.map((row) => [row.studentId, Number(row.value ?? 0)]),
  );
  const enrollmentCountByStudent = new Map(
    studentEnrollmentCounts.map((row) => [row.studentId, Number(row.value ?? 0)]),
  );
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    otherInformation: g.otherInformation,
    addressLine1: g.addressLine1,
    addressLine2: g.addressLine2,
    city: g.city,
    state: g.state,
    postalCode: g.postalCode,
    country: g.country || HOUSEHOLD_COUNTRY_US,
    relationshipRole: isGuardianRelationshipRole(g.relationshipRole) ? g.relationshipRole : null,
    isBillingOwner: g.isBillingOwner,
    canManageStudents: g.canManageStudents,
    canRequestServices: g.canRequestServices,
    linkStatus,
    invitePending: linkStatus === "invite_pending",
    invitePath: g.inviteToken && !g.inviteAcceptedAt ? `/invite/${g.inviteToken}` : null,
    linked: Boolean(g.clerkUserId),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    household: householdId
      ? {
          id: householdId,
          displayName: joined.householdDisplayName || "Family",
          status: joined.householdStatus || "pending",
          billingOwnerGuardianId: joined.billingOwnerGuardianId,
        }
      : null,
    householdGuardians: siblingRows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      relationshipRole: isGuardianRelationshipRole(row.relationshipRole) ? row.relationshipRole : null,
      isBillingOwner: row.isBillingOwner,
    })),
    students: studentRows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      gradeLabel: row.gradeLabel,
      schoolName: row.schoolName,
      lifecycle: row.lifecycle,
      canDelete:
        (bookingCountByStudent.get(row.id) ?? 0) === 0 &&
        (enrollmentCountByStudent.get(row.id) ?? 0) === 0,
    })),
    notes: noteRows,
  };
}

export { serializeNote as serializeGuardianNote };
