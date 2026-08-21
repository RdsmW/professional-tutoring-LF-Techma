import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { households, paymentRecords } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";
import { amountLabel, paymentDisplayCode, paymentStatusLabel } from "@/lib/billing";

export async function GET() {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const database = requireDb();
    const rows = await database
      .select({
        payment: paymentRecords,
        householdName: households.displayName,
      })
      .from(paymentRecords)
      .innerJoin(households, eq(paymentRecords.householdId, households.id))
      .orderBy(desc(paymentRecords.createdAt));

    const summary = {
      unpaid: { count: 0, amountCents: 0 },
      pending: { count: 0, amountCents: 0 },
      paid: { count: 0, amountCents: 0 },
    };

    const payments = rows.map(({ payment, householdName }) => {
      if (payment.status === "unpaid") {
        summary.unpaid.count += 1;
        summary.unpaid.amountCents += payment.amountCents;
      } else if (payment.status === "pending") {
        summary.pending.count += 1;
        summary.pending.amountCents += payment.amountCents;
      } else if (payment.status === "paid") {
        summary.paid.count += 1;
        summary.paid.amountCents += payment.amountCents;
      }

      return {
        id: payment.id,
        displayCode: paymentDisplayCode(payment.id),
        status: payment.status,
        statusLabel: paymentStatusLabel(payment.status),
        amountCents: payment.amountCents,
        amountLabel: amountLabel(payment.amountCents, payment.currency),
        currency: payment.currency,
        methodLabel: payment.methodLabel,
        householdId: payment.householdId,
        householdName,
        relatedEntityType: payment.relatedEntityType,
        relatedEntityId: payment.relatedEntityId,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        notes: payment.notes,
      };
    });

    return NextResponse.json({ ok: true, summary, payments });
  } catch (error) {
    console.warn("[staff/billing] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load billing records." }, { status: 500 });
  }
}
