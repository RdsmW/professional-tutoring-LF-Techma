export type PriceProgram =
  | "academic_tutoring"
  | "summer_tutoring"
  | "first_class"
  | "express"
  | "summer_master_class";

export type SeedPriceLine = {
  program: PriceProgram;
  rateTier: "standard" | "advanced" | null;
  packageCode: string | null;
  planCode: string | null;
  amountCents: number;
  registrationFeeCents: number;
};

/** Base package amounts from the form catalog. Plan discounts are applied at quote time. */
export const SEED_PRICE_LINES: SeedPriceLine[] = [
  { program: "academic_tutoring", rateTier: "standard", packageCode: "std_2h", planCode: null, amountCents: 46000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "standard", packageCode: "std_4h", planCode: null, amountCents: 91000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "standard", packageCode: "std_6h", planCode: null, amountCents: 136000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "standard", packageCode: "std_8h", planCode: null, amountCents: 181000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "standard", packageCode: "std_hourly", planCode: null, amountCents: 6500, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "advanced", packageCode: "adv_2h", planCode: null, amountCents: 60000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "advanced", packageCode: "adv_4h", planCode: null, amountCents: 120000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "advanced", packageCode: "adv_6h", planCode: null, amountCents: 180000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "advanced", packageCode: "adv_8h", planCode: null, amountCents: 240000, registrationFeeCents: 0 },
  { program: "academic_tutoring", rateTier: "advanced", packageCode: "adv_hourly", planCode: null, amountCents: 8500, registrationFeeCents: 0 },
  { program: "summer_tutoring", rateTier: "standard", packageCode: "std_2h", planCode: null, amountCents: 46000, registrationFeeCents: 0 },
  { program: "summer_tutoring", rateTier: "standard", packageCode: "std_hourly", planCode: null, amountCents: 6500, registrationFeeCents: 0 },
  { program: "summer_tutoring", rateTier: "advanced", packageCode: "adv_2h", planCode: null, amountCents: 60000, registrationFeeCents: 0 },
  { program: "summer_tutoring", rateTier: "advanced", packageCode: "adv_hourly", planCode: null, amountCents: 8500, registrationFeeCents: 0 },
];

export const PLAN_DISCOUNT_BPS: Record<string, number> = {
  monthly: 0,
  semester: 500,
  full_year: 1000,
  pay_in_full: 1000,
};

export const DEFAULT_TUTORING_PACKAGE = "std_2h";
