import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { safeCurrentUser } from "@/lib/auth/clerk";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { guardians, households, students } from "@/lib/db/schema";
import { isValidOptionId } from "@/lib/forms/options";

type ProfileBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  displayName?: string;
  primaryPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

function clerkEmail(user: Awaited<ReturnType<typeof safeCurrentUser>>) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  );
}

function serializeGuardianRow(row: typeof guardians.$inferSelect, signInEmailForSelf?: string) {
  const linked = Boolean(row.clerkUserId);
  const invitePending = Boolean(row.inviteToken && !row.inviteAcceptedAt && !row.clerkUserId);
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: signInEmailForSelf && row.clerkUserId ? signInEmailForSelf : row.email,
    phone: row.phone ?? "",
    isBillingOwner: row.isBillingOwner,
    linked,
    invitePending,
  };
}

async function loadHouseholdExtras(
  householdId: string,
  currentGuardianId: string,
  signInEmail: string,
) {
  const database = requireDb();
  const guardianRows = await database
    .select()
    .from(guardians)
    .where(eq(guardians.householdId, householdId));
  const [studentCountRow] = await database
    .select({ value: count() })
    .from(students)
    .where(eq(students.householdId, householdId));

  return {
    guardians: guardianRows.map((row) =>
      serializeGuardianRow(row, row.id === currentGuardianId ? signInEmail : undefined),
    ),
    studentCount: Number(studentCountRow?.value ?? 0),
  };
}

function serializeProfile(
  guardian: typeof guardians.$inferSelect,
  household: typeof households.$inferSelect,
  signInEmail: string,
  extras: { guardians: ReturnType<typeof serializeGuardianRow>[]; studentCount: number },
) {
  return {
    guardian: {
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      phone: guardian.phone ?? "",
      email: signInEmail,
      isBillingOwner: guardian.isBillingOwner,
    },
    household: {
      id: household.id,
      displayName: household.displayName,
      status: household.status,
      primaryPhone: household.primaryPhone ?? "",
      addressLine1: household.addressLine1 ?? "",
      addressLine2: household.addressLine2 ?? "",
      city: household.city ?? "",
      state: household.state ?? "",
      postalCode: household.postalCode ?? "",
    },
    guardians: extras.guardians,
    studentCount: extras.studentCount,
    hasStudents: extras.studentCount > 0,
  };
}

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const user = await safeCurrentUser();
    const signInEmail = clerkEmail(user) || context.guardian.email;
    const database = requireDb();

    let guardianRow = context.guardian;
    if (signInEmail && signInEmail !== context.guardian.email) {
      const [updatedGuardian] = await database
        .update(guardians)
        .set({ email: signInEmail, updatedAt: new Date() })
        .where(eq(guardians.id, context.guardian.id))
        .returning();
      guardianRow = updatedGuardian;
    }

    const extras = await loadHouseholdExtras(context.household.id, guardianRow.id, signInEmail);

    return NextResponse.json({
      ok: true,
      ...serializeProfile(guardianRow, context.household, signInEmail, extras),
    });
  } catch (error) {
    console.warn("[family/profile] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const body = (await request.json()) as ProfileBody;
    const firstName = (body.firstName ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const displayName = (body.displayName ?? "").trim();
    const primaryPhone = (body.primaryPhone ?? "").trim();
    const addressLine1 = (body.addressLine1 ?? "").trim();
    const addressLine2 = (body.addressLine2 ?? "").trim();
    const city = (body.city ?? "").trim();
    const state = (body.state ?? "").trim();
    const postalCode = (body.postalCode ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, error: "First and last name are required." }, { status: 400 });
    }
    if (!displayName || !primaryPhone || !addressLine1 || !city || !state || !postalCode) {
      return NextResponse.json(
        { ok: false, error: "Household name, phone, and full address are required." },
        { status: 400 },
      );
    }
    if (!isValidOptionId("US_STATES", state)) {
      return NextResponse.json({ ok: false, error: "Invalid state selection." }, { status: 400 });
    }

    const database = requireDb();
    const now = new Date();

    const [updatedGuardian] = await database
      .update(guardians)
      .set({
        firstName,
        lastName,
        phone: phone || null,
        updatedAt: now,
      })
      .where(eq(guardians.id, context.guardian.id))
      .returning();

    const [updatedHousehold] = await database
      .update(households)
      .set({
        displayName,
        primaryPhone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        updatedAt: now,
      })
      .where(eq(households.id, context.household.id))
      .returning();

    const namesChanged =
      firstName !== context.guardian.firstName || lastName !== context.guardian.lastName;
    if (namesChanged && context.userId) {
      try {
        const client = await clerkClient();
        await client.users.updateUser(context.userId, { firstName, lastName });
      } catch (error) {
        console.warn("[family/profile] Clerk name sync soft-fail", error);
      }
    }

    const user = await safeCurrentUser();
    const signInEmail = clerkEmail(user) || updatedGuardian.email;
    const extras = await loadHouseholdExtras(updatedHousehold.id, updatedGuardian.id, signInEmail);

    return NextResponse.json({
      ok: true,
      ...serializeProfile(updatedGuardian, updatedHousehold, signInEmail, extras),
      displayName: [firstName, lastName].filter(Boolean).join(" "),
      householdName: updatedHousehold.displayName,
    });
  } catch (error) {
    console.warn("[family/profile] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to save profile." }, { status: 500 });
  }
}
