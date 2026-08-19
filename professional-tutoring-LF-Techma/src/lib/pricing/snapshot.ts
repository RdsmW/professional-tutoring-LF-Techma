import { requireDb } from "@/lib/db";
import { priceSnapshots, type PriceQuoteBreakdown } from "@/lib/db/schema";
import { activePriceBookId } from "@/lib/pricing/quote";

export async function insertPriceSnapshot(quote: PriceQuoteBreakdown) {
  const database = requireDb();
  const priceBookId = await activePriceBookId();
  const [row] = await database
    .insert(priceSnapshots)
    .values({
      label: `${quote.program} · ${quote.planCode}`,
      currency: "USD",
      amountCents: quote.totalCents,
      planLabel: quote.planCode,
      feeBreakdown: quote,
      sourceCatalogId: quote.packageCode,
      priceBookId,
    })
    .returning();
  return row;
}
