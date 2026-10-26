import Image from "next/image";
import type { Order, OrderItem } from "@/db/schema";
import { formatPrice, unsplash } from "@/lib/catalog";
import { orderReference } from "@/lib/order-status";
import { OrderStatus } from "./order-status";

const money = (cents: number) => formatPrice(cents / 100);
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

type ShippingDetails = {
  name?: string;
  address?: {
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
};

/**
 * An order's details, lines, totals and delivery address, as recorded on
 * the order (snapshots, not current catalogue data). Shared by the checkout
 * confirmation and the account's order pages.
 */
export function OrderSummary({ order }: { order: Order & { items: OrderItem[] } }) {
  const shipping = order.shipping as ShippingDetails | null;

  return (
    <>
      <dl className="grid gap-x-6 gap-y-4 bg-canvas p-6 text-body-sm sm:grid-cols-2 md:p-8">
        <div className="min-w-0">
          <dt className="label-caps text-muted">Order number</dt>
          <dd className="mt-1">{orderReference(order.id)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="label-caps text-muted">Placed on</dt>
          <dd className="mt-1">{dateFormat.format(order.createdAt)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="label-caps text-muted">Payment</dt>
          <dd className="mt-1">
            <OrderStatus order={order} />
          </dd>
        </div>
        {order.paidAt && (
          <div className="min-w-0">
            <dt className="label-caps text-muted">Paid on</dt>
            <dd className="mt-1">{dateFormat.format(order.paidAt)}</dd>
          </div>
        )}
        {/* Emails can be long: give that row the full width. */}
        <div className="min-w-0 sm:col-span-2">
          <dt className="label-caps text-muted">Email</dt>
          <dd className="mt-1 break-words">{order.email}</dd>
        </div>
      </dl>

      <section aria-labelledby="order-items" className="mt-12">
        <h2 id="order-items" className="label-caps">
          Your order
        </h2>
        <ul className="mt-4 hairline-t">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-4 hairline-b py-4"
            >
              <div className="media-product">
                <Image
                  src={unsplash(item.image.id, 200)}
                  alt=""
                  fill
                  sizes="4rem"
                  style={{ objectPosition: item.image.position }}
                />
              </div>
              <div className="min-w-0">
                <p>{item.productName}</p>
                <p className="mt-1 text-body-sm text-muted">
                  {item.size && <>Size {item.size} · </>}Qty {item.quantity}
                  {item.quantity > 1 && <> · {money(item.unitPriceCents)} each</>}
                </p>
              </div>
              <p className="text-right">{money(item.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{money(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-body-sm text-muted">
            <dt>Delivery</dt>
            <dd>Complimentary</dd>
          </div>
          <div className="flex justify-between gap-4 hairline-t pt-3 text-body-lg">
            <dt>{order.status === "confirmed" ? "Total paid" : "Total"}</dt>
            <dd>{money(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {shipping?.address && (
        <section aria-labelledby="order-shipping" className="mt-10">
          <h2 id="order-shipping" className="label-caps">
            Delivering to
          </h2>
          <address className="mt-3 text-body-sm not-italic text-muted">
            {shipping.name && (
              <>
                {shipping.name}
                <br />
              </>
            )}
            {shipping.address.line1}
            {shipping.address.line2 && <>, {shipping.address.line2}</>}
            <br />
            {[shipping.address.city, shipping.address.state, shipping.address.postal_code]
              .filter(Boolean)
              .join(", ")}
          </address>
        </section>
      )}
    </>
  );
}
