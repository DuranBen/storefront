import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { OrderStatus } from "@/components/orders/order-status";
import { OrderSummary } from "@/components/orders/order-summary";
import { describeOrderStatus, orderReference, type OrderStatusKey } from "@/lib/order-status";
import { getMyOrder } from "@/lib/my-orders";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

/** What a non-paid status means for the customer; nothing extra for paid orders. */
const statusNotes: Partial<Record<OrderStatusKey, string>> = {
  awaiting:
    "We haven't received a payment for this order yet. If you left the payment page, the pieces will be released shortly.",
  incomplete: "This checkout wasn't completed, so no payment was taken.",
  processing:
    "Your pieces are reserved while the payment clears, which can take a few days for some payment methods.",
  failed: "The payment didn't go through, so this order wasn't placed and no money was taken.",
  review:
    "We received your payment but couldn't complete this order. We'll be in touch about a refund.",
  refunded: "This order has been refunded in full. Refunds can take 5–10 days to reach your account.",
  partially_refunded:
    "Part of this order has been refunded. Refunds can take 5–10 days to reach your account.",
};

// The order id and session are request data, so they're read inside Suspense.
export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <>
      <Link href="/account/orders" className="label-caps link-quiet inline-flex items-center gap-2">
        <ArrowLeftIcon width={16} height={16} />
        All orders
      </Link>
      <Suspense fallback={<OrderSkeleton />}>
        <OrderDetail params={params} />
      </Suspense>
    </>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  // Scoped to the signed-in customer by getMyOrder: anyone else's order id is a 404.
  const order = await getMyOrder(id);
  if (!order) notFound();

  const note = statusNotes[describeOrderStatus(order).key];

  return (
    <>
      <h2 className="heading mt-6">Order {orderReference(order.id)}</h2>
      <OrderStatus order={order} className="mt-3 text-body-sm" />
      {note && <p className="mt-3 max-w-xl text-body-sm text-muted">{note}</p>}
      <div className="mt-10">
        <OrderSummary order={order} />
      </div>
    </>
  );
}

function OrderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your order" className="animate-pulse">
      <div className="mt-6 h-9 w-56 bg-canvas" />
      <div className="mt-3 h-4 w-24 bg-canvas" />
      <div className="mt-10 h-32 bg-canvas" />
      <div className="mt-12 space-y-3">
        <div className="h-20 bg-canvas" />
        <div className="h-20 bg-canvas" />
      </div>
    </div>
  );
}
