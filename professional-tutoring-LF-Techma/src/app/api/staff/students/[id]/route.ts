import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  courseOfferings,
  guardians,
  households,
  studentNotes,
  students,
  studentSubjects,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { buildStudentListLabel, purgeExpiredStudentNotes, serializeStudentNote } from "@/lib/staff/students";
import { getStaffContext, staffAuthErrorPayload } from "@/lib/staff/session";

const LIFECYCLES = new Set(["prospect", "active", "paused", "completed", "archived"]);
const HOUSEHOLD_COUNTRY_US = "United States";

type PatchBody = {
  supportNotesRestricted?: string | null;
  lifecycle?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string | null;
  schoolName?: string | null;
  graduationYear?: number | null;
  gradeLabel?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  birthdate?: string | null;
  learningNeeds?: string | null;
  availabilityNotes?: string | null;
  emergencyContact?: string | null;
  description?: string | null;
  zohoDealId?: string | null;
  zohoDealUrl?: string | null;
  academicYear?: string | null;
  preferredSchedule?: string | null;
  hoursRatePackage?: string | null;
  advancedHoursRatePackage?: string | null;
  paymentPlan?: string | null;
  depositCents?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  subjectIds?: string[];
};

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

async function loadStudentDetail(studentId: string) {
  const database = requireDb();
  const [joined] = await database
    .select({
      student: students,
      householdId: households.id,
      householdDisplayName: households.displayName,
      householdBillingOwnerGuardianId: households.billingOwnerGuardianId,
      householdCardOnFile: households.cardOnFile,
      householdCardBrand: households.cardBrand,
      householdCardLast4: households.cardLast4,
      householdAutoCharge: households.autoCharge,
    })
    .from(students)
    .leftJoin(households, eq(students.householdId, households.id))
    .where(eq(students.id, studentId))
    .limit(1);

  if (!joined) return null;

  let billingEmail: string | null = null;
  let payerName: string | null = null;
  let billingOwnerGuardianId: string | null = null;
  if (joined.householdId) {
    const guardianRows = await database
      .select({
        id: guardians.id,
        firstName: guardians.firstName,
        lastName: guardians.lastName,
        email: guardians.email,
        isBillingOwner: guardians.isBillingOwner,
      })
      .from(guardians)
      .where(eq(guardians.householdId, joined.householdId));
    const billing =
      guardianRows.find((g) => g.id === joined.householdBillingOwnerGuardianId) ||
      guardianRows.find((g) => g.isBillingOwner) ||
      guardianRows[0];
    if (billing) {
      billingOwnerGuardianId = billing.id;
      billingEmail = billing.email;
      payerName = `${billing.firstName} ${billing.lastName}`.trim() || null;
    }
  }

  const subjectRows = await database
    .select({
      id: subjects.id,
      code: subjects.code,
      name: subjects.name,
      category: subjects.category,
    })
    .from(studentSubjects)
    .innerJoin(subjects, eq(studentSubjects.subjectId, subjects.id))
    .where(eq(studentSubjects.studentId, studentId))
    .orderBy(asc(subjects.name));

  const enrollmentRows = await database
    .select({
      id: courseEnrollments.id,
      status: courseEnrollments.status,
      createdAt: courseEnrollments.createdAt,
      courseId: courseOfferings.id,
      courseName: courseOfferings.name,
      courseCode: courseOfferings.code,
    })
    .from(courseEnrollments)
    .innerJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
    .where(eq(courseEnrollments.studentId, studentId))
    .orderBy(desc(courseEnrollments.createdAt))
    .limit(20);

  const bookingRows = await database
    .select({
      id: bookings.id,
      status: bookings.status,
      createdAt: bookings.createdAt,
      tutorId: bookings.tutorId,
      tutorDisplayName: tutors.displayName,
      subjectId: bookings.subjectId,
    })
    .from(bookings)
    .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
    .where(eq(bookings.studentId, studentId))
    .orderBy(desc(bookings.createdAt))
    .limit(20);

  const bookingSubjectIds = [
    ...new Set(bookingRows.map((row) => row.subjectId).filter((id): id is string => Boolean(id))),
  ];
  const bookingSubjectMap = new Map<string, string>();
  if (bookingSubjectIds.length > 0) {
    const bookingSubjects = await database
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(inArray(subjects.id, bookingSubjectIds));
    for (const row of bookingSubjects) bookingSubjectMap.set(row.id, row.name);
  }

  await purgeExpiredStudentNotes();
  const noteRows = await database
    .select()
    .from(studentNotes)
    .where(and(eq(studentNotes.studentId, studentId), isNull(studentNotes.deletedAt)))
    .orderBy(desc(studentNotes.createdAt));

  const [bookingCount] = await database
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.studentId, studentId));
  const [enrollmentCount] = await database
    .select({ value: count() })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.studentId, studentId));

  const canDelete =
    Number(bookingCount?.value ?? 0) === 0 && Number(enrollmentCount?.value ?? 0) === 0;

  const s = joined.student;
  const fullName = `${s.firstName} ${s.lastName}`.trim() || s.displayName;
  const listLabel = buildStudentListLabel({
    firstName: s.firstName,
    lastName: s.lastName,
    displayName: s.displayName,
    billingEmail,
  });

  return {
    id: s.id,
    displayName: s.displayName,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName,
    listLabel,
    gender: s.gender,
    schoolName: s.schoolName,
    graduationYear: s.graduationYear,
    gradeLabel: s.gradeLabel,
    lifecycle: s.lifecycle,
    cellPhone: s.cellPhone,
    email: s.email,
    birthdate: s.birthdate,
    learningNeeds: s.learningNeeds,
    supportNotesRestricted: s.supportNotesRestricted,
    availabilityNotes: s.availabilityNotes,
    emergencyContact: s.emergencyContact,
    changeRequestStatus: s.changeRequestStatus,
    pendingIntakeNote: s.pendingIntakeNote,
    description: s.description,
    zohoDealId: s.zohoDealId,
    zohoDealUrl: s.zohoDealUrl,
    academicYear: s.academicYear,
    preferredSchedule: s.preferredSchedule,
    hoursRatePackage: s.hoursRatePackage,
    advancedHoursRatePackage: s.advancedHoursRatePackage,
    paymentPlan: s.paymentPlan,
    depositCents: s.depositCents,
    addressLine1: s.addressLine1,
    addressLine2: s.addressLine2,
    city: s.city,
    state: s.state,
    postalCode: s.postalCode,
    country: s.country || HOUSEHOLD_COUNTRY_US,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    canDelete,
    subjects: subjectRows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
    })),
    notes: noteRows.map(serializeStudentNote),
    household: joined.householdId
      ? {
          id: joined.householdId,
          displayName: joined.householdDisplayName || "Family",
          billingEmail,
          payerName,
          billingOwnerGuardianId,
          cardOnFile: Boolean(joined.householdCardOnFile),
          cardBrand: joined.householdCardBrand,
          cardLast4: joined.householdCardLast4,
          autoCharge: Boolean(joined.householdAutoCharge),
        }
      : null,
    enrollments: enrollmentRows.map((row) => ({
      id: row.id,
      status: row.status,
      courseId: row.courseId,
      courseName: row.courseName,
      courseCode: row.courseCode,
      createdAt: row.createdAt.toISOString(),
    })),
    bookings: bookingRows.map((b) => ({
      id: b.id,
      status: b.status,
      tutorName: b.tutorDisplayName ?? null,
      subjectName: b.subjectId ? bookingSubjectMap.get(b.subjectId) ?? null : null,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

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
    const detail = await loadStudentDetail(id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, student: detail });
  } catch (error) {
    console.warn("[staff/students/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load student." }, { status: 500 });
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
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database.select().from(students).where(eq(students.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const updates: Partial<typeof students.$inferInsert> = { updatedAt: new Date() };

    if (body.firstName !== undefined) {
      const firstName = String(body.firstName).trim();
      if (!firstName) {
        return NextResponse.json({ ok: false, error: "First name is required." }, { status: 400 });
      }
      updates.firstName = firstName;
    }

    if (body.lastName !== undefined) {
      const lastName = String(body.lastName).trim();
      if (!lastName) {
        return NextResponse.json({ ok: false, error: "Last name is required." }, { status: 400 });
      }
      updates.lastName = lastName;
    }

    if (body.displayName !== undefined) {
      const displayName = String(body.displayName).trim();
      if (!displayName) {
        return NextResponse.json({ ok: false, error: "Preferred name is required." }, { status: 400 });
      }
      updates.displayName = displayName;
    }

    if (body.gender !== undefined) updates.gender = optionalText(body.gender);
    if (body.schoolName !== undefined) updates.schoolName = optionalText(body.schoolName);
    if (body.gradeLabel !== undefined) updates.gradeLabel = optionalText(body.gradeLabel);
    if (body.cellPhone !== undefined) updates.cellPhone = optionalText(body.cellPhone);
    if (body.email !== undefined) updates.email = optionalText(body.email)?.toLowerCase() ?? null;
    if (body.birthdate !== undefined) updates.birthdate = optionalText(body.birthdate);
    if (body.learningNeeds !== undefined) updates.learningNeeds = optionalText(body.learningNeeds);
    if (body.availabilityNotes !== undefined) updates.availabilityNotes = optionalText(body.availabilityNotes);
    if (body.emergencyContact !== undefined) updates.emergencyContact = optionalText(body.emergencyContact);
    if (body.description !== undefined) updates.description = optionalText(body.description);
    if (body.zohoDealId !== undefined) updates.zohoDealId = optionalText(body.zohoDealId);
    if (body.zohoDealUrl !== undefined) updates.zohoDealUrl = optionalText(body.zohoDealUrl);
    if (body.academicYear !== undefined) updates.academicYear = optionalText(body.academicYear);
    if (body.preferredSchedule !== undefined) updates.preferredSchedule = optionalText(body.preferredSchedule);
    if (body.hoursRatePackage !== undefined) updates.hoursRatePackage = optionalText(body.hoursRatePackage);
    if (body.advancedHoursRatePackage !== undefined) {
      updates.advancedHoursRatePackage = optionalText(body.advancedHoursRatePackage);
    }
    if (body.paymentPlan !== undefined) updates.paymentPlan = optionalText(body.paymentPlan);
    if (body.addressLine1 !== undefined) updates.addressLine1 = optionalText(body.addressLine1);
    if (body.addressLine2 !== undefined) updates.addressLine2 = optionalText(body.addressLine2);
    if (body.city !== undefined) updates.city = optionalText(body.city);
    if (body.state !== undefined) updates.state = optionalText(body.state);
    if (body.postalCode !== undefined) updates.postalCode = optionalText(body.postalCode);
    if (body.country !== undefined) updates.country = optionalText(body.country) || HOUSEHOLD_COUNTRY_US;

    if (body.graduationYear !== undefined) {
      if (body.graduationYear === null) {
        updates.graduationYear = null;
      } else {
        const year = Math.floor(Number(body.graduationYear));
        if (!Number.isFinite(year) || year < 1990 || year > 2100) {
          return NextResponse.json({ ok: false, error: "Enter a valid graduation year." }, { status: 400 });
        }
        updates.graduationYear = year;
      }
    }

    if (body.depositCents !== undefined) {
      if (body.depositCents === null) {
        updates.depositCents = null;
      } else {
        const cents = Math.floor(Number(body.depositCents));
        if (!Number.isFinite(cents) || cents < 0) {
          return NextResponse.json({ ok: false, error: "Deposit must be zero or a positive amount." }, { status: 400 });
        }
        updates.depositCents = cents;
      }
    }

    if (body.supportNotesRestricted !== undefined) {
      updates.supportNotesRestricted = optionalText(body.supportNotesRestricted);
    }

    if (body.lifecycle !== undefined) {
      const lifecycle = String(body.lifecycle).trim();
      if (!LIFECYCLES.has(lifecycle)) {
        return NextResponse.json({ ok: false, error: "Invalid lifecycle." }, { status: 400 });
      }
      updates.lifecycle = lifecycle as typeof students.$inferSelect.lifecycle;
    }

    await database.update(students).set(updates).where(eq(students.id, id));

    if (body.subjectIds !== undefined) {
      const uniqueIds = [...new Set(body.subjectIds.map((value) => String(value).trim()).filter(Boolean))];
      if (uniqueIds.length > 0) {
        const activeSubjects = await database
          .select({ id: subjects.id })
          .from(subjects)
          .where(and(inArray(subjects.id, uniqueIds), eq(subjects.active, true)));
        if (activeSubjects.length !== uniqueIds.length) {
          return NextResponse.json(
            { ok: false, error: "One or more subjects are invalid or inactive." },
            { status: 400 },
          );
        }
      }
      await database.delete(studentSubjects).where(eq(studentSubjects.studentId, id));
      if (uniqueIds.length > 0) {
        await database.insert(studentSubjects).values(
          uniqueIds.map((subjectId) => ({
            studentId: id,
            subjectId,
          })),
        );
      }
    }

    if (existing.householdId && (body.lastName !== undefined || body.displayName !== undefined)) {
      const { refreshHouseholdDisplayNameIfAuto } = await import("@/lib/staff/household-display-name");
      await refreshHouseholdDisplayNameIfAuto(existing.householdId);
    }

    const detail = await loadStudentDetail(id);
    return NextResponse.json({ ok: true, student: detail });
  } catch (error) {
    console.warn("[staff/students/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update student." }, { status: 500 });
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
    const [existing] = await database.select({ id: students.id }).from(students).where(eq(students.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
    }

    const [bookingCount] = await database
      .select({ value: count() })
      .from(bookings)
      .where(eq(bookings.studentId, id));
    const [enrollmentCount] = await database
      .select({ value: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.studentId, id));

    if (Number(bookingCount?.value ?? 0) > 0 || Number(enrollmentCount?.value ?? 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Delete is only allowed when the student has no bookings or enrollments. Archive instead.",
        },
        { status: 400 },
      );
    }

    await database.delete(students).where(eq(students.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[staff/students/id] DELETE soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to delete student." }, { status: 500 });
  }
}
