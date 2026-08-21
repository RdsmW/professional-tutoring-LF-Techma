import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";

export class PortalInvitationLinkError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function normalizeGuardianEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Lets generic bootstrap defer to an existing guardian-specific invitation.
 * It intentionally does not attach a Clerk identity: only the token route can
 * do that after it has verified the invited email and Clerk user.
 */
export async function hasPendingGuardianInvitation(email: string) {
  const normalizedEmail = normalizeGuardianEmail(email);
  if (!normalizedEmail) return false;

  const database = requireDb();
  const [pending] = await database
    .select({ id: guardians.id })
    .from(guardians)
    .where(
      and(
        sql`lower(${guardians.email}) = ${normalizedEmail}`,
        isNotNull(guardians.inviteToken),
        isNull(guardians.inviteAcceptedAt),
        isNull(guardians.clerkUserId),
      ),
    )
    .limit(1);

  return Boolean(pending);
}

export async function acceptExistingGuardianInvitation(input: {
  token: string;
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const token = input.token.trim();
  const email = normalizeGuardianEmail(input.email);
  if (!token || !input.clerkUserId || !email) {
    throw new PortalInvitationLinkError("Invite details are incomplete.", 400);
  }

  const database = requireDb();
  return database.transaction(async (tx) => {
    // Serializes any attempts by the same Clerk identity, even when two invite
    // URLs are opened concurrently in different tabs or browser sessions.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.clerkUserId}))`);

    const [guardian] = await tx
      .select()
      .from(guardians)
      .where(eq(guardians.inviteToken, token))
      .limit(1);

    if (!guardian) {
      throw new PortalInvitationLinkError("Invite not found.", 404);
    }
    if (!guardian.householdId) {
      throw new PortalInvitationLinkError("Invite is not linked to a family.", 400);
    }

    const [household] = await tx
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, guardian.householdId))
      .limit(1);
    if (!household) {
      throw new PortalInvitationLinkError("Invite is not linked to a family.", 400);
    }

    if (normalizeGuardianEmail(guardian.email) !== email) {
      throw new PortalInvitationLinkError(
        "Sign in with the email address that received this invitation.",
        403,
      );
    }

    const [identityElsewhere] = await tx
      .select({ id: guardians.id })
      .from(guardians)
      .where(eq(guardians.clerkUserId, input.clerkUserId))
      .limit(1);
    if (identityElsewhere && identityElsewhere.id !== guardian.id) {
      throw new PortalInvitationLinkError(
        "This account is already linked to a different guardian.",
        409,
      );
    }

    if (guardian.inviteAcceptedAt || guardian.clerkUserId) {
      if (guardian.clerkUserId === input.clerkUserId && guardian.inviteAcceptedAt) {
        return { householdId: guardian.householdId, guardianId: guardian.id, replayed: true };
      }
      throw new PortalInvitationLinkError("This invite is linked to a different account.", 409);
    }

    const [linked] = await tx
      .update(guardians)
      .set({
        clerkUserId: input.clerkUserId,
        email,
        firstName: input.firstName?.trim() || guardian.firstName,
        lastName: input.lastName?.trim() || guardian.lastName,
        inviteAcceptedAt: new Date(),
        // Keep the original opaque token solely as a replay key. inviteAcceptedAt
        // consumes it for every other Clerk identity and hides it from staff UI.
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(guardians.id, guardian.id),
          eq(guardians.inviteToken, token),
          isNull(guardians.clerkUserId),
          isNull(guardians.inviteAcceptedAt),
        ),
      )
      .returning({ id: guardians.id });

    if (linked) {
      return { householdId: guardian.householdId, guardianId: guardian.id, replayed: false };
    }

    // A concurrent acceptance may have completed after the read. Return a
    // same-user replay, never create a replacement guardian or household.
    const [current] = await tx
      .select({
        id: guardians.id,
        clerkUserId: guardians.clerkUserId,
        inviteAcceptedAt: guardians.inviteAcceptedAt,
      })
      .from(guardians)
      .where(eq(guardians.id, guardian.id))
      .limit(1);
    if (current?.clerkUserId === input.clerkUserId && current.inviteAcceptedAt) {
      return { householdId: guardian.householdId, guardianId: guardian.id, replayed: true };
    }
    throw new PortalInvitationLinkError("This invite is linked to a different account.", 409);
  });
}