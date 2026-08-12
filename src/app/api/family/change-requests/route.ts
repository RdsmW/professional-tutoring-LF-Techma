import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getFamilyContext } from "@/lib/family/session";
import { requireDb } from "@/lib/db";
import { bookings, changeRequests, courseEnrollments } from "@/lib/db/schema";
import {
  isChangeReason,
  isChangeType,
  isRequestedOutcome,
  policyRecommendationDetail,
  requiresAlternatives,
} from "@/lib/family/change-policy";
import { loadActiveCancellationPolicy } from "@/lib/policy/cancellation";

type ChangeBody = {
  relatedEntityType?: string;
  relatedEntityId?: string;
  changeType?: string;
  reason?: string;
  requestedOutcome?: string;
  preferredAlternatives?: string;
};

export async function POST(request: Request) {
  try {
    const context = await getFamilyContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Family household not found" }, { status: 404 });
    }

    if (context.household.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Complete family onboarding before requesting changes." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as ChangeBody;
    const relatedEntityType = (body.relatedEntityType ?? "").trim();
    const relatedEntityId = (body.relatedEntityId ?? "").trim();
    const changeTypeRaw = (body.changeType ?? "").trim();
    const reasonRaw = (body.reason ?? "").trim();
    const requestedOutcomeRaw = (body.requestedOutcome ?? "").trim();
    const preferredAlternatives = (body.preferredAlternatives ?? "").trim();

    if (!relatedEntityId || (relatedEntityType !== "booking" && relatedEntityType !== "course_enrollment")) {
      return NextResponse.json({ ok: false, error: "Select a booking or course enrollment." }, { status: 400 });
    }
    if (!isChangeType(changeTypeRaw) || !isChangeReason(reasonRaw) || !isRequestedOutcome(requestedOutcomeRaw)) {
      return NextResponse.json({ ok: false, error: "Invalid change request fields." }, { status: 400 });
    }
    if (requiresAlternatives(changeTypeRaw) && !preferredAlternatives) {
      return NextResponse.json(
        { ok: false, error: "Preferred alternative dates / times are required for this change type." },
        { status: 400 },
      );
    }

    const database = requireDb();
    let studentId: string | null = null;

    if (relatedEntityType === "booking") {
      const [booking] = await database
        .select({
          id: bookings.id,
          studentId: bookings.studentId,
        })
        .from(bookings)
        .where(and(eq(bookings.id, relatedEntityId), eq(bookings.householdId, context.household.id)))
        .limit(1);
      if (!booking) {
        return NextResponse.json({ ok: false, error: "Booking not found in this household." }, { status: 404 });
      }
      studentId = booking.studentId;
    } else {
      const [enrollment] = await database
        .select({
          id: courseEnrollments.id,
          studentId: courseEnrollments.studentId,
        })
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.id, relatedEntityId),
            eq(courseEnrollments.householdId, context.household.id),
          ),
        )
        .limit(1);
      if (!enrollment) {
        return NextResponse.json(
          { ok: false, error: "Course enrollment not found in this household." },
          { status: 404 },
        );
      }
      studentId = enrollment.studentId;
    }

    const policy = await loadActiveCancellationPolicy();
    const recommendation = policyRecommendationDetail(
      reasonRaw,
      requestedOutcomeRaw,
      policy.rules,
      policy.code,
    );
    const now = new Date();

    const [created] = await database
      .insert(changeRequests)
      .values({
        householdId: context.household.id,
        studentId,
        requestedByGuardianId: context.guardian.id,
        relatedEntityType,
        relatedEntityId,
        changeType: changeTypeRaw,
        reason: reasonRaw,
        requestedOutcome: requestedOutcomeRaw,
        preferredAlternatives: preferredAlternatives || null,
        policyRecommendation: recommendation,
        cancellationPolicyVersionId: policy.id,
        status: "submitted",
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      changeRequest: {
        id: created.id,
        relatedEntityType: created.relatedEntityType,
        relatedEntityId: created.relatedEntityId,
        changeType: created.changeType,
        reason: created.reason,
        requestedOutcome: created.requestedOutcome,
        preferredAlternatives: created.preferredAlternatives,
        policyRecommendation: created.policyRecommendation,
        status: created.status,
        createdAt: created.createdAt,
        open: true,
      },
    });
  } catch (error) {
    console.warn("[family/change-requests] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to submit change request" }, { status: 500 });
  }
}
