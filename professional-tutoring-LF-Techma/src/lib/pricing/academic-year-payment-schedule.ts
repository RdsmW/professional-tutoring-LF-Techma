import { buildQuote } from "@/lib/pricing/quote";

export type AcademicYearPaymentPlan = "full_year" | "semester" | "monthly";

export type AcademicYearInstallment = {
  sequence: number;
  amountCents: number;
  dueAt: Date;
  label: string;
};

export type AcademicYearPaymentSchedule = {
  planId: AcademicYearPaymentPlan;
  packageCode: string;
  rateTier: "standard" | "advanced";
  monthlyAmountCents: number;
  discountBps: number;
  installments: AcademicYearInstallment[];
};

function academicYearStart(now: Date) {
  const year = now.getUTCFullYear();
  const septemberFirst = Date.UTC(year, 8, 1, 12, 0, 0);
  return now.getTime() <= septemberFirst ? year : year + 1;
}

function dueDate(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
}

function centsWithDiscount(amountCents: number, discountBps: number) {
  return Math.max(amountCents - Math.round((amountCents * discountBps) / 10_000), 0);
}

export async function buildAcademicYearPaymentSchedule(input: {
  paymentPlanId: string;
  hoursRatePackage?: string | null;
  advancedHoursRatePackage?: string | null;
  now?: Date;
}): Promise<AcademicYearPaymentSchedule> {
  if (
    input.paymentPlanId !== "full_year" &&
    input.paymentPlanId !== "semester" &&
    input.paymentPlanId !== "monthly"
  ) {
    throw new Error("Invalid Academic Year payment plan.");
  }

  const packageCode = input.hoursRatePackage?.trim() || input.advancedHoursRatePackage?.trim() || "";
  if (!packageCode) {
    throw new Error("Choose an hours/rate package before payment.");
  }
  if (packageCode.endsWith("_hourly")) {
    throw new Error("Hourly Academic Year tutoring requires a staff-set amount before payment.");
  }

  const monthlyQuote = await buildQuote({
    program: "academic_tutoring",
    planCode: "monthly",
    packageCode,
    rateTier: packageCode.startsWith("adv_") ? "advanced" : "standard",
  });
  const monthlyAmountCents = monthlyQuote.totalCents;
  const startYear = academicYearStart(input.now ?? new Date());
  const rateTier = packageCode.startsWith("adv_") ? "advanced" : "standard";

  if (input.paymentPlanId === "full_year") {
    return {
      planId: "full_year",
      packageCode,
      rateTier,
      monthlyAmountCents,
      discountBps: 1000,
      installments: [
        {
          sequence: 1,
          amountCents: centsWithDiscount(Math.round(monthlyAmountCents * 9.5), 1000),
          dueAt: dueDate(startYear, 8),
          label: "Full Year tuition",
        },
      ],
    };
  }

  if (input.paymentPlanId === "semester") {
    const fallSemesterAmountCents = centsWithDiscount(monthlyAmountCents * 5, 500);
    const springSemesterAmountCents = centsWithDiscount(Math.round(monthlyAmountCents * 4.5), 500);
    return {
      planId: "semester",
      packageCode,
      rateTier,
      monthlyAmountCents,
      discountBps: 500,
      installments: [
        {
          sequence: 1,
          amountCents: fallSemesterAmountCents,
          dueAt: dueDate(startYear, 8),
          label: "Fall semester tuition",
        },
        {
          sequence: 2,
          amountCents: springSemesterAmountCents,
          dueAt: dueDate(startYear + 1, 1),
          label: "Spring semester tuition",
        },
      ],
    };
  }

  return {
    planId: "monthly",
    packageCode,
    rateTier,
    monthlyAmountCents,
    discountBps: 0,
    installments: Array.from({ length: 10 }, (_, index) => {
      const monthIndex = 8 + index;
      const year = startYear + Math.floor(monthIndex / 12);
      return {
        sequence: index + 1,
        amountCents: index === 9 ? Math.round(monthlyAmountCents / 2) : monthlyAmountCents,
        dueAt: dueDate(year, monthIndex % 12),
        label: index === 9 ? "Monthly tuition June (half month)" : `Monthly tuition ${index + 1} of 10`,
      };
    }),
  };
}