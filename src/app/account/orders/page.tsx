import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { OrderStatus } from "@/components/orders/order-status";
import { formatPrice, unsplash } from "@/lib/catalog";
import { orderReference } from "@/lib/order-status";
import { getMyOrders } from "@/lib/my-orders";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false },
};

const money = (cents: number) => formatPrice(cents / 100);
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });
const MAX_THUMBNAILS = 3;

export default function OrdersPage() {
  return (
    <>
      <h2 className="heading">Orders</h2>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrderList />
      </Suspense>
    </>
  );
}

type CustomerOrder = Awaited<ReturnType<typeof getMyOrders>>[number];

async function OrderList() {
  // Only the signed-in customer's orders: getMyOrders resolves them from the session.
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="mt-10 hairline-t py-16 text-center">
        <p className="text-body-lg text-muted">You haven&rsquo;t placed any orders yet.</p>
        <Link href="/" className="btn btn-primary mt-8">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-10 hairline-t">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shown = order.items.slice(0, MAX_THUMBNAILS);
  const more = order.items.length - shown.length;

  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 hairline-b py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="col-span-2 flex gap-1 sm:col-span-1" aria-hidden="true">
        {shown.map((item) => (
          <div key={item.id} className="media-product w-12">
            <Image
              src={unsplash(item.image.id, 160)}
              alt=""
              fill
              sizes="3rem"
              style={{ objectPosition: item.image.position }}
            />
          </div>
        ))}
        {more > 0 && (
          <div className="flex w-12 items-center justify-center bg-canvas text-body-sm text-muted">
            +{more}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3>
          {/* Stretched link: the whole row opens the order. */}
          <Link
            href={`/account/orders/${order.id}`}
            className="link-quiet after:absolute after:inset-0"
          >
            Order {orderReference(order.id)}
          </Link>
        </h3>
        <p className="mt-1 text-body-sm text-muted">
          {dateFormat.format(order.createdAt)} · {pieces} {pieces === 1 ? "piece" : "pieces"}
        </p>
        <OrderStatus order={order} className="mt-2 text-body-sm" />
      </div>

      <div className="flex items-center gap-3 text-right">
        <span>{money(order.totalCents)}</span>
        <ArrowRightIcon
          width={16}
          height={16}
          className="text-muted transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </li>
  );
}

function OrdersSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your orders"
      className="mt-10 animate-pulse space-y-px"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 bg-canvas" />
      ))}
    </div>
  );
}
