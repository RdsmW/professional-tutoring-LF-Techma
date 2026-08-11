import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [household] = await database.select().from(households).where(eq(households.id, id)).limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const guardianRows = await database.select().from(guardians).where(eq(guardians.householdId, id));
    const studentRows = await database.select().from(students).where(eq(students.householdId, id));

    return NextResponse.json({
      ok: true,
      family: {
        id: household.id,
        displayName: household.displayName,
        status: household.status,
        primaryPhone: household.primaryPhone,
        addressLine1: household.addressLine1,
        city: household.city,
        state: household.state,
        postalCode: household.postalCode,
        billingOwnerGuardianId: household.billingOwnerGuardianId,
        guardians: guardianRows.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
          phone: g.phone,
          isBillingOwner: g.isBillingOwner,
          invitePending: Boolean(g.inviteToken && !g.inviteAcceptedAt && !g.clerkUserId),
          invitePath: g.inviteToken && !g.inviteAcceptedAt ? `/invite/${g.inviteToken}` : null,
          linked: Boolean(g.clerkUserId),
        })),
        students: studentRows.map((s) => ({
          id: s.id,
          displayName: s.displayName,
          gradeLabel: s.gradeLabel,
          schoolName: s.schoolName,
          lifecycle: s.lifecycle,
        })),
      },
    });
  } catch (error) {
    console.warn("[staff/families/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load family." }, { status: 500 });
  }
}
