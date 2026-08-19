export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "partial",
  "refunded",
  "failed",
  "waived",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function paymentStatusLabel(status: string) {
  if (status === "unpaid") return "Unpaid";
  if (status === "pending") return "Pending";
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  if (status === "refunded") return "Refunded";
  if (status === "failed") return "Failed";
  if (status === "waived") return "Waived";
  return status;
}

export function paymentDisplayCode(id: string) {
  return `PAY-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function amountLabel(cents: number, currency: string) {
  const value = (cents / 100).toFixed(2);
  return currency.toUpperCase() === "USD" ? `$${value}` : `${value} ${currency.toUpperCase()}`;
}
