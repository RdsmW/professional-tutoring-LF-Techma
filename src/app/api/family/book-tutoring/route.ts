import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import {
  availabilitySlots,
  bookings,
  paymentRecords,
  students,
  subjects,
  tutorSubjects,
  tutoringRequests,
  tutors,
} from "@/lib/db/schema";
import { catalogSubjectToDbCode } from "@/lib/booking/subject-map";
import { isValidOptionId } from "@/lib/forms/options";
import { FORM_META } from "@/lib/forms/form-profiles";
import { resolveFamilyPaymentMethod } from "@/lib/family/resolve-payment-method";

type BookBody = {
  studentId?: string;
  formId?: "academic_year_tutoring" | "summer_tutoring";
  subjectCode?: string;
  subjectNotes?: string;
  windowId?: string;
  summerDateRange?: string;
  scheduleNotes?: string;
  tutorId?: string;
  slotId?: string;
  paymentPlanId?: string;
  policyAck?: boolean;
  /** Save this card on the household for future charges. */
  saveCardForFuture?: boolean;
  /** @deprecated alias for saveCardForFuture */
  paymentMethodConsent?: boolean;
  paymentMethodId?: string;
};

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    if (context.household.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Complete family onboarding before booking tutoring." },
        { status: 400 },
      );
    }

    if (!context.guardian.canRequestServices) {
      return NextResponse.json({ ok: false, error: "Not allowed to request tutoring." }, { status: 403 });
    }

    const body = (await request.json()) as BookBody;
    const studentId = (body.studentId ?? "").trim();
    const formId = body.formId;
    const subjectCode = (body.subjectCode ?? "").trim();
    const windowId = (body.windowId ?? "").trim();
    const tutorId = (body.tutorId ?? "").trim();
    const slotId = (body.slotId ?? "").trim();
    const paymentPlanId = (body.paymentPlanId ?? "").trim();

    if (!studentId || !formId || !subjectCode || !windowId || !tutorId || !slotId || !paymentPlanId) {
      return NextResponse.json({ ok: false, error: "Missing required booking fields." }, { status: 400 });
    }

    if (formId !== "academic_year_tutoring" && formId !== "summer_tutoring") {
      return NextResponse.json({ ok: false, error: "Invalid tutoring service." }, { status: 400 });
    }

    if (!isValidOptionId("ACADEMIC_SUBJECTS", subjectCode)) {
      return NextResponse.json({ ok: false, error: "Invalid subject." }, { status: 400 });
    }

    const windowList = formId === "summer_tutoring" ? "SUMMER_SCHEDULE_WINDOWS" : "ACADEMIC_SCHEDULE_WINDOWS";
    const planList = formId === "summer_tutoring" ? "SUMMER_PAYMENT_PLANS" : "ACADEMIC_PAYMENT_PLANS";
    if (!isValidOptionId(windowList, windowId)) {
      return NextResponse.json({ ok: false, error: "Invalid schedule window." }, { status: 400 });
    }
    if (!isValidOptionId(planList, paymentPlanId)) {
      return NextResponse.json({ ok: false, error: "Invalid payment plan." }, { status: 400 });
    }

    if (!body.policyAck) {
      return NextResponse.json({ ok: false, error: "Policy acknowledgement is required." }, { status: 400 });
    }

    const saveCardForFuture = Boolean(body.saveCardForFuture ?? body.paymentMethodConsent);
    const payment = await resolveFamilyPaymentMethod(context, {
      paymentMethodId: body.paymentMethodId,
      saveForFuture: saveCardForFuture,
    });
    if (!payment.ok) {
      return NextResponse.json({ ok: false, error: payment.error }, { status: payment.status });
    }

    const database = requireDb();
    const [studentRow] = await database
      .select()
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.householdId, context.household.id)))
      .limit(1);

    if (!studentRow) {
      return NextResponse.json({ ok: false, error: "Student not found in this household." }, { status: 404 });
    }

    const dbCode = catalogSubjectToDbCode(subjectCode);
    const [subject] = await database.select().from(subjects).where(eq(subjects.code, dbCode)).limit(1);
    if (!subject) {
      return NextResponse.json({ ok: false, error: "Subject is not bookable yet." }, { status: 400 });
    }

    const [tutorLink] = await database
      .select({
        tutorId: tutors.id,
        displayName: tutors.displayName,
      })
      .from(tutors)
      .innerJoin(tutorSubjects, eq(tutorSubjects.tutorId, tutors.id))
      .where(and(eq(tutors.id, tutorId), eq(tutors.active, true), eq(tutorSubjects.subjectId, subject.id)))
      .limit(1);

    if (!tutorLink) {
      return NextResponse.json({ ok: false, error: "Tutor is not available for this subject." }, { status: 400 });
    }

    const [slot] = await database
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.tutorId, tutorId),
          eq(availabilitySlots.active, true),
          eq(availabilitySlots.scheduleWindowId, windowId),
          sql`${availabilitySlots.bookedSeats} + ${availabilitySlots.heldSeats} < ${availabilitySlots.capacitySeats}`,
        ),
      )
      .limit(1);

    if (!slot) {
      return NextResponse.json({ ok: false, error: "Selected slot is no longer available." }, { status: 409 });
    }

    const now = new Date();
    const [requestRow] = await database
      .insert(tutoringRequests)
      .values({
        householdId: context.household.id,
        studentId,
        subjectId: subject.id,
        requestedByGuardianId: context.guardian.id,
        status: "submitted",
        preferredSlotId: slotId,
        subjectNotes: (body.subjectNotes ?? "").trim() || null,
        scheduleNotes: (body.scheduleNotes ?? "").trim() || null,
        packageLabel: paymentPlanId,
        agreementAcceptedAt: now,
        formId,
        scheduleWindowId: windowId,
        paymentPlanId,
        payload: {
          catalogSubjectCode: subjectCode,
          summerDateRange: (body.summerDateRange ?? "").trim() || null,
          serviceTitle: FORM_META[formId].title,
        },
        updatedAt: now,
      })
      .returning();

    const [booking] = await database
      .insert(bookings)
      .values({
        tutoringRequestId: requestRow.id,
        householdId: context.household.id,
        studentId,
        subjectId: subject.id,
        tutorId,
        slotId,
        status: "pending_payment",
        seatsClaimed: 1,
        updatedAt: now,
      })
      .returning();

    await database
      .update(availabilitySlots)
      .set({
        bookedSeats: sql`${availabilitySlots.bookedSeats} + 1`,
        updatedAt: now,
      })
      .where(eq(availabilitySlots.id, slotId));

    await database.insert(paymentRecords).values({
      householdId: context.household.id,
      relatedEntityType: "booking",
      relatedEntityId: booking.id,
      status: "pending",
      amountCents: 0,
      methodLabel: payment.value.methodLabel,
      stripeCustomerId: payment.value.customerId,
      notes: `Payment plan: ${paymentPlanId}`,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        tutorName: tutorLink.displayName,
        studentName: studentRow.displayName,
        serviceTitle: FORM_META[formId].title,
        windowId,
        paymentPlanId,
      },
    });
  } catch (error) {
    console.warn("[book-tutoring] POST fail", error);
    return NextResponse.json({ ok: false, error: "Unable to confirm booking" }, { status: 500 });
  }
}
