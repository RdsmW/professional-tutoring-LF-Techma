import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { requireDb } from "@/lib/db";
import { guardians } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type InviteBody = {
  guardianId?: string;
};

export async function POST(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id: householdId } = await contextParams.params;
    const body = (await request.json()) as InviteBody;
    const guardianId = (body.guardianId ?? "").trim();
    if (!guardianId) {
      return NextResponse.json({ ok: false, error: "guardianId is required." }, { status: 400 });
    }

    const database = requireDb();
    const [guardian] = await database
      .select()
      .from(guardians)
      .where(and(eq(guardians.id, guardianId), eq(guardians.householdId, householdId)))
      .limit(1);

    if (!guardian) {
      return NextResponse.json({ ok: false, error: "Guardian not found." }, { status: 404 });
    }
    if (guardian.clerkUserId && guardian.inviteAcceptedAt) {
      return NextResponse.json({ ok: false, error: "Guardian already accepted an invite." }, { status: 400 });
    }

    const token = randomBytes(24).toString("hex");
    await database
      .update(guardians)
      .set({ inviteToken: token, inviteAcceptedAt: null, updatedAt: new Date() })
      .where(eq(guardians.id, guardianId));

    return NextResponse.json({
      ok: true,
      invitePath: `/invite/${token}`,
    });
  } catch (error) {
    console.warn("[staff/families/invite] soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to create invite." }, { status: 500 });
  }
}
