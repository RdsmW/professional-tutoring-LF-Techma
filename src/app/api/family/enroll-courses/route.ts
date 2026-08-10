import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { courseEnrollments, courseOfferings, paymentRecords, students } from "@/lib/db/schema";
import { FORM_META } from "@/lib/forms/form-profiles";
import { isValidOptionId } from "@/lib/forms/options";
import {
  formIdForCourseCode,
  isEnrollFormId,
  paymentPlanListId,
  slotOptionsForForm,
  slotPreferenceListId,
} from "@/lib/enrollment/course-map";

type EnrollBody = {
  studentId?: string;
  courseOfferingId?: string;
  formId?: string;
  paymentPlanId?: string;
  slotPreference?: string | string[];
  policyAck?: boolean;
  paymentMethodConsent?: boolean;
};

function normalizeSlotPreference(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  const single = (value ?? "").trim();
  return single ? [single] : [];
}

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    if (context.household.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Complete family onboarding before enrolling in courses." },
        { status: 400 },
      );
    }

    if (!context.guardian.canRequestServices) {
      return NextResponse.json({ ok: false, error: "Not allowed to request course enrollment." }, { status: 403 });
    }

    const body = (await request.json()) as EnrollBody;
    const studentId = (body.studentId ?? "").trim();
    const courseOfferingId = (body.courseOfferingId ?? "").trim();
    const formIdRaw = (body.formId ?? "").trim();
    const paymentPlanId = (body.paymentPlanId ?? "").trim();
    const slotPreferences = normalizeSlotPreference(body.slotPreference);

    if (!studentId || !courseOfferingId || !formIdRaw || !paymentPlanId) {
      return NextResponse.json({ ok: false, error: "Missing required enrollment fields." }, { status: 400 });
    }

    if (!isEnrollFormId(formIdRaw)) {
      return NextResponse.json({ ok: false, error: "Invalid course form." }, { status: 400 });
    }
    const formId = formIdRaw;

    if (!isValidOptionId(paymentPlanListId(formId), paymentPlanId)) {
      return NextResponse.json({ ok: false, error: "Invalid payment plan." }, { status: 400 });
    }

    const slotListId = slotPreferenceListId(formId);
    if (formId === "first_class") {
      if (slotPreferences.length !== 1 || !slotListId || !isValidOptionId(slotListId, slotPreferences[0])) {
        return NextResponse.json({ ok: false, error: "Select a First Class time slot." }, { status: 400 });
      }
    } else if (formId === "summer_master_class") {
      if (
        slotPreferences.length === 0 ||
        !slotListId ||
        slotPreferences.some((id) => !isValidOptionId(slotListId, id))
      ) {
        return NextResponse.json(
          { ok: false, error: "Select at least one Master Class session preference." },
          { status: 400 },
        );
      }
    } else if (slotPreferences.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Express does not accept class-time preferences yet." },
        { status: 400 },
      );
    }

    if (!body.policyAck) {
      return NextResponse.json({ ok: false, error: "Policy acknowledgement is required." }, { status: 400 });
    }

    if (!body.paymentMethodConsent) {
      return NextResponse.json(
        { ok: false, error: "Permission to save/use a payment method is required." },
        { status: 400 },
      );
    }

    if (!context.household.stripeDefaultPaymentMethodId || !context.household.paymentMethodConsentAt) {
      return NextResponse.json(
        { ok: false, error: "Save a payment method before confirming enrollment." },
        { status: 400 },
      );
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

    const [offering] = await database
      .select()
      .from(courseOfferings)
      .where(and(eq(courseOfferings.id, courseOfferingId), eq(courseOfferings.active, true)))
      .limit(1);

    if (!offering) {
      return NextResponse.json({ ok: false, error: "Course offering not found." }, { status: 404 });
    }

    const mappedForm = formIdForCourseCode(offering.code);
    if (mappedForm !== formId) {
      return NextResponse.json({ ok: false, error: "Course and form do not match." }, { status: 400 });
    }

    if (offering.enrolledCount >= offering.capacity) {
      return NextResponse.json({ ok: false, error: "This course cohort is full." }, { status: 409 });
    }

    const now = new Date();
    const slotLabels = slotOptionsForForm(formId)
      .filter((option) => slotPreferences.includes(option.id))
      .map((option) => option.label);
    const scheduleLabel =
      slotLabels.length > 0
        ? slotLabels.join("; ")
        : offering.scheduleSummary || "Schedule pending client confirmation";

    const [enrollment] = await database
      .insert(courseEnrollments)
      .values({
        courseOfferingId: offering.id,
        householdId: context.household.id,
        studentId,
        requestedByGuardianId: context.guardian.id,
        status: "submitted",
        requestedSlotPreference: slotPreferences.length > 0 ? slotPreferences.join(",") : null,
        notes: JSON.stringify({
          formId,
          paymentPlanId,
          scheduleLabel,
        }),
        updatedAt: now,
      })
      .returning();

    await database
      .update(courseOfferings)
      .set({
        enrolledCount: sql`${courseOfferings.enrolledCount} + 1`,
        updatedAt: now,
      })
      .where(eq(courseOfferings.id, offering.id));

    await database.insert(paymentRecords).values({
      householdId: context.household.id,
      relatedEntityType: "course_enrollment",
      relatedEntityId: enrollment.id,
      status: "pending",
      amountCents: 0,
      methodLabel: `${context.household.cardBrand || "card"} ···· ${context.household.cardLast4 || "****"}`,
      stripeCustomerId: context.household.stripeCustomerId,
      notes: `Payment plan: ${paymentPlanId}`,
      updatedAt: now,
    });

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        courseName: offering.name,
        studentName: studentRow.displayName,
        paymentPlanId,
        scheduleLabel,
        formTitle: FORM_META[formId].title,
      },
    });
  } catch (error) {
    console.warn("[enroll-courses] POST fail", error);
    return NextResponse.json({ ok: false, error: "Unable to confirm enrollment" }, { status: 500 });
  }
}
