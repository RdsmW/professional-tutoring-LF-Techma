import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { amountLabel, isPaymentStatus, paymentDisplayCode, paymentStatusLabel } from "@/lib/billing";
import { requireDb } from "@/lib/db";
import { households, paymentRecords } from "@/lib/db/schema";
import { getStaffContext } from "@/lib/staff/session";

type PatchBody = {
  status?: string;
  notes?: string | null;
};

async function loadPaymentDetail(paymentId: string) {
  const database = requireDb();
  const [joined] = await database
    .select({
      payment: paymentRecords,
      householdId: households.id,
      householdName: households.displayName,
      cardBrand: households.cardBrand,
      cardLast4: households.cardLast4,
    })
    .from(paymentRecords)
    .innerJoin(households, eq(paymentRecords.householdId, households.id))
    .where(eq(paymentRecords.id, paymentId))
    .limit(1);

  if (!joined) return null;

  const { payment } = joined;
  const hasCardOnFile = Boolean(joined.cardLast4);

  return {
    id: payment.id,
    displayCode: paymentDisplayCode(payment.id),
    status: payment.status,
    statusLabel: paymentStatusLabel(payment.status),
    amountCents: payment.amountCents,
    amountLabel: amountLabel(payment.amountCents, payment.currency),
    currency: payment.currency,
    methodLabel: payment.methodLabel,
    householdId: joined.householdId,
    householdName: joined.householdName,
    relatedEntityType: payment.relatedEntityType,
    relatedEntityId: payment.relatedEntityId,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    notes: payment.notes,
    cardOnFile: hasCardOnFile
      ? {
          brand: joined.cardBrand,
          last4: joined.cardLast4,
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const payment = await loadPaymentDetail(id);
    if (!payment) {
      return NextResponse.json({ ok: false, error: "Payment record not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    console.warn("[staff/billing/id] GET soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to load payment record." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  contextParams: { params: Promise<{ id: string }> },
) {
  try {
    const context = await getStaffContext();
    if (!context) {
      return NextResponse.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
    }

    const { id } = await contextParams.params;
    const body = (await request.json()) as PatchBody;
    const database = requireDb();

    const [existing] = await database
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Payment record not found." }, { status: 404 });
    }

    const updates: Partial<typeof paymentRecords.$inferInsert> = { updatedAt: new Date() };
    let changed = false;

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!isPaymentStatus(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
      }
      if (status !== existing.status) {
        updates.status = status;
        changed = true;
        if (status === "paid" && !existing.paidAt) {
          updates.paidAt = new Date();
        }
      }
    }

    if (body.notes !== undefined) {
      const notes = body.notes?.trim() || null;
      if (notes !== existing.notes) {
        updates.notes = notes;
        changed = true;
      }
    }

    if (changed) {
      await database.update(paymentRecords).set(updates).where(eq(paymentRecords.id, id));
    }

    const payment = await loadPaymentDetail(id);
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    console.warn("[staff/billing/id] PATCH soft-fail", error);
    return NextResponse.json({ ok: false, error: "Unable to update payment record." }, { status: 500 });
  }
}
