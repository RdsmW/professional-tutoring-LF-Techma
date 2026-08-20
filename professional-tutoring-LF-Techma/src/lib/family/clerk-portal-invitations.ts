import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { requireDb } from "@/lib/db";
import { guardians } from "@/lib/db/schema";

type ClerkInvitationClient = {
  invitations: {
    createInvitation: (input: {
      emailAddress: string;
      notify: boolean;
      redirectUrl: string;
      ignoreExisting: boolean;
      publicMetadata: Record<string, string>;
    }) => Promise<{ id: string }>;
    getInvitationList: (input: { query: string; limit?: number }) => Promise<{
      data: Array<{ id: string; publicMetadata?: Record<string, unknown> | null }>;
    }>;
  };
};

export type PortalInvitationDelivery = {
  emailSent: boolean;
  emailAlreadySent: boolean;
  pending: boolean;
  failed: boolean;
};

function isReservation(value: string | null) {
  return Boolean(value?.startsWith("sending:"));
}

function isStaleReservation(reservedAt: Date | null) {
  return !reservedAt || reservedAt.getTime() < Date.now() - 5 * 60 * 1000;
}

/**
 * Sends Clerk application invitations only for the existing, unlinked guardians
 * of a household. The reservation is stored before calling Clerk, so a replayed
 * payment finalization or webhook cannot send another invitation.
 */
export async function sendAcademicYearPortalInvitations(input: {
  householdId: string;
  clerk?: ClerkInvitationClient;
}): Promise<PortalInvitationDelivery> {
  const database = requireDb();
  const recipients = await database
    .select({
      id: guardians.id,
      email: guardians.email,
      inviteToken: guardians.inviteToken,
      clerkUserId: guardians.clerkUserId,
      inviteAcceptedAt: guardians.inviteAcceptedAt,
      clerkInvitationId: guardians.clerkInvitationId,
      clerkInvitationSentAt: guardians.clerkInvitationSentAt,
      clerkInvitationReservedAt: guardians.clerkInvitationReservedAt,
    })
    .from(guardians)
    .where(eq(guardians.householdId, input.householdId));

  let sent = 0;
  let alreadySent = 0;
  let pending = 0;
  let failed = 0;
  let client = input.clerk;

  for (const guardian of recipients) {
    if (guardian.clerkUserId || guardian.inviteAcceptedAt || !guardian.inviteToken) continue;
    if (guardian.clerkInvitationSentAt && !isReservation(guardian.clerkInvitationId)) {
      alreadySent += 1;
      continue;
    }
    let reservationInProgress = guardian.clerkInvitationId;
    if (reservationInProgress && isReservation(reservationInProgress)) {
      if (!isStaleReservation(guardian.clerkInvitationReservedAt)) {
        pending += 1;
        continue;
      }
      try {
        const invitationClient = client ?? await clerkClient();
        client = invitationClient;
        const existing = await invitationClient.invitations.getInvitationList({ query: guardian.email, limit: 10 });
        const matchingInvitation = existing.data.find((invitation) => {
          const metadata = invitation.publicMetadata;
          return (
            metadata?.portalGuardianId === guardian.id &&
            metadata?.portalHouseholdId === input.householdId
          );
        });
        if (matchingInvitation) {
          await database
            .update(guardians)
            .set({
              clerkInvitationId: matchingInvitation.id,
              clerkInvitationSentAt: new Date(),
              clerkInvitationReservedAt: null,
              updatedAt: new Date(),
            })
            .where(and(eq(guardians.id, guardian.id), eq(guardians.clerkInvitationId, reservationInProgress)));
          alreadySent += 1;
          continue;
        }
        await database
          .update(guardians)
          .set({
            clerkInvitationId: null,
            clerkInvitationReservedAt: null,
            updatedAt: new Date(),
          })
          .where(and(eq(guardians.id, guardian.id), eq(guardians.clerkInvitationId, reservationInProgress)));
        reservationInProgress = null;
      } catch (error) {
        console.warn("[academic-year-invitation] Could not recover stale Clerk reservation", {
          guardianId: guardian.id,
          error: error instanceof Error ? error.message : "unknown",
        });
        pending += 1;
        continue;
      }
    }
    if (reservationInProgress) {
      alreadySent += 1;
      continue;
    }

    const reservation = `sending:${randomUUID()}`;
    const [claimed] = await database
      .update(guardians)
      .set({
        clerkInvitationId: reservation,
        clerkInvitationReservedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(guardians.id, guardian.id), isNull(guardians.clerkInvitationId)))
      .returning({ id: guardians.id, email: guardians.email, inviteToken: guardians.inviteToken });

    if (!claimed?.inviteToken) {
      pending += 1;
      continue;
    }

    try {
      const invitationClient = client ?? await clerkClient();
      client = invitationClient;
      const invitation = await invitationClient.invitations.createInvitation({
        emailAddress: claimed.email,
        notify: true,
        // Preserve the app's guardian/household acceptance check after Clerk
        // completes sign-up or sign-in.
        redirectUrl: `/invite/${claimed.inviteToken}`,
        ignoreExisting: true,
        publicMetadata: {
          portalGuardianId: claimed.id,
          portalHouseholdId: input.householdId,
        },
      });
      await database
        .update(guardians)
        .set({
          clerkInvitationId: invitation.id,
          clerkInvitationSentAt: new Date(),
          clerkInvitationReservedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(guardians.id, claimed.id), eq(guardians.clerkInvitationId, reservation)));
      sent += 1;
    } catch (error) {
      // Clearing only this reservation allows a later finalization or webhook
      // retry to attempt delivery without treating an unsent email as delivered.
      await database
        .update(guardians)
        .set({
          clerkInvitationId: null,
          clerkInvitationReservedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(guardians.id, claimed.id), eq(guardians.clerkInvitationId, reservation)));
      console.warn("[academic-year-invitation] Clerk invitation send failed", {
        guardianId: claimed.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      failed += 1;
    }
  }

  return {
    emailSent: sent > 0,
    emailAlreadySent: alreadySent > 0,
    pending: pending > 0,
    failed: failed > 0,
  };
}

export function isAcademicYearRegistrationPayment(input: {
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  notes: string | null;
}) {
  if (input.relatedEntityType !== "tutoring_request" || !input.relatedEntityId) return false;
  try {
    const notes = JSON.parse(input.notes ?? "") as { source?: unknown };
    return notes.source === "public_ay_tutoring";
  } catch {
    return false;
  }
}