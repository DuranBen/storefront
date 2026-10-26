// How an order's state is described to customers, everywhere it's shown
// (order history, order details, confirmation). Client-safe: no `db`.

import type { Order } from "@/db/schema";

export type OrderStatusKey =
  "paid" | "processing" | "awaiting" | "failed" | "review" | "incomplete";
export type OrderStatusTone = "success" | "neutral" | "alert" | "waiting";

/** Combines the order lifecycle and Stripe's payment status into one status. */
export function describeOrderStatus(order: Pick<Order, "status" | "paymentStatus">): {
  key: OrderStatusKey;
  label: string;
  tone: OrderStatusTone;
} {
  const { status, paymentStatus } = order;
  if (status === "confirmed") return { key: "paid", label: "Paid", tone: "success" };
  if (status === "pending") {
    return paymentStatus === "processing"
      ? { key: "processing", label: "Payment processing", tone: "neutral" }
      : { key: "awaiting", label: "Awaiting payment", tone: "waiting" };
  }
  // Canceled or expired.
  if (paymentStatus === "failed") return { key: "failed", label: "Payment failed", tone: "alert" };
  if (paymentStatus === "paid")
    return { key: "review", label: "Paid · under review", tone: "alert" };
  return { key: "incomplete", label: "Not completed", tone: "neutral" };
}

/** The short reference customers see, e.g. "D76015F2". */
export function orderReference(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}
