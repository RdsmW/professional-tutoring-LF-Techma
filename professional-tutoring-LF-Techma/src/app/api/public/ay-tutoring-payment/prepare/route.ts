import { NextResponse } from "next/server";
import {
  isAyPublicPaymentError,
  prepareAyPublicPayment,
} from "@/lib/public-intake/ay-tutoring-payment-flow";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    return NextResponse.json({ ok: true, ...(await prepareAyPublicPayment(body.token?.trim() ?? "")) });
  } catch (error) {
    if (isAyPublicPaymentError(error)) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.warn("[public/ay-tutoring-payment/prepare] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to prepare payment." }, { status: 500 });
  }
}