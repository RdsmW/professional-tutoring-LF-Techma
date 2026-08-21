import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
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
  sentCount: number;
  alreadySentCount: number;
  eligibleCount: number;
  pendingCount: number;
  failedCount: number;
  deliveryComplete: boolean;
  recipientConfigurationValid: boolean;
};

function isReservation(value: string | null) {
  return Boolean(value?.startsWith("sending:"));
}

function isStaleReservation(reservedAt: Date | null) {
  return !reservedAt || reservedAt.getTime() < Date.now() - 5 * 60 * 1000;
}

export function invitationRedirectUrl(origin: string, token: string) {
  const base = new URL(origin);
  if (base.protocol !== "https:" && base.protocol !== "http:") {
    throw new Error("Invitation redirect origin must use HTTP or HTTPS.");
  }
  const invite = new URL(`/invite/${token}`, base);
  const signIn = new URL("/sign-in", base);
  signIn.searchParams.set("redirect_url", invite.toString());
  return signIn.toString();
}

/**
 * Sends Clerk application invitations only for the existing, unlinked guardians
 * of a household. The reservation is stored before calling Clerk, so a replayed
 * payment finalization or webhook cannot send another invitation.
 */
export async function sendAcademicYearPortalInvitations(input: {
  householdId: string;
  redirectOrigin: string;
  clerk?: ClerkInvitationClient;
}): Promise<PortalInvitationDelivery> {
  const database = requireDb();
  const recipients = await database
    .select({
      id: guardians.id,
      email: guardians.email,
      relationshipRole: guardians.relationshipRole,
      inviteToken: guardians.inviteToken,
      clerkUserId: guardians.clerkUserId,
      inviteAcceptedAt: guardians.inviteAcceptedAt,
      clerkInvitationId: guardians.clerkInvitationId,
      clerkInvitationSentAt: guardians.clerkInvitationSentAt,
      clerkInvitationReservedAt: guardians.clerkInvitationReservedAt,
    })
    .from(guardians)
    .where(
      and(
        eq(guardians.householdId, input.householdId),
        inArray(guardians.relationshipRole, ["parent_1", "parent_2"]),
      ),
    );

  let sent = 0;
  let alreadySent = 0;
  let pending = 0;
  let failed = 0;
  let client = input.clerk;
  const eligibleCount = recipients.filter(
    (guardian) => !guardian.clerkUserId && !guardian.inviteAcceptedAt && Boolean(guardian.inviteToken),
  ).length;
  const parent1 = recipients.filter((guardian) => guardian.relationshipRole === "parent_1");
  const parent2 = recipients.filter((guardian) => guardian.relationshipRole === "parent_2");
  const isLinkedOrDispatchable = (guardian: (typeof recipients)[number]) =>
    Boolean(guardian.clerkUserId && guardian.inviteAcceptedAt) ||
    Boolean(guardian.inviteToken && guardian.email.trim());
  const recipientConfigurationValid =
    parent1.length === 1 &&
    parent2.length === 1 &&
    parent1[0]!.email.trim().toLowerCase() !== parent2[0]!.email.trim().toLowerCase() &&
    isLinkedOrDispatchable(parent1[0]!) &&
    isLinkedOrDispatchable(parent2[0]!);

  // Public Academic Year intake always provisions both parents before payment.
  // Fail closed here so a malformed or partial household can never send a
  // single-parent portal invitation from a successful payment finalization.
  if (!recipientConfigurationValid) {
    console.warn("[academic-year-invitation] incomplete parent invitation recipients", {
      householdId: input.householdId,
      parent1Count: parent1.length,
      parent2Count: parent2.length,
    });
    return {
      emailSent: false,
      emailAlreadySent: false,
      pending: false,
      failed: true,
      sentCount: 0,
      alreadySentCount: 0,
      eligibleCount,
      pendingCount: 0,
      failedCount: 1,
      deliveryComplete: false,
      recipientConfigurationValid,
    };
  }

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

    let invitation: { id: string };
    try {
      const invitationClient = client ?? await clerkClient();
      client = invitationClient;
      invitation = await invitationClient.invitations.createInvitation({
        emailAddress: claimed.email,
        notify: true,
        // Begin with Clerk authentication, then return to the guardian-specific
        // app invite token for the household/linking check.
        redirectUrl: invitationRedirectUrl(input.redirectOrigin, claimed.inviteToken),
        ignoreExisting: true,
        publicMetadata: {
          portalGuardianId: claimed.id,
          portalHouseholdId: input.householdId,
        },
      });
    } catch (error) {
      // The request may have timed out after Clerk created the invitation.
      // Preserve the reservation and let stale recovery search Clerk metadata
      // before any later attempt can send another email.
      console.warn("[academic-year-invitation] Clerk invitation send is ambiguous", {
        guardianId: claimed.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      pending += 1;
      continue;
    }

    try {
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
      // Clerk already accepted this send. Keep the reservation so stale-send
      // recovery can discover the matching Clerk invitation instead of sending
      // a second email if this persistence attempt failed ambiguously.
      console.warn("[academic-year-invitation] Clerk invitation persistence failed", {
        guardianId: claimed.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      pending += 1;
    }
  }

  return {
    emailSent: sent > 0,
    emailAlreadySent: alreadySent > 0,
    pending: pending > 0,
    failed: failed > 0,
    sentCount: sent,
    alreadySentCount: alreadySent,
    eligibleCount,
    pendingCount: pending,
    failedCount: failed,
    deliveryComplete: pending === 0 && failed === 0 && sent + alreadySent === eligibleCount,
    recipientConfigurationValid,
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