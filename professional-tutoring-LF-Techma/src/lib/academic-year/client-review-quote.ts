const MONTHLY_RATES_CENTS = {
  std_2h: 46_000,
  std_4h: 91_000,
  std_6h: 136_000,
  std_8h: 181_000,
  adv_2h: 60_000,
  adv_4h: 120_000,
  adv_6h: 180_000,
  adv_8h: 240_000,
} as const;

export type ReviewInstallment = {
  label: string;
  amountCents: number;
  serviceFeeCents: number;
  dueAt: Date;
};

function academicYearStart(now: Date) {
  const year = now.getUTCFullYear();
  const septemberFirst = Date.UTC(year, 8, 1, 12, 0, 0);
  return now.getTime() <= septemberFirst ? year : year + 1;
}

function dueDate(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
}

function withCardFee(baseAmountCents: number) {
  const serviceFeeCents = Math.round((baseAmountCents * 360) / 10_000);
  return { amountCents: baseAmountCents + serviceFeeCents, serviceFeeCents };
}

export function buildAcademicYearReviewInstallments(paymentPlanId: string, packageCode: string, now = new Date()) {
  const monthlyAmountCents = MONTHLY_RATES_CENTS[packageCode as keyof typeof MONTHLY_RATES_CENTS];
  if (!monthlyAmountCents || packageCode.endsWith("_hourly")) return null;

  const startYear = academicYearStart(now);
  const baseInstallments =
    paymentPlanId === "full_year"
      ? [{ label: "Full Year tuition", amountCents: Math.round(monthlyAmountCents * 9.5 * 0.9), dueAt: dueDate(startYear, 8) }]
      : paymentPlanId === "semester"
        ? [
            { label: "Fall semester tuition", amountCents: Math.round(monthlyAmountCents * 5 * 0.95), dueAt: dueDate(startYear, 8) },
            { label: "Spring semester tuition", amountCents: Math.round(monthlyAmountCents * 4.5 * 0.95), dueAt: dueDate(startYear + 1, 1) },
          ]
        : Array.from({ length: 10 }, (_, index) => {
            const monthIndex = 8 + index;
            return {
              label: index === 9 ? "Monthly tuition June (half month)" : `Monthly tuition ${index + 1} of 10`,
              amountCents: index === 9 ? Math.round(monthlyAmountCents / 2) : monthlyAmountCents,
              dueAt: dueDate(startYear + Math.floor(monthIndex / 12), monthIndex % 12),
            };
          });

  return baseInstallments.map((installment) => ({
    ...installment,
    ...withCardFee(installment.amountCents),
  })) satisfies ReviewInstallment[];
}

export function formatReviewCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
}