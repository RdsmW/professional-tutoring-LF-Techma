import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { priceBookLines, priceBooks } from "@/lib/db/schema";
import { loadActivePriceBook } from "@/lib/pricing/quote";
import { SEED_PRICE_LINES } from "@/lib/pricing/catalog";
import { getStaffContext } from "@/lib/staff/session";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const loaded = await loadActivePriceBook();
    return NextResponse.json({
      ok: true,
      book: loaded
        ? {
            id: loaded.book.id,
            code: loaded.book.code,
            name: loaded.book.name,
            status: loaded.book.status,
            effectiveFrom: loaded.book.effectiveFrom.toISOString(),
            reason: loaded.book.reason,
            lines: loaded.lines.map((line) => ({
              id: line.id,
              program: line.program,
              rateTier: line.rateTier,
              packageCode: line.packageCode,
              amountCents: line.amountCents,
              registrationFeeCents: line.registrationFeeCents,
            })),
          }
        : {
            id: null,
            code: "PT-PRICE-2026.1",
            name: "Catalog fallback (apply drizzle/0007_price_books.sql)",
            status: "active",
            effectiveFrom: new Date().toISOString(),
            reason: "In-code seed until price_books exists",
            lines: SEED_PRICE_LINES.map((line, index) => ({
              id: `seed-${index}`,
              program: line.program,
              rateTier: line.rateTier,
              packageCode: line.packageCode,
              amountCents: line.amountCents,
              registrationFeeCents: line.registrationFeeCents,
            })),
          },
      locked: {
        surchargeBps: 0,
        lateFees: "locked",
        intakeFeeCents: 0,
        note: "3.6% card surcharge, late fees, and intake $375 stay locked until Linda signs them.",
      },
    });
  } catch (error) {
    console.warn("[staff/settings/prices] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load price book." }, { status: 500 });
  }
}

type SaveBody = {
  code?: string;
  name?: string;
  reason?: string;
  lines?: Array<{
    program: string;
    rateTier?: string | null;
    packageCode?: string | null;
    amountCents: number;
    registrationFeeCents?: number;
  }>;
};

export async function POST(request: Request) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const body = (await request.json()) as SaveBody;
    const reason = (body.reason ?? "").trim();
    const code = (body.code ?? "").trim();
    const name = (body.name ?? "").trim() || "Price book";
    if (!reason || !code) {
      return NextResponse.json({ ok: false, error: "Version code and audit reason are required." }, { status: 400 });
    }

    const loaded = await loadActivePriceBook();
    const sourceLines =
      body.lines?.length
        ? body.lines
        : loaded?.lines.map((line) => ({
            program: line.program,
            rateTier: line.rateTier,
            packageCode: line.packageCode,
            amountCents: line.amountCents,
            registrationFeeCents: line.registrationFeeCents,
          })) ?? SEED_PRICE_LINES;

    const database = requireDb();
    const now = new Date();
    await database.update(priceBooks).set({ status: "retired", updatedAt: now }).where(eq(priceBooks.status, "active"));

    const [created] = await database
      .insert(priceBooks)
      .values({
        code,
        name,
        effectiveFrom: now,
        status: "active",
        reason,
        createdByStaffId: context.staff.id,
        updatedAt: now,
      })
      .returning();

    await database.insert(priceBookLines).values(
      sourceLines.map((line) => ({
        priceBookId: created.id,
        program: line.program,
        rateTier: line.rateTier ?? null,
        packageCode: line.packageCode ?? null,
        amountCents: Number(line.amountCents) || 0,
        registrationFeeCents: Number(line.registrationFeeCents) || 0,
      })),
    );

    return NextResponse.json({ ok: true, bookId: created.id, code: created.code });
  } catch (error) {
    console.warn("[staff/settings/prices] POST soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to save price book." }, { status: 500 });
  }
}
