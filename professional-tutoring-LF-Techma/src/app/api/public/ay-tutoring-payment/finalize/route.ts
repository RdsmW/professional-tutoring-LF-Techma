import { NextResponse } from "next/server";
import {
  finalizeAyPublicPayment,
  isAyPublicPaymentError,
} from "@/lib/public-intake/ay-tutoring-payment-flow";
import { invitationRedirectOrigin } from "@/lib/http/request-origin";

export async function POST(request: Request) {
  let invitationOrigin: string;
  try {
    invitationOrigin = invitationRedirectOrigin();
  } catch (error) {
    console.error("[public/ay-tutoring-payment/finalize] invitation redirect configuration", error);
    return NextResponse.json(
      { ok: false, error: "Invitation delivery is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { token?: string; intentId?: string | null };
    const result = await finalizeAyPublicPayment({
      token: body.token?.trim() ?? "",
      intentId: body.intentId?.trim() || null,
      invitationOrigin,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (isAyPublicPaymentError(error)) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status });
    }
    console.warn("[public/ay-tutoring-payment/finalize] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to complete payment." }, { status: 500 });
  }
}