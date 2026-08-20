import { NextResponse } from "next/server";
import { reconcileStripeWebhookEvent } from "@/lib/stripe/reconcile-payment";
import { getStripe } from "@/lib/stripe/client";
import { invitationRedirectOrigin } from "@/lib/http/request-origin";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook is not configured." }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
    await reconcileStripeWebhookEvent(event, invitationRedirectOrigin());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[stripe/webhook] rejected", error);
    return NextResponse.json({ ok: false, error: "Invalid Stripe webhook." }, { status: 400 });
  }
}