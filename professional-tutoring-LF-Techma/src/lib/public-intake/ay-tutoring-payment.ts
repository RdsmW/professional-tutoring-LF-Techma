import { createHash, randomBytes } from "node:crypto";
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
  dueAt: string;
  label: string;
  requiresCard: boolean;
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
  const firstInstallment = schedule.installments[0]!;
  const totalCents = schedule.installments.reduce((sum, installment) => sum + installment.amountCents, 0);
  const quote: PriceQuoteBreakdown = {
    program: "academic_tutoring",
    planCode: paymentPlanId,
    packageCode: schedule.packageCode,
    rateTier: schedule.rateTier,
    lines: schedule.installments.map((installment) => ({
      code: `installment_${installment.sequence}`,
      label: installment.label,
      amountCents: installment.amountCents,
    })),
    subtotalCents: schedule.monthlyAmountCents * 10,
    discountCents: schedule.monthlyAmountCents * 10 - totalCents,
    registrationFeeCents: 0,
    totalCents: firstInstallment.amountCents,
    surchargeBps: 0,
    assumedPackage: false,
  };
  const snapshot = await insertPriceSnapshot(quote);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + CONTINUATION_TTL_MS);
  const requiresCard = input.autoCharge === "yes";
  const database = requireDb();
  const [payment] = await database
    .insert(paymentRecords)
    .values({
      householdId: input.householdId,
      relatedEntityType: "tutoring_request",
      relatedEntityId: input.tutoringRequestId,
      status: requiresCard ? "pending" : "unpaid",
      amountCents: firstInstallment.amountCents,
      methodLabel: requiresCard ? "Card pending setup" : input.altPaymentMethod ?? "Manual payment",
      dueAt: firstInstallment.dueAt,
      continuationTokenHash: tokenHash(token),
      continuationExpiresAt: expiresAt,
      notes: JSON.stringify({
        source: "public_ay_tutoring",
        schedulingPath: input.schedulingPath,
        paymentPlanId,
        packageCode: schedule.packageCode,
        rateTier: schedule.rateTier,
        monthlyAmountCents: schedule.monthlyAmountCents,
        installmentSchedule: schedule.installments.map((installment) => ({
          sequence: installment.sequence,
          amountCents: installment.amountCents,
          dueAt: installment.dueAt.toISOString(),
          label: installment.label,
        })),
        priceSnapshotId: snapshot.id,
        autoCharge: input.autoCharge,
        altPaymentMethod: input.altPaymentMethod ?? null,
      }),
      updatedAt: now,
    })
    .returning({ id: paymentRecords.id });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    paymentRecordId: payment.id,
    paymentPlanId,
    amountCents: firstInstallment.amountCents,
    dueAt: firstInstallment.dueAt.toISOString(),
    label: firstInstallment.label,
    requiresCard,
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