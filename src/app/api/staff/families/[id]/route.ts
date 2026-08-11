import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  courseOfferings,
  guardians,
  households,
  students,
  tutors,
} from "@/lib/db/schema";
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

    const bookingRows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        studentId: bookings.studentId,
        tutorId: bookings.tutorId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(eq(bookings.householdId, id))
      .orderBy(desc(bookings.createdAt))
      .limit(12);

    const tutorIds = [...new Set(bookingRows.map((row) => row.tutorId).filter(Boolean))] as string[];
    const tutorRows =
      tutorIds.length > 0
        ? await database.select({ id: tutors.id, displayName: tutors.displayName }).from(tutors).where(inArray(tutors.id, tutorIds))
        : [];
    const tutorNameById = new Map(tutorRows.map((row) => [row.id, row.displayName]));
    const studentNameById = new Map(studentRows.map((row) => [row.id, row.displayName]));

    const enrollmentRows = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        studentId: courseEnrollments.studentId,
        courseId: courseEnrollments.courseOfferingId,
        createdAt: courseEnrollments.createdAt,
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.householdId, id))
      .orderBy(desc(courseEnrollments.createdAt))
      .limit(12);

    const courseIds = [...new Set(enrollmentRows.map((row) => row.courseId).filter(Boolean))] as string[];
    const courseRows =
      courseIds.length > 0
        ? await database
            .select({ id: courseOfferings.id, name: courseOfferings.name })
            .from(courseOfferings)
            .where(inArray(courseOfferings.id, courseIds))
        : [];
    const courseNameById = new Map(courseRows.map((row) => [row.id, row.name]));

    const billingOwner = guardianRows.find((g) => g.id === household.billingOwnerGuardianId) ||
      guardianRows.find((g) => g.isBillingOwner);

    return NextResponse.json({
      ok: true,
      family: {
        id: household.id,
        displayName: household.displayName,
        status: household.status,
        primaryPhone: household.primaryPhone,
        addressLine1: household.addressLine1,
        addressLine2: household.addressLine2,
        city: household.city,
        state: household.state,
        postalCode: household.postalCode,
        notes: household.notes ?? "",
        billingOwnerGuardianId: household.billingOwnerGuardianId,
        billingOwnerName: billingOwner
          ? `${billingOwner.firstName} ${billingOwner.lastName}`.trim()
          : null,
        cardOnFile: Boolean(household.stripeDefaultPaymentMethodId),
        cardBrand: household.cardBrand,
        cardLast4: household.cardLast4,
        guardians: guardianRows.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
          phone: g.phone,
          isBillingOwner: g.isBillingOwner,
          canManageStudents: g.canManageStudents,
          canRequestServices: g.canRequestServices,
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
        activity: {
          bookings: bookingRows.map((row) => ({
            id: row.id,
            status: row.status,
            studentName: studentNameById.get(row.studentId) || "Student",
            tutorName: row.tutorId ? tutorNameById.get(row.tutorId) || "Tutor" : "Unassigned",
            createdAt: row.createdAt,
          })),
          enrollments: enrollmentRows.map((row) => ({
            id: row.id,
            status: row.status,
            studentName: studentNameById.get(row.studentId) || "Student",
            courseName: courseNameById.get(row.courseId) || "Course",
            createdAt: row.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    console.warn("[staff/families/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load family." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as {
      notes?: string;
      status?: "active" | "pending" | "inactive" | "archived";
      primaryPhone?: string;
    };

    const database = requireDb();
    const [existing] = await database.select().from(households).where(eq(households.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const updates: Partial<typeof households.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
    if (typeof body.primaryPhone === "string") updates.primaryPhone = body.primaryPhone.trim() || null;
    if (body.status && ["active", "pending", "inactive", "archived"].includes(body.status)) {
      updates.status = body.status;
    }

    const [updated] = await database
      .update(households)
      .set(updates)
      .where(eq(households.id, id))
      .returning();

    return NextResponse.json({
      ok: true,
      family: {
        id: updated.id,
        notes: updated.notes ?? "",
        status: updated.status,
        primaryPhone: updated.primaryPhone,
      },
    });
  } catch (error) {
    console.warn("[staff/families/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update family." }, { status: 500 });
  }
}
