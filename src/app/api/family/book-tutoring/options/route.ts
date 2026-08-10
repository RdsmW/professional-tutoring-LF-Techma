import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  subjects,
  tutorSubjects,
  tutors,
} from "@/lib/db/schema";
import { catalogSubjectToDbCode } from "@/lib/booking/subject-map";
import {
  ACADEMIC_PAYMENT_PLANS,
  ACADEMIC_SCHEDULE_WINDOWS,
  ACADEMIC_SUBJECTS,
  FORM_META,
  SUMMER_PAYMENT_PLANS,
  SUMMER_SCHEDULE_WINDOWS,
  formsForJourney,
} from "@/lib/forms";
import { isStripeConfigured as stripeReady } from "@/lib/stripe/client";

export async function GET(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const subjectCodeParam = (searchParams.get("subjectCode") || "").trim();
    const windowId = (searchParams.get("windowId") || "").trim();
    const tutorId = (searchParams.get("tutorId") || "").trim();

    const database = requireDb();
    const studentRows = await listHouseholdStudents(context.household.id);
    const services = formsForJourney("book_tutoring").map((id) => ({
      id,
      title: FORM_META[id].title,
      description: FORM_META[id].url,
    }));

    let matchedTutors: Array<{
      id: string;
      displayName: string;
      notes: string | null;
      openSlots: number;
    }> = [];
    let slots: Array<{
      id: string;
      label: string | null;
      dayOfWeek: number;
      startTimeLocal: string;
      endTimeLocal: string;
      openSeats: number;
      scheduleWindowId: string | null;
    }> = [];

    if (subjectCodeParam && windowId) {
      const dbCode = catalogSubjectToDbCode(subjectCodeParam);
      const [subject] = await database
        .select()
        .from(subjects)
        .where(eq(subjects.code, dbCode))
        .limit(1);

      if (subject) {
        const tutorRows = await database
          .select({
            id: tutors.id,
            displayName: tutors.displayName,
            notes: tutors.notes,
          })
          .from(tutors)
          .innerJoin(tutorSubjects, eq(tutorSubjects.tutorId, tutors.id))
          .where(and(eq(tutors.active, true), eq(tutorSubjects.subjectId, subject.id)));

        const uniqueTutors = new Map(tutorRows.map((row) => [row.id, row]));

        for (const tutor of uniqueTutors.values()) {
          const openSlotRows = await database
            .select()
            .from(availabilitySlots)
            .where(
              and(
                eq(availabilitySlots.tutorId, tutor.id),
                eq(availabilitySlots.active, true),
                eq(availabilitySlots.scheduleWindowId, windowId),
                sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
              ),
            );

          if (openSlotRows.length > 0) {
            matchedTutors.push({
              id: tutor.id,
              displayName: tutor.displayName,
              notes: tutor.notes,
              openSlots: openSlotRows.length,
            });
          }
        }

        if (tutorId) {
          const slotRows = await database
            .select()
            .from(availabilitySlots)
            .where(
              and(
                eq(availabilitySlots.tutorId, tutorId),
                eq(availabilitySlots.active, true),
                eq(availabilitySlots.scheduleWindowId, windowId),
                sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
              ),
            );
          slots = slotRows.map((slot) => ({
            id: slot.id,
            label: slot.label,
            dayOfWeek: slot.dayOfWeek,
            startTimeLocal: slot.startTimeLocal,
            endTimeLocal: slot.endTimeLocal,
            openSeats: slot.capacitySeats - slot.bookedSeats - slot.heldSeats,
            scheduleWindowId: slot.scheduleWindowId,
          }));
        }
      }
    }

    return NextResponse.json({
      ok: true,
      householdStatus: context.household.status,
      stripeConfigured: stripeReady(),
      savedCard:
        context.household.cardLast4
          ? {
              brand: context.household.cardBrand,
              last4: context.household.cardLast4,
              paymentMethodId: context.household.stripeDefaultPaymentMethodId,
              consentAt: context.household.paymentMethodConsentAt,
            }
          : null,
      students: studentRows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        gradeLabel: row.gradeLabel,
        schoolName: row.schoolName,
      })),
      services,
      subjects: ACADEMIC_SUBJECTS.options,
      academicWindows: ACADEMIC_SCHEDULE_WINDOWS.options,
      summerWindows: SUMMER_SCHEDULE_WINDOWS.options,
      academicPaymentPlans: ACADEMIC_PAYMENT_PLANS.options,
      summerPaymentPlans: SUMMER_PAYMENT_PLANS.options,
      tutors: matchedTutors,
      slots,
    });
  } catch (error) {
    console.warn("[book-tutoring/options] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load booking options" }, { status: 500 });
  }
}
