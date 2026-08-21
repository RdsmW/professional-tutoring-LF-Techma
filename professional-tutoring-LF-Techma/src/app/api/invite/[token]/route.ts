import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { safeCurrentUser } from "@/lib/auth/clerk";
import { assertNotStaffAsGuardian } from "@/lib/staff/staff-guardian-guard";
import {
  acceptExistingGuardianInvitation,
  normalizeGuardianEmail,
  PortalInvitationLinkError,
} from "@/lib/family/portal-invitation-linking";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await contextParams.params;
    const database = requireDb();
    const [guardian] = await database.select().from(guardians).where(eq(guardians.inviteToken, token)).limit(1);
    if (!guardian) {
      return NextResponse.json({ ok: false, error: "Invite not found." }, { status: 404 });
    }
    if (guardian.inviteAcceptedAt) {
      const session = await auth();
      if (!session.userId || session.userId !== guardian.clerkUserId) {
        return NextResponse.json({ ok: false, error: "Invite not found." }, { status: 404 });
      }
    }
    const householdId = guardian.householdId;
    if (!householdId) {
      return NextResponse.json({ ok: false, error: "Invite is not linked to a family." }, { status: 400 });
    }
    const [household] = await database
      .select()
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    return NextResponse.json({
      ok: true,
      invite: {
        guardianName: `${guardian.firstName} ${guardian.lastName}`,
        email: guardian.email,
        householdName: household?.displayName ?? "Family",
        alreadyLinked: Boolean(guardian.clerkUserId),
        accepted: Boolean(guardian.inviteAcceptedAt),
      },
    });
  } catch (error) {
    console.warn("[invite] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load invite." }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  contextParams: { params: Promise<{ token: string }> },
) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ ok: false, error: "Sign in to accept this invite." }, { status: 401 });
    }

    const { token } = await contextParams.params;
    const user = await safeCurrentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Sign in with the email address that received this invitation." },
        { status: 403 },
      );
    }

    const staffBlock = await assertNotStaffAsGuardian({
      email,
      clerkUserId: session.userId,
    });
    if (staffBlock) {
      return NextResponse.json({ ok: false, error: staffBlock }, { status: 400 });
    }

    const accepted = await acceptExistingGuardianInvitation({
      token,
      clerkUserId: session.userId,
      email: normalizeGuardianEmail(email),
      firstName: user?.firstName,
      lastName: user?.lastName,
    });
    return NextResponse.json({ ok: true, ...accepted });
  } catch (error) {
    if (error instanceof PortalInvitationLinkError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.warn("[invite] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to accept invite." }, { status: 500 });
  }
}
