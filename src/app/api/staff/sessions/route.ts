import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  courseEnrollments,
  courseOfferings,
  paymentRecords,
  students,
  subjects,
  tutors,
} from "@/lib/db/schema";
import { ACTIVE_ENROLLMENT_STATUSES } from "@/lib/enrollment/status";
import { getStaffContext } from "@/lib/staff/session";
import {
  PAYMENT_ISSUE_STATUSES,
  buildStaffSessionRows,
  startOfWeekNy,
  weekDays,
  weekRangeLabel,
} from "@/lib/staff/sessions-list";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const weekStart = startOfWeekNy();

    const [bookingRows, slotRows, courseRows, paymentRows] = await Promise.all([
      database
        .select({
          id: bookings.id,
          status: bookings.status,
          seatsClaimed: bookings.seatsClaimed,
          studentName: students.displayName,
          tutorId: bookings.tutorId,
          tutorName: tutors.displayName,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          subjectCategory: subjects.category,
          slotId: bookings.slotId,
          slotStart: availabilitySlots.startTimeLocal,
          slotEnd: availabilitySlots.endTimeLocal,
          slotDay: availabilitySlots.dayOfWeek,
          slotLabel: availabilitySlots.label,
        })
        .from(bookings)
        .innerJoin(students, eq(bookings.studentId, students.id))
        .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
        .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
        .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id)),
      database
        .select({
          id: availabilitySlots.id,
          tutorId: availabilitySlots.tutorId,
          tutorName: tutors.displayName,
          dayOfWeek: availabilitySlots.dayOfWeek,
          startTimeLocal: availabilitySlots.startTimeLocal,
          endTimeLocal: availabilitySlots.endTimeLocal,
          capacitySeats: availabilitySlots.capacitySeats,
          label: availabilitySlots.label,
          active: availabilitySlots.active,
        })
        .from(availabilitySlots)
        .innerJoin(tutors, eq(availabilitySlots.tutorId, tutors.id))
        .where(eq(availabilitySlots.active, true)),
      database
        .select({
          id: courseOfferings.id,
          name: courseOfferings.name,
          scheduleSummary: courseOfferings.scheduleSummary,
          enrolledCount: courseOfferings.enrolledCount,
          active: courseOfferings.active,
          ...("instructorName" in courseOfferings
            ? {
                instructorName: (courseOfferings as typeof courseOfferings & {
                  instructorName: typeof courseOfferings.name;
                }).instructorName,
              }
            : {}),
        })
        .from(courseOfferings)
        .where(eq(courseOfferings.active, true)),
      database
        .select({
          relatedEntityType: paymentRecords.relatedEntityType,
          relatedEntityId: paymentRecords.relatedEntityId,
          status: paymentRecords.status,
        })
        .from(paymentRecords)
        .where(inArray(paymentRecords.status, [...PAYMENT_ISSUE_STATUSES])),
    ]);

    const courseIds = courseRows.map((row) => row.id);
    const enrollmentCountMap = new Map<string, number>();
    const enrollmentCourseIds = new Map<string, string>();
    if (courseIds.length > 0) {
      const enrollmentRows = await database
        .select({
          id: courseEnrollments.id,
          courseOfferingId: courseEnrollments.courseOfferingId,
          status: courseEnrollments.status,
        })
        .from(courseEnrollments)
        .where(
          and(
            inArray(courseEnrollments.courseOfferingId, courseIds),
            inArray(courseEnrollments.status, [...ACTIVE_ENROLLMENT_STATUSES]),
          ),
        );
      for (const row of enrollmentRows) {
        enrollmentCourseIds.set(row.id, row.courseOfferingId);
        enrollmentCountMap.set(row.courseOfferingId, (enrollmentCountMap.get(row.courseOfferingId) ?? 0) + 1);
      }
    }

    const rows = buildStaffSessionRows({
      weekStart,
      bookings: bookingRows,
      slots: slotRows,
      courses: courseRows.map((row) => ({
        ...row,
        enrolledCount: enrollmentCountMap.get(row.id) ?? row.enrolledCount,
        instructorName:
          "instructorName" in row
            ? ((row as { instructorName?: string | null }).instructorName ?? null)
            : null,
      })),
      payments: paymentRows,
      enrollmentCourseIds,
    });

    return NextResponse.json({
      ok: true,
      weekLabel: weekRangeLabel(weekStart),
      weekDays: weekDays(weekStart),
      rows,
    });
  } catch (error) {
    console.warn("[staff/sessions] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load sessions." }, { status: 500 });
  }
}
