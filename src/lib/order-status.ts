// How an order's state is described to customers, everywhere it's shown
// (order history, order details, confirmation). Client-safe: no `db`.

import type { Order } from "@/db/schema";

export type OrderStatusKey =
  | "paid"
  | "refunded"
  | "partially_refunded"
  | "processing"
  | "awaiting"
  | "failed"
  | "review"
  | "incomplete";
export type OrderStatusTone = "success" | "neutral" | "alert" | "waiting";

/** Combines the order lifecycle and Stripe's payment status into one status. */
export function describeOrderStatus(
  order: Pick<Order, "status" | "paymentStatus" | "amountRefundedCents" | "totalCents">,
): {
  key: OrderStatusKey;
  label: string;
  tone: OrderStatusTone;
} {
  const { status, paymentStatus, amountRefundedCents, totalCents } = order;
  if (paymentStatus === "paid" && amountRefundedCents > 0) {
    return amountRefundedCents >= totalCents
      ? { key: "refunded", label: "Refunded", tone: "neutral" }
      : { key: "partially_refunded", label: "Partially refunded", tone: "neutral" };
  }
  if (status === "confirmed") return { key: "paid", label: "Paid", tone: "success" };
  // Paid but not confirmed: paid after release, or an amount that didn't match.
  if (paymentStatus === "paid")
    return { key: "review", label: "Paid · under review", tone: "alert" };
  if (status === "pending") {
    return paymentStatus === "processing"
      ? { key: "processing", label: "Payment processing", tone: "neutral" }
      : { key: "awaiting", label: "Awaiting payment", tone: "waiting" };
  }
  // Canceled or expired.
  if (paymentStatus === "failed") return { key: "failed", label: "Payment failed", tone: "alert" };
  return { key: "incomplete", label: "Not completed", tone: "neutral" };
}

/** Stripe dispute statuses that still need action or a decision. */
export const OPEN_DISPUTE_STATUSES = [
  "warning_needs_response",
  "warning_under_review",
  "needs_response",
  "under_review",
];

/** A dispute's Stripe status in words, for admins; null when there's no dispute. */
export function describeDispute(status: string | null) {
  if (status === null) return null;
  const labels: Record<string, string> = {
    warning_needs_response: "Inquiry · needs response",
    warning_under_review: "Inquiry · under review",
    warning_closed: "Inquiry closed",
    needs_response: "Dispute · needs response",
    under_review: "Dispute · under review",
    won: "Dispute won",
    lost: "Dispute lost",
  };
  return { label: labels[status] ?? `Dispute · ${status}`, open: OPEN_DISPUTE_STATUSES.includes(status) };
}

/** The short reference customers see, e.g. "D76015F2". */
export function orderReference(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}
