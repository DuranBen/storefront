import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { OrderStatus } from "@/components/orders/order-status";
import { listAdminOrders, ORDER_VIEWS, type OrderView } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { describeDispute, orderReference } from "@/lib/order-status";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

const viewLabels: Record<OrderView, string> = {
  all: "All",
  attention: "Needs attention",
  open: "In checkout",
  paid: "Paid",
};

const emptyMessages: Record<OrderView, string> = {
  all: "No orders yet.",
  attention: "Nothing needs attention.",
  open: "No checkouts in progress.",
  paid: "No paid orders yet.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// AdminSection and listAdminOrders each call requireAdmin(); the filters are
// request data, so they're read inside Suspense.
export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminSection path="/admin/orders" title="Orders">
        <OrderSection searchParams={searchParams} />
      </AdminSection>
    </Suspense>
  );
}

async function OrderSection({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const params = await searchParams;
  // Filters come from the URL: accept only known values.
  const viewParam = one(params.view);
  const view: OrderView = ORDER_VIEWS.find((v) => v === viewParam) ?? "all";
  const afterParam = one(params.after);
  const after = afterParam && UUID.test(afterParam) ? afterParam : null;

  const { rows, counts, hasNext } = await listAdminOrders({ view, after });

  const href = (next: { view?: OrderView; after?: string }) => {
    const query = new URLSearchParams();
    const v = next.view ?? view;
    if (v !== "all") query.set("view", v);
    if (next.after) query.set("after", next.after);
    const qs = query.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <p className="mt-3 max-w-xl text-body-sm text-muted">
        Payments, refunds and disputes are handled in the Stripe Dashboard; what Stripe reports
        shows here.
      </p>

      <nav aria-label="Filter orders" className="mt-8 hairline-b pb-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {ORDER_VIEWS.map((v) => (
            <li key={v}>
              <Link
                href={href({ view: v })}
                aria-current={v === view ? "page" : undefined}
                className={`label-caps ${
                  v === view
                    ? "text-ink underline underline-offset-[0.4em]"
                    : v === "attention" && counts.attention > 0
                      ? "text-sale hover:text-ink"
                      : "text-muted hover:text-ink"
                }`}
              >
                {viewLabels[v]} <span className="tabular-nums">({counts[v]})</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="mt-10 bg-canvas p-8 text-center text-body-lg md:p-12">
          {after ? "No older orders." : emptyMessages[view]}
        </p>
      ) : (
        <>
          <ul className="mt-4 hairline-t">
            {rows.map((order) => {
              const dispute = describeDispute(order.disputeStatus);
              return (
                <li
                  key={order.id}
                  className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 hairline-b py-4"
                >
                  <div className="min-w-0">
                    <h3>
                      {/* Stretched link: the whole row opens the order. */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="link-quiet tabular-nums after:absolute after:inset-0"
                      >
                        {orderReference(order.id)}
                      </Link>
                    </h3>
                    <p className="mt-1 truncate text-body-sm text-muted">
                      {order.email} · {dateFormat.format(order.createdAt)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
                      <OrderStatus order={order} />
                      {dispute && (
                        <span className={dispute.open ? "text-sale" : "text-muted"}>
                          {dispute.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">{formatPrice(order.totalCents / 100)}</p>
                    <p className="mt-1 text-body-sm text-muted">
                      {order.itemCount} {order.itemCount === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {(after || hasNext) && (
            <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-4">
              {after ? (
                <Link href={href({})} className="label-caps link">
                  Newest
                </Link>
              ) : (
                <span />
              )}
              {hasNext ? (
                <Link href={href({ after: rows.at(-1)!.id })} className="label-caps link">
                  Older
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
