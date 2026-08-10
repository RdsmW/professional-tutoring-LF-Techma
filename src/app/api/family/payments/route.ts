import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import {
  bookings,
  courseEnrollments,
  courseOfferings,
  paymentRecords,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";

function displayCode(id: string) {
  return `PT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function amountLabel(cents: number, currency: string) {
  const value = (cents / 100).toFixed(2);
  return currency.toUpperCase() === "USD" ? `$${value}` : `${value} ${currency.toUpperCase()}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.householdId, context.household.id))
      .orderBy(desc(paymentRecords.createdAt));

    const bookingIds = rows
      .filter((row) => row.relatedEntityType === "booking" && row.relatedEntityId)
      .map((row) => row.relatedEntityId as string);
    const enrollmentIds = rows
      .filter((row) => row.relatedEntityType === "course_enrollment" && row.relatedEntityId)
      .map((row) => row.relatedEntityId as string);

    const bookingMeta = new Map<
      string,
      { studentId: string; studentName: string; serviceLabel: string }
    >();
    if (bookingIds.length > 0) {
      const bookingRows = await database
        .select({
          id: bookings.id,
          studentId: bookings.studentId,
          studentName: students.displayName,
          subjectName: subjects.name,
          tutorName: tutors.displayName,
        })
        .from(bookings)
        .leftJoin(students, eq(bookings.studentId, students.id))
        .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
        .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
        .where(inArray(bookings.id, bookingIds));

      for (const row of bookingRows) {
        bookingMeta.set(row.id, {
          studentId: row.studentId,
          studentName: row.studentName ?? "Student",
          serviceLabel: [row.subjectName, row.tutorName].filter(Boolean).join(" · ") || "Tutoring",
        });
      }
    }

    const enrollmentMeta = new Map<
      string,
      { studentId: string; studentName: string; serviceLabel: string }
    >();
    if (enrollmentIds.length > 0) {
      const enrollmentRows = await database
        .select({
          id: courseEnrollments.id,
          studentId: courseEnrollments.studentId,
          studentName: students.displayName,
          courseName: courseOfferings.name,
        })
        .from(courseEnrollments)
        .leftJoin(students, eq(courseEnrollments.studentId, students.id))
        .leftJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
        .where(inArray(courseEnrollments.id, enrollmentIds));

      for (const row of enrollmentRows) {
        enrollmentMeta.set(row.id, {
          studentId: row.studentId,
          studentName: row.studentName ?? "Student",
          serviceLabel: row.courseName ?? "Course enrollment",
        });
      }
    }

    const householdMethod =
      context.household.cardLast4
        ? `Card ending ${context.household.cardLast4}`
        : "Payment method on file";

    const payments = rows.map((row) => {
      const relatedId = row.relatedEntityId;
      const booking = row.relatedEntityType === "booking" && relatedId ? bookingMeta.get(relatedId) : null;
      const enrollment =
        row.relatedEntityType === "course_enrollment" && relatedId
          ? enrollmentMeta.get(relatedId)
          : null;
      const meta = booking ?? enrollment;
      const baseDescription =
        row.relatedEntityType === "course_enrollment"
          ? "Course enrollment"
          : row.relatedEntityType === "booking"
            ? "Tutoring booking"
            : "Payment record";
      const description = row.notes?.trim() || baseDescription;
      const methodLabel = row.methodLabel?.trim() || householdMethod;

      return {
        id: row.id,
        displayCode: displayCode(row.id),
        createdAt: row.createdAt,
        description,
        amountCents: row.amountCents,
        amountLabel: amountLabel(row.amountCents, row.currency),
        status: row.status,
        statusLabel: statusLabel(row.status),
        methodLabel,
        creditLabel: "No refund or credit",
        relatedEntityType: row.relatedEntityType,
        relatedEntityId: row.relatedEntityId,
        studentId: meta?.studentId ?? null,
        studentName: meta?.studentName ?? null,
        serviceLabel: meta?.serviceLabel ?? baseDescription,
        notes: row.notes,
      };
    });

    return NextResponse.json({
      ok: true,
      savedCard: context.household.cardLast4
        ? {
            brand: context.household.cardBrand,
            last4: context.household.cardLast4,
          }
        : null,
      payments,
    });
  } catch (error) {
    console.warn("[family/payments] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load payments" }, { status: 500 });
  }
}
