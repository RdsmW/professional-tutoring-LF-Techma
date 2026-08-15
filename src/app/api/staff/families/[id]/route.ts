import { NextResponse } from "next/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { refreshCardOnFile } from "@/lib/billing/refresh-card-on-file";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  courseOfferings,
  guardians,
  householdNotes,
  households,
  students,
  tutors,
} from "@/lib/db/schema";
import {
  HOUSEHOLD_COUNTRY_US,
  refreshHouseholdDisplayNameIfAuto,
} from "@/lib/staff/household-display-name";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";
import { isValidPhone, normalizePhone } from "@/lib/validation/contact";

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [household] = await database.select().from(households).where(eq(households.id, id)).limit(1);
    if (!household) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const card = await refreshCardOnFile(id);

    const guardianRows = await database.select().from(guardians).where(eq(guardians.householdId, id));
    const studentRows = await database.select().from(students).where(eq(students.householdId, id));

    let noteRows: Array<{
      id: string;
      body: string;
      authorDisplayName: string;
      createdAt: Date;
      editorDisplayName: string | null;
      updatedAt: Date | null;
    }> = [];
    try {
      noteRows = await database
        .select({
          id: householdNotes.id,
          body: householdNotes.body,
          authorDisplayName: householdNotes.authorDisplayName,
          createdAt: householdNotes.createdAt,
          editorDisplayName: householdNotes.editorDisplayName,
          updatedAt: householdNotes.updatedAt,
        })
        .from(householdNotes)
        .where(eq(householdNotes.householdId, id))
        .orderBy(desc(householdNotes.createdAt))
        .limit(100);
    } catch (error) {
      console.warn("[staff/families/id] notes soft-fail", error);
    }

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

    const billingOwner =
      guardianRows.find((g) => g.id === household.billingOwnerGuardianId) ||
      guardianRows.find((g) => g.isBillingOwner);

    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.householdId, id));
    const [enrollmentCount] = await database
      .select({ value: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.householdId, id));

    const canDelete =
      studentRows.length === 0 &&
      Number(bookingCount?.value ?? 0) === 0 &&
      Number(enrollmentCount?.value ?? 0) === 0;

    const studentIds = studentRows.map((s) => s.id);
    const studentBookingCounts =
      studentIds.length > 0
        ? await database
            .select({ studentId: bookings.studentId, value: count() })
            .from(bookings)
            .where(inArray(bookings.studentId, studentIds))
            .groupBy(bookings.studentId)
        : [];
    const studentEnrollmentCounts =
      studentIds.length > 0
        ? await database
            .select({ studentId: courseEnrollments.studentId, value: count() })
            .from(courseEnrollments)
            .where(inArray(courseEnrollments.studentId, studentIds))
            .groupBy(courseEnrollments.studentId)
        : [];
    const bookingCountByStudent = new Map(
      studentBookingCounts.map((row) => [row.studentId, Number(row.value ?? 0)]),
    );
    const enrollmentCountByStudent = new Map(
      studentEnrollmentCounts.map((row) => [row.studentId, Number(row.value ?? 0)]),
    );

    return NextResponse.json({
      ok: true,
      family: {
        id: household.id,
        displayName: household.displayName,
        displayNameManual: household.displayNameManual,
        status: household.status,
        primaryPhone: household.primaryPhone,
        addressLine1: household.addressLine1,
        addressLine2: household.addressLine2,
        city: household.city,
        state: household.state,
        postalCode: household.postalCode,
        country: household.country || HOUSEHOLD_COUNTRY_US,
        zohoCrmId: household.zohoCrmId,
        zohoCrmUrl: household.zohoCrmUrl,
        billingOwnerGuardianId: household.billingOwnerGuardianId,
        billingOwnerName: billingOwner
          ? `${billingOwner.firstName} ${billingOwner.lastName}`.trim()
          : null,
        billingEmail: billingOwner?.email ?? null,
        cardOnFile: card.cardOnFile,
        cardBrand: card.cardBrand,
        cardLast4: card.cardLast4,
        canDelete,
        maxGuardians: 2,
        notes: noteRows.map((row) => ({
          id: row.id,
          body: row.body,
          authorDisplayName: row.authorDisplayName,
          createdAt: row.createdAt.toISOString(),
          editorDisplayName: row.editorDisplayName ?? null,
          updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        })),
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
          canDelete:
            (bookingCountByStudent.get(s.id) ?? 0) === 0 &&
            (enrollmentCountByStudent.get(s.id) ?? 0) === 0,
        })),
        activity: {
          bookings: bookingRows.map((row) => ({
            id: row.id,
            status: row.status,
            studentName: studentNameById.get(row.studentId) || "Student",
            tutorName: row.tutorId ? tutorNameById.get(row.tutorId) || "Tutor" : "Unassigned",
            createdAt: row.createdAt.toISOString(),
          })),
          enrollments: enrollmentRows.map((row) => ({
            id: row.id,
            status: row.status,
            studentName: studentNameById.get(row.studentId) || "Student",
            courseName: courseNameById.get(row.courseId) || "Course",
            createdAt: row.createdAt.toISOString(),
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
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as {
      status?: "active" | "pending" | "inactive" | "archived";
      displayName?: string;
      displayNameManual?: boolean;
      primaryPhone?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
      zohoCrmId?: string | null;
      zohoCrmUrl?: string | null;
      billingOwnerGuardianId?: string | null;
    };

    const database = requireDb();
    const [existing] = await database.select().from(households).where(eq(households.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const updates: Partial<typeof households.$inferInsert> = { updatedAt: new Date() };
    let displayNameTouched = false;

    if (typeof body.displayName === "string") {
      const displayName = body.displayName.trim();
      if (!displayName) {
        return NextResponse.json({ ok: false, error: "Household name is required." }, { status: 400 });
      }
      updates.displayName = displayName;
      displayNameTouched = true;
      // Staff edit of name locks auto-refresh unless they explicitly clear the flag.
      updates.displayNameManual =
        typeof body.displayNameManual === "boolean" ? body.displayNameManual : true;
    } else if (typeof body.displayNameManual === "boolean") {
      updates.displayNameManual = body.displayNameManual;
    }

    if (body.primaryPhone !== undefined) {
      const phone = typeof body.primaryPhone === "string" ? body.primaryPhone.trim() : "";
      if (phone && !isValidPhone(phone)) {
        return NextResponse.json({ ok: false, error: "Enter a valid phone number." }, { status: 400 });
      }
      updates.primaryPhone = normalizePhone(phone);
    }

    if (body.addressLine1 !== undefined) {
      updates.addressLine1 = typeof body.addressLine1 === "string" ? body.addressLine1.trim() || null : null;
    }
    if (body.addressLine2 !== undefined) {
      updates.addressLine2 = typeof body.addressLine2 === "string" ? body.addressLine2.trim() || null : null;
    }
    if (body.city !== undefined) {
      updates.city = typeof body.city === "string" ? body.city.trim() || null : null;
    }
    if (body.state !== undefined) {
      updates.state = typeof body.state === "string" ? body.state.trim() || null : null;
    }
    if (body.postalCode !== undefined) {
      updates.postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() || null : null;
    }
    // Country is always United States for this product.
    updates.country = HOUSEHOLD_COUNTRY_US;

    if (body.zohoCrmId !== undefined) {
      updates.zohoCrmId = typeof body.zohoCrmId === "string" ? body.zohoCrmId.trim() || null : null;
    }
    if (body.zohoCrmUrl !== undefined) {
      const url = typeof body.zohoCrmUrl === "string" ? body.zohoCrmUrl.trim() : "";
      if (url && !/^https?:\/\//i.test(url)) {
        return NextResponse.json(
          { ok: false, error: "Zoho CRM URL must start with http:// or https://." },
          { status: 400 },
        );
      }
      updates.zohoCrmUrl = url || null;
    }

    if (body.status && ["active", "pending", "inactive", "archived"].includes(body.status)) {
      updates.status = body.status;
    }

    if (body.billingOwnerGuardianId !== undefined) {
      if (body.billingOwnerGuardianId === null) {
        updates.billingOwnerGuardianId = null;
        await database
          .update(guardians)
          .set({ isBillingOwner: false, updatedAt: new Date() })
          .where(eq(guardians.householdId, id));
      } else {
        const [owner] = await database
          .select({ id: guardians.id })
          .from(guardians)
          .where(and(eq(guardians.id, body.billingOwnerGuardianId), eq(guardians.householdId, id)))
          .limit(1);
        if (!owner) {
          return NextResponse.json({ ok: false, error: "Billing owner must be a household guardian." }, { status: 400 });
        }
        updates.billingOwnerGuardianId = owner.id;
        await database
          .update(guardians)
          .set({ isBillingOwner: false, updatedAt: new Date() })
          .where(eq(guardians.householdId, id));
        await database
          .update(guardians)
          .set({ isBillingOwner: true, updatedAt: new Date() })
          .where(eq(guardians.id, owner.id));
      }
    }

    const [updated] = await database
      .update(households)
      .set(updates)
      .where(eq(households.id, id))
      .returning();

    if (!displayNameTouched && !updated.displayNameManual) {
      await refreshHouseholdDisplayNameIfAuto(id);
    } else if (body.billingOwnerGuardianId !== undefined && !updated.displayNameManual) {
      await refreshHouseholdDisplayNameIfAuto(id);
    }

    const [fresh] = await database.select().from(households).where(eq(households.id, id)).limit(1);

    return NextResponse.json({
      ok: true,
      family: {
        id: fresh.id,
        displayName: fresh.displayName,
        displayNameManual: fresh.displayNameManual,
        status: fresh.status,
        primaryPhone: fresh.primaryPhone,
        addressLine1: fresh.addressLine1,
        addressLine2: fresh.addressLine2,
        city: fresh.city,
        state: fresh.state,
        postalCode: fresh.postalCode,
        country: fresh.country || HOUSEHOLD_COUNTRY_US,
        zohoCrmId: fresh.zohoCrmId,
        zohoCrmUrl: fresh.zohoCrmUrl,
        billingOwnerGuardianId: fresh.billingOwnerGuardianId,
      },
    });
  } catch (error) {
    console.warn("[staff/families/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update family." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      const authError = staffAuthErrorPayload();
      return NextResponse.json({ ok: false, error: authError.error }, { status: authError.status });
    }

    const { id } = await contextParams.params;
    const database = requireDb();
    const [existing] = await database.select({ id: households.id }).from(households).where(eq(households.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Family not found." }, { status: 404 });
    }

    const [studentCount] = await database
      .select({ value: count() })
      .from(students)
      .where(eq(students.householdId, id));
    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.householdId, id));
    const [enrollmentCount] = await database
      .select({ value: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.householdId, id));

    if (
      Number(studentCount?.value ?? 0) > 0 ||
      Number(bookingCount?.value ?? 0) > 0 ||
      Number(enrollmentCount?.value ?? 0) > 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Delete is only allowed when the household has no students, bookings, or enrollments. Archive instead.",
        },
        { status: 400 },
      );
    }

    await database.delete(householdNotes).where(eq(householdNotes.householdId, id));
    await database.delete(guardians).where(eq(guardians.householdId, id));
    await database.delete(households).where(eq(households.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/families/id] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete family." }, { status: 500 });
  }
}
