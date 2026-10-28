import type { Order } from "@/db/schema";
import { describeOrderStatus } from "@/lib/order-status";

// A static label: pages that actively wait for a payment (the checkout
// confirmation) show their own progress indicator instead.
const dotColour = {
  success: "bg-success",
  neutral: "bg-subtle",
  waiting: "bg-subtle",
  alert: "bg-sale",
} as const;

/** Status dot and label, like StockStatus. */
export function OrderStatus({
  order,
  className = "",
}: {
  order: Pick<Order, "status" | "paymentStatus" | "amountRefundedCents" | "totalCents">;
  className?: string;
}) {
  const { label, tone } = describeOrderStatus(order);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${dotColour[tone]}`} />
      {label}
    </span>
  );
}
