import { NextResponse } from "next/server";
import { collectDuePayments } from "@/lib/stripe/collect-due-payments";

export async function POST(request: Request) {
  const secret = process.env.BILLING_JOB_SECRET;
  if (!secret || request.headers.get("x-billing-job-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { limit?: unknown };
    const limit = typeof body.limit === "number" && Number.isInteger(body.limit) ? body.limit : undefined;
    return NextResponse.json({ ok: true, ...(await collectDuePayments({ limit })) });
  } catch (error) {
    console.warn("[billing/collect-due] fail", error);
    return NextResponse.json({ ok: false, error: "Unable to collect due payments." }, { status: 500 });
  }
}