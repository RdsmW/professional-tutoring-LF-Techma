import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { priceBookLines, priceBooks, type PriceQuoteBreakdown } from "@/lib/db/schema";
import {
  DEFAULT_TUTORING_PACKAGE,
  PLAN_DISCOUNT_BPS,
  SEED_PRICE_LINES,
  type PriceProgram,
  type SeedPriceLine,
} from "@/lib/pricing/catalog";

export type QuoteInput = {
  program: PriceProgram;
  planCode: string;
  packageCode?: string | null;
  rateTier?: "standard" | "advanced" | null;
  courseTuitionCents?: number;
  courseRegistrationFeeCents?: number;
  courseName?: string;
};

function discountBpsForPlan(planCode: string) {
  return PLAN_DISCOUNT_BPS[planCode] ?? 0;
}

function applyDiscount(amountCents: number, bps: number) {
  return Math.round((amountCents * bps) / 10_000);
}

async function loadActiveLines(): Promise<SeedPriceLine[]> {
  try {
    const database = requireDb();
    const [book] = await database
      .select()
      .from(priceBooks)
      .where(eq(priceBooks.status, "active"))
      .orderBy(desc(priceBooks.createdAt))
      .limit(1);
    if (!book) return SEED_PRICE_LINES;
    const rows = await database
      .select()
      .from(priceBookLines)
      .where(eq(priceBookLines.priceBookId, book.id));
    if (!rows.length) return SEED_PRICE_LINES;
    return rows.map((row) => ({
      program: row.program as PriceProgram,
      rateTier: (row.rateTier as SeedPriceLine["rateTier"]) ?? null,
      packageCode: row.packageCode,
      planCode: row.planCode,
      amountCents: row.amountCents,
      registrationFeeCents: row.registrationFeeCents,
    }));
  } catch (error) {
    console.warn("[pricing] loadActiveLines fallback", error);
    return SEED_PRICE_LINES;
  }
}

export async function loadActivePriceBook() {
  try {
    const database = requireDb();
    const [book] = await database
      .select()
      .from(priceBooks)
      .where(eq(priceBooks.status, "active"))
      .orderBy(desc(priceBooks.createdAt))
      .limit(1);
    if (!book) return null;
    const lines = await database
      .select()
      .from(priceBookLines)
      .where(eq(priceBookLines.priceBookId, book.id));
    return { book, lines };
  } catch (error) {
    console.warn("[pricing] loadActivePriceBook soft-fail", error);
    return null;
  }
}

function findTutoringLine(
  lines: SeedPriceLine[],
  program: PriceProgram,
  packageCode: string,
  rateTier: SeedPriceLine["rateTier"],
) {
  return (
    lines.find(
      (line) =>
        line.program === program &&
        line.packageCode === packageCode &&
        (rateTier == null || line.rateTier === rateTier),
    ) ??
    lines.find((line) => line.program === program && line.packageCode === packageCode) ??
    lines.find((line) => line.program === program && line.packageCode === DEFAULT_TUTORING_PACKAGE)
  );
}

export async function buildQuote(input: QuoteInput): Promise<PriceQuoteBreakdown> {
  const isCourse =
    input.program === "first_class" ||
    input.program === "express" ||
    input.program === "summer_master_class";

  if (isCourse) {
    const registrationFeeCents = input.courseRegistrationFeeCents ?? 0;
    const tuitionCents = input.courseTuitionCents ?? 0;
    const lines = [
      { code: "registration", label: "Registration / materials", amountCents: registrationFeeCents },
      { code: "tuition", label: input.courseName ? `${input.courseName} tuition` : "Tuition", amountCents: tuitionCents },
    ];
    const dueNow = input.planCode === "pay_in_full" ? registrationFeeCents + tuitionCents : registrationFeeCents;
    return {
      program: input.program,
      planCode: input.planCode,
      packageCode: null,
      rateTier: null,
      lines,
      subtotalCents: registrationFeeCents + tuitionCents,
      discountCents: 0,
      registrationFeeCents,
      totalCents: dueNow,
      surchargeBps: 0,
      assumedPackage: false,
    };
  }

  const lines = await loadActiveLines();
  const packageCode = input.packageCode?.trim() || DEFAULT_TUTORING_PACKAGE;
  const assumedPackage = !input.packageCode?.trim();
  const rateTier = input.rateTier ?? (packageCode.startsWith("adv_") ? "advanced" : "standard");
  const match = findTutoringLine(lines, input.program, packageCode, rateTier);
  const subtotalCents = match?.amountCents ?? 0;
  const discountCents = applyDiscount(subtotalCents, discountBpsForPlan(input.planCode));
  return {
    program: input.program,
    planCode: input.planCode,
    packageCode,
    rateTier,
    lines: [{ code: packageCode, label: `${rateTier} ${packageCode}`, amountCents: subtotalCents }],
    subtotalCents,
    discountCents,
    registrationFeeCents: 0,
    totalCents: Math.max(subtotalCents - discountCents, 0),
    surchargeBps: 0,
    assumedPackage,
  };
}

export async function activePriceBookId(): Promise<string | null> {
  const loaded = await loadActivePriceBook();
  return loaded?.book.id ?? null;
}
