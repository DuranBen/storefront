import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RefreshUntilConfirmed, SettleBag } from "@/components/checkout/order-status-effects";
import { Spinner } from "@/components/spinner";
import { OrderSummary } from "@/components/orders/order-summary";
import { orderReference } from "@/lib/order-status";
import { getMyOrderBySession } from "@/lib/my-orders";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false },
};

/**
 * Where Stripe returns the shopper after paying. This page only reads the
 * order: payment is confirmed by the Stripe webhook, never because the
 * browser arrived here. Until the webhook lands it shows a waiting state
 * and refreshes.
 */
export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <main className="flex-1">
      <div className="container-text section-sm">
        <Suspense fallback={<ConfirmationSkeleton />}>
          <Confirmation searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Confirmation({
  searchParams,
}: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : "";
  // Signs the shopper in if needed; only their own order is returned, so any
  // other session id is a 404.
  const order = await getMyOrderBySession(sessionId);
  if (!order) notFound();

  const confirmed = order.status === "confirmed";
  const processing = order.status === "pending" && order.paymentStatus === "processing";
  const awaiting = order.status === "pending" && order.paymentStatus === "unpaid";
  const reference = orderReference(order.id);

  if (!confirmed && !processing && !awaiting) {
    return (
      <div className="text-center">
        <h1 className="display-sm">This checkout didn&rsquo;t complete</h1>
        <p className="mt-5 text-body-lg text-muted">
          {order.paymentStatus === "paid"
            ? `We received your payment for order ${reference} but couldn't complete it. We'll be in touch about a refund.`
            : "No payment was taken. Your bag still has your pieces if you'd like to try again."}
        </p>
        <Link href="/bag" className="btn btn-primary mt-8">
          Return to bag
        </Link>
      </div>
    );
  }

  const state = confirmed
    ? {
        badge: "Payment confirmed",
        dot: "bg-success",
        heading: "Thank you for your order",
        body: "Your order is confirmed and we're preparing it for delivery.",
      }
    : processing
      ? {
          badge: "Payment processing",
          dot: "bg-subtle",
          heading: "Your payment is processing",
          body: "Your pieces are reserved while the payment clears, which can take a few days for some payment methods.",
        }
      : {
          badge: "Awaiting payment confirmation",
          dot: null,
          heading: "Confirming your payment…",
          body: "This usually takes a few seconds. Please keep this page open.",
        };

  return (
    <div>
      {(confirmed || processing) && <SettleBag />}

      <div className="text-center" role="status">
        <p className="eyebrow inline-flex items-center gap-2 text-muted">
          {state.dot ? (
            <span aria-hidden="true" className={`size-1.5 rounded-full ${state.dot}`} />
          ) : (
            <Spinner size={12} />
          )}
          {state.badge}
        </p>
        <h1 className="display-sm mt-3">{state.heading}</h1>
        <p className="mt-5 text-body-lg text-muted">{state.body}</p>
        {awaiting && <RefreshUntilConfirmed />}
      </div>

      <div className="mt-12">
        <OrderSummary order={order} />
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="btn btn-secondary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function ConfirmationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your order" className="animate-pulse">
      <div className="mx-auto h-3 w-40 bg-canvas" />
      <div className="mx-auto mt-3 h-10 w-72 max-w-full bg-canvas" />
      <div className="mx-auto mt-5 h-5 w-80 max-w-full bg-canvas" />
      <div className="mt-12 h-32 bg-canvas" />
      <div className="mt-12 space-y-3">
        <div className="h-20 bg-canvas" />
        <div className="h-20 bg-canvas" />
      </div>
    </div>
  );
}
