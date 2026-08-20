import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { paymentRecords, type PriceQuoteBreakdown } from "@/lib/db/schema";
import { buildAcademicYearPaymentSchedule } from "@/lib/pricing/academic-year-payment-schedule";
import { insertPriceSnapshot } from "@/lib/pricing/snapshot";

const CONTINUATION_TTL_MS = 30 * 60 * 1000;

export type AyPublicPaymentContinuation = {
  token: string;
  expiresAt: string;
  paymentRecordId: string;
  paymentPlanId: "full_year" | "semester" | "monthly";
  amountCents: number;
  serviceFeeCents: number;
  dueAt: string;
  label: string;
  requiresCard: boolean;
  installmentCount: number;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function asPaymentPlan(value: string): "full_year" | "semester" | "monthly" {
  if (value === "full_year" || value === "semester" || value === "monthly") return value;
  throw new Error("Invalid Academic Year payment plan.");
}

export async function createAyPublicPaymentContinuation(input: {
  householdId: string;
  tutoringRequestId: string;
  schedulingPath: "family_selected" | "pt_chooses";
  paymentPlanId: string;
  hoursRatePackage?: string | null;
  advancedHoursRatePackage?: string | null;
  autoCharge: "yes" | "no";
  altPaymentMethod?: string | null;
}) {
  const paymentPlanId = asPaymentPlan(input.paymentPlanId);
  const now = new Date();
  const schedule = await buildAcademicYearPaymentSchedule({
    paymentPlanId,
    hoursRatePackage: input.hoursRatePackage,
    advancedHoursRatePackage: input.advancedHoursRatePackage,
    now,
  });
  const requiresCard = input.autoCharge === "yes";
  const surchargeBps = requiresCard ? 360 : 0;
  const chargedInstallments = schedule.installments.map((installment) => {
    const serviceFeeCents = surchargeBps ? Math.round((installment.amountCents * surchargeBps) / 10_000) : 0;
    return {
      ...installment,
      baseAmountCents: installment.amountCents,
      serviceFeeCents,
      amountCents: installment.amountCents + serviceFeeCents,
    };
  });
  const firstInstallment = chargedInstallments[0]!;
  const baseTotalCents = schedule.installments.reduce((sum, installment) => sum + installment.amountCents, 0);
  const totalCents = chargedInstallments.reduce((sum, installment) => sum + installment.amountCents, 0);
  const quote: PriceQuoteBreakdown = {
    program: "academic_tutoring",
    planCode: paymentPlanId,
    packageCode: schedule.packageCode,
    rateTier: schedule.rateTier,
    lines: chargedInstallments.flatMap((installment) => [
      {
      code: `installment_${installment.sequence}`,
      label: installment.label,
        amountCents: installment.baseAmountCents,
      },
      ...(installment.serviceFeeCents
        ? [
            {
              code: `card_service_fee_${installment.sequence}`,
              label: `3.6% card service fee — ${installment.label}`,
              amountCents: installment.serviceFeeCents,
            },
          ]
        : []),
    ]),
    subtotalCents: baseTotalCents,
    discountCents: Math.max(Math.round(schedule.monthlyAmountCents * 9.5) - baseTotalCents, 0),
    registrationFeeCents: 0,
    totalCents,
    surchargeBps,
    assumedPackage: false,
  };
  const snapshot = await insertPriceSnapshot(quote);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + CONTINUATION_TTL_MS);
  const billingScheduleId = randomUUID();
  const database = requireDb();
  const paymentRows = chargedInstallments.map((installment) => ({
    householdId: input.householdId,
    relatedEntityType: "tutoring_request",
    relatedEntityId: input.tutoringRequestId,
    billingScheduleId,
    installmentSequence: installment.sequence,
    installmentCount: schedule.installments.length,
    priceSnapshotId: snapshot.id,
    status: requiresCard ? ("pending" as const) : ("unpaid" as const),
    amountCents: installment.amountCents,
    methodLabel: requiresCard ? "Card scheduled collection" : input.altPaymentMethod ?? "Manual payment",
    dueAt: installment.dueAt,
    continuationTokenHash: installment.sequence === 1 ? tokenHash(token) : null,
    continuationExpiresAt: installment.sequence === 1 ? expiresAt : null,
    nextCollectionAttemptAt: requiresCard ? installment.dueAt : null,
    notes: JSON.stringify({
      source: "public_ay_tutoring",
      schedulingPath: input.schedulingPath,
      paymentPlanId,
      packageCode: schedule.packageCode,
      rateTier: schedule.rateTier,
      monthlyAmountCents: schedule.monthlyAmountCents,
      installmentSchedule: chargedInstallments.map((entry) => ({
        sequence: entry.sequence,
        amountCents: entry.amountCents,
         baseAmountCents: entry.baseAmountCents,
         serviceFeeCents: entry.serviceFeeCents,
        dueAt: entry.dueAt.toISOString(),
        label: entry.label,
      })),
      installmentLabel: installment.label,
      priceSnapshotId: snapshot.id,
      autoCharge: input.autoCharge,
      altPaymentMethod: input.altPaymentMethod ?? null,
    }),
    updatedAt: now,
  }));
  const payments = await database
    .insert(paymentRecords)
    .values(paymentRows)
    .returning({ id: paymentRecords.id, installmentSequence: paymentRecords.installmentSequence });
  const payment = payments.find((entry) => entry.installmentSequence === 1);
  if (!payment) throw new Error("Unable to create the first Academic Year payment installment.");

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    paymentRecordId: payment.id,
    paymentPlanId,
    amountCents: firstInstallment.amountCents,
    serviceFeeCents: firstInstallment.serviceFeeCents,
    dueAt: firstInstallment.dueAt.toISOString(),
    label: firstInstallment.label,
    requiresCard,
    installmentCount: schedule.installments.length,
  } satisfies AyPublicPaymentContinuation;
}

export async function findAyPublicPaymentContinuation(token: string) {
  if (!token || token.length < 32) return null;
  const database = requireDb();
  const [payment] = await database
    .select()
    .from(paymentRecords)
    .where(
      and(
        eq(paymentRecords.continuationTokenHash, tokenHash(token)),
        gt(paymentRecords.continuationExpiresAt, new Date()),
      ),
    )
    .limit(1);
  return payment ?? null;
}