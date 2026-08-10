import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getFamilyContext, listHouseholdStudents } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { courseOfferings } from "@/lib/db/schema";
import { FORM_META, formsForJourney } from "@/lib/forms";
import {
  formIdForCourseCode,
  paymentPlansForForm,
  slotOptionsForForm,
  type EnrollFormId,
} from "@/lib/enrollment/course-map";
import { isStripeConfigured as stripeReady } from "@/lib/stripe/client";

function centsToLabel(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export async function GET() {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    const database = requireDb();
    const studentRows = await listHouseholdStudents(context.household.id);
    const offeringRows = await database
      .select()
      .from(courseOfferings)
      .where(eq(courseOfferings.active, true));

    const journeyForms = new Set(formsForJourney("enroll_courses"));
    const courses = offeringRows
      .map((row) => {
        const formId = formIdForCourseCode(row.code);
        if (!formId || !journeyForms.has(formId)) return null;
        return {
          id: row.id,
          code: row.code,
          formId,
          name: row.name,
          title: FORM_META[formId].title,
          termLabel: row.termLabel,
          scheduleSummary: row.scheduleSummary,
          description: row.description,
          capacity: row.capacity,
          enrolledCount: row.enrolledCount,
          seatsRemaining: Math.max(0, row.capacity - row.enrolledCount),
          tuitionLabel: centsToLabel(row.tuitionCents),
          registrationFeeLabel: centsToLabel(row.registrationFeeCents),
          materialsFeeLabel: centsToLabel(row.materialsFeeCents),
          paymentPlans: paymentPlansForForm(formId),
          slotOptions: slotOptionsForForm(formId),
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => a.title.localeCompare(b.title));

    const plansByForm = Object.fromEntries(
      (["first_class", "express", "summer_master_class"] as EnrollFormId[]).map((formId) => [
        formId,
        paymentPlansForForm(formId),
      ]),
    );
    const slotsByForm = Object.fromEntries(
      (["first_class", "express", "summer_master_class"] as EnrollFormId[]).map((formId) => [
        formId,
        slotOptionsForForm(formId),
      ]),
    );

    return NextResponse.json({
      ok: true,
      householdStatus: context.household.status,
      stripeConfigured: stripeReady(),
      savedCard: context.household.cardLast4
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
      courses,
      plansByForm,
      slotsByForm,
    });
  } catch (error) {
    console.warn("[enroll-courses/options] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load enrollment options" }, { status: 500 });
  }
}
