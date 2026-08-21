import { requireDb } from "@/lib/db";
import { tutoringRequests } from "@/lib/db/schema";

export type TutoringRequestPayload = Record<string, unknown>;

/** Request-only writer. Never inserts bookings, payment_records, or seat increments. */
type DbWriter = {
  insert: ReturnType<typeof requireDb>["insert"];
};

export async function createTutoringRequest(
  input: {
    householdId: string;
    studentId: string;
    subjectId: string;
    requestedByGuardianId: string | null;
    status: "pending_staff_review";
    preferredSlotId: string | null;
    scheduleNotes?: string | null;
    subjectNotes?: string | null;
    referralSource?: string | null;
    packageLabel?: string | null;
    policyVersionId?: string | null;
    agreementAcceptedAt?: Date | null;
    formId: string;
    formVersionId?: string | null;
    scheduleWindowId?: string | null;
    paymentPlanId?: string | null;
    payload: TutoringRequestPayload;
  },
  dbClient?: DbWriter,
) {
  const database = dbClient ?? requireDb();
  const now = new Date();
  const [row] = await database
    .insert(tutoringRequests)
    .values({
      householdId: input.householdId,
      studentId: input.studentId,
      subjectId: input.subjectId,
      requestedByGuardianId: input.requestedByGuardianId,
      status: input.status,
      preferredSlotId: input.preferredSlotId,
      scheduleNotes: input.scheduleNotes ?? null,
      subjectNotes: input.subjectNotes ?? null,
      referralSource: input.referralSource ?? null,
      packageLabel: input.packageLabel ?? null,
      policyVersionId: input.policyVersionId ?? null,
      agreementAcceptedAt: input.agreementAcceptedAt ?? null,
      formId: input.formId,
      formVersionId: input.formVersionId ?? null,
      scheduleWindowId: input.scheduleWindowId ?? null,
      paymentPlanId: input.paymentPlanId ?? null,
      payload: input.payload,
      updatedAt: now,
    })
    .returning();

  return row;
}
