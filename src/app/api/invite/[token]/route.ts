import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireDb } from "@/lib/db";
import { guardians, households } from "@/lib/db/schema";
import { safeCurrentUser } from "@/lib/auth/clerk";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await contextParams.params;
    const database = requireDb();
    const [guardian] = await database.select().from(guardians).where(eq(guardians.inviteToken, token)).limit(1);
    if (!guardian || guardian.inviteAcceptedAt) {
      return NextResponse.json({ ok: false, error: "Invite not found or already used." }, { status: 404 });
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
    const database = requireDb();
    const [guardian] = await database.select().from(guardians).where(eq(guardians.inviteToken, token)).limit(1);
    if (!guardian || guardian.inviteAcceptedAt) {
      return NextResponse.json({ ok: false, error: "Invite not found or already used." }, { status: 404 });
    }

    if (guardian.clerkUserId && guardian.clerkUserId !== session.userId) {
      return NextResponse.json(
        { ok: false, error: "This invite is linked to a different account." },
        { status: 409 },
      );
    }

    const user = await safeCurrentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      guardian.email;

    await database
      .update(guardians)
      .set({
        clerkUserId: session.userId,
        email,
        firstName: user?.firstName || guardian.firstName,
        lastName: user?.lastName || guardian.lastName,
        inviteAcceptedAt: new Date(),
        inviteToken: null,
        updatedAt: new Date(),
      })
      .where(eq(guardians.id, guardian.id));

    return NextResponse.json({ ok: true, householdId: guardian.householdId });
  } catch (error) {
    console.warn("[invite] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to accept invite." }, { status: 500 });
  }
}
