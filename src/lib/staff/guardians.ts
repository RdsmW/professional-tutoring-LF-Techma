import { and, desc, eq, ilike, isNotNull, isNull, or, SQL } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";

export type GuardianLinkStatus = "linked" | "invite_pending" | "unlinked";

export type StaffGuardianListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  linkStatus: GuardianLinkStatus;
  isBillingOwner: boolean;
  canManageStudents: boolean;
  canRequestServices: boolean;
  household: {
    id: string;
    displayName: string;
    status: string;
  };
  updatedAt: string;
};

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
  // `all` / empty / unknown → no link-status filter

  const rows = await database
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      email: guardians.email,
      phone: guardians.phone,
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
    .innerJoin(households, eq(guardians.householdId, households.id))
    .where(whereParts.length > 0 ? and(...whereParts) : undefined)
    .orderBy(desc(guardians.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    linkStatus: deriveLinkStatus(row),
    isBillingOwner: row.isBillingOwner,
    canManageStudents: row.canManageStudents,
    canRequestServices: row.canRequestServices,
    household: {
      id: row.householdId,
      displayName: row.householdDisplayName,
      status: row.householdStatus,
    },
    updatedAt: row.updatedAt.toISOString(),
  }));
}
