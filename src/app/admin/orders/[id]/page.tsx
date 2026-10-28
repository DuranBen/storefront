import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminBackLink, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { OrderSummary } from "@/components/orders/order-summary";
import { getAdminOrder } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { describeDispute, describeOrderStatus, orderReference } from "@/lib/order-status";
import { isLiveMode } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

// The id is request data, so it's read inside Suspense; getAdminOrder()
// calls requireAdmin() itself, and everything here renders after it.
export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminOrder params={params} />
    </Suspense>
  );
}

async function AdminOrder({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const status = describeOrderStatus(order);
  const dispute = describeDispute(order.disputeStatus);
  const dashboard = `https://dashboard.stripe.com/${isLiveMode() ? "" : "test/"}payments/`;
  const action =
    status.key === "review"
      ? order.stockReleasedAt
        ? "Paid after its checkout had closed, so its pieces went back on sale. Refund it in Stripe, or fulfil it if the pieces are still available."
        : "The amount Stripe charged didn't match this order, so it wasn't confirmed. Its pieces are still held. Check the payment in Stripe, then refund it or fulfil it."
      : dispute?.open
        ? "The customer has disputed this payment. Respond in the Stripe Dashboard."
        : null;

  return (
    <>
      <AdminBackLink href="/admin/orders" label="All orders" />
      <h2 className="heading">Order {orderReference(order.id)}</h2>
      {action && (
        <p role="status" className="mt-6 border border-sale px-4 py-3 text-body-sm">
          {action}
        </p>
      )}

      <dl className="mt-8 hairline-t text-body-sm">
        {[
          { label: "Customer", value: `${order.user.name} · ${order.user.email}` },
          { label: "Placed", value: dateFormat.format(order.createdAt) },
          { label: "Order status", value: `${order.status} · payment ${order.paymentStatus}` },
          ...(order.stockReleasedAt
            ? [{ label: "Stock returned", value: dateFormat.format(order.stockReleasedAt) }]
            : []),
          ...(order.amountRefundedCents > 0
            ? [{ label: "Refunded", value: formatPrice(order.amountRefundedCents / 100) }]
            : []),
          ...(dispute ? [{ label: "Dispute", value: dispute.label }] : []),
        ].map((row) => (
          <div
            key={row.label}
            className="grid gap-1 hairline-b py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
          >
            <dt className="label-caps text-muted">{row.label}</dt>
            <dd className="break-words">{row.value}</dd>
          </div>
        ))}
        <div className="grid gap-1 hairline-b py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
          <dt className="label-caps text-muted">Stripe</dt>
          <dd className="break-all">
            {order.stripePaymentIntentId ? (
              <a
                href={`${dashboard}${order.stripePaymentIntentId}`}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                {order.stripePaymentIntentId}
              </a>
            ) : (
              <span className="text-muted">No payment yet</span>
            )}
            {order.stripeCheckoutSessionId && (
              <span className="mt-1 block text-muted">{order.stripeCheckoutSessionId}</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-10">
        <OrderSummary order={order} itemsHeading="Items" />
      </div>
    </>
  );
}
