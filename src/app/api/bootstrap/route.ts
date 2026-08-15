import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  ensureFamilyGuardian,
  ensureStaffProfile,
  resolveAppRole,
} from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { households } from "@/lib/db/schema";

export async function POST() {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json(
        { ok: false, role: null, displayName: null, householdStatus: null },
        { status: 401 },
      );
    }

    const role = await resolveAppRole(session.userId);

    if (role === "staff") {
      const profile = await ensureStaffProfile();
      return NextResponse.json({
        ok: true,
        role,
        displayName: profile?.fullName ?? null,
        householdStatus: null,
        householdName: null,
      });
    }

    const guardian = await ensureFamilyGuardian();
    let householdStatus: string | null = null;
    let householdName: string | null = null;

    const householdId = guardian?.householdId ?? null;
    if (guardian && householdId && db) {
      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, householdId))
        .limit(1);
      householdStatus = household?.status ?? null;
      householdName = household?.displayName ?? null;
    }

    const displayName = guardian
      ? [guardian.firstName, guardian.lastName].filter(Boolean).join(" ")
      : null;

    return NextResponse.json({
      ok: true,
      role,
      displayName: displayName || householdName,
      householdStatus,
      householdName,
    });
  } catch (error) {
    console.warn("[bootstrap] soft-fail", error);
    return NextResponse.json({
      ok: false,
      role: null,
      displayName: null,
      householdStatus: null,
      householdName: null,
    });
  }
}
