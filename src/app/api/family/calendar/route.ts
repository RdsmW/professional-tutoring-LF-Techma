import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  changeRequests,
  courseEnrollments,
  courseOfferings,
  subjects,
  tutors,
} from "@/lib/db/schema";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const database = requireDb();
    const studentRows = await listHouseholdStudents(context.household.id);

    const bookingRows = await database
      .select({
        id: bookings.id,
        status: bookings.status,
        studentId: bookings.studentId,
        createdAt: bookings.createdAt,
        tutorName: tutors.displayName,
        subjectName: subjects.name,
        slotLabel: availabilitySlots.label,
        startTimeLocal: availabilitySlots.startTimeLocal,
        endTimeLocal: availabilitySlots.endTimeLocal,
        dayOfWeek: availabilitySlots.dayOfWeek,
      })
      .from(bookings)
      .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
      .leftJoin(subjects, eq(bookings.subjectId, subjects.id))
      .leftJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
      .where(eq(bookings.householdId, context.household.id))
      .orderBy(desc(bookings.createdAt));

    const enrollmentRows = await database
      .select({
        id: courseEnrollments.id,
        status: courseEnrollments.status,
        studentId: courseEnrollments.studentId,
        createdAt: courseEnrollments.createdAt,
        courseName: courseOfferings.name,
        scheduleSummary: courseOfferings.scheduleSummary,
        notes: courseEnrollments.notes,
      })
      .from(courseEnrollments)
      .leftJoin(courseOfferings, eq(courseEnrollments.courseOfferingId, courseOfferings.id))
      .where(eq(courseEnrollments.householdId, context.household.id))
      .orderBy(desc(courseEnrollments.createdAt));

    const changeRows = await database
      .select()
      .from(changeRequests)
      .where(eq(changeRequests.householdId, context.household.id))
      .orderBy(desc(changeRequests.createdAt));

    const openStatuses = ["submitted", "under_review"] as const;
    const openChanges = changeRows.filter((row) =>
      (openStatuses as readonly string[]).includes(row.status),
    );

    const bookingItems = bookingRows.map((row) => {
      const student = studentRows.find((item) => item.id === row.studentId);
      const day = row.dayOfWeek != null ? DAY_NAMES[row.dayOfWeek] ?? "" : "";
      const time =
        row.slotLabel ||
        [day, row.startTimeLocal && row.endTimeLocal ? `${row.startTimeLocal}–${row.endTimeLocal}` : null]
          .filter(Boolean)
          .join(" · ");
      return {
        id: row.id,
        kind: "booking" as const,
        status: row.status,
        studentId: row.studentId,
        studentName: student?.displayName ?? "Student",
        title: row.subjectName ?? "Tutoring",
        subtitle: [row.tutorName, "Individual tutoring"].filter(Boolean).join(" · "),
        timeLabel: time || "Schedule pending",
        tutorName: row.tutorName,
        courseName: null as string | null,
        createdAt: row.createdAt,
      };
    });

    const enrollmentItems = enrollmentRows.map((row) => {
      const student = studentRows.find((item) => item.id === row.studentId);
      let scheduleLabel = row.scheduleSummary || "Schedule pending";
      if (row.notes) {
        try {
          const parsed = JSON.parse(row.notes) as { scheduleLabel?: string };
          if (parsed.scheduleLabel) scheduleLabel = parsed.scheduleLabel;
        } catch {
          // keep summary
        }
      }
      return {
        id: row.id,
        kind: "enrollment" as const,
        status: row.status,
        studentId: row.studentId,
        studentName: student?.displayName ?? "Student",
        title: row.courseName ?? "Course",
        subtitle: "Course enrollment",
        timeLabel: scheduleLabel,
        tutorName: null as string | null,
        courseName: row.courseName,
        createdAt: row.createdAt,
      };
    });

    const items = [...bookingItems, ...enrollmentItems].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      ok: true,
      householdName: context.household.displayName,
      items: items.map(({ createdAt: _createdAt, ...item }) => item),
      changeRequests: changeRows.map((row) => ({
        id: row.id,
        relatedEntityType: row.relatedEntityType,
        relatedEntityId: row.relatedEntityId,
        changeType: row.changeType,
        reason: row.reason,
        requestedOutcome: row.requestedOutcome,
        preferredAlternatives: row.preferredAlternatives,
        policyRecommendation: row.policyRecommendation,
        status: row.status,
        createdAt: row.createdAt,
        open: (openStatuses as readonly string[]).includes(row.status),
      })),
      openChangeCount: openChanges.length,
    });
  } catch (error) {
    console.warn("[family/calendar] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load calendar" }, { status: 500 });
  }
}
