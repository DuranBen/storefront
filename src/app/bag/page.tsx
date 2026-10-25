import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  CartChangeNotifier,
  QuantityStepper,
  RemoveForm,
} from "@/components/cart/cart-line-controls";
import { StockStatus } from "@/components/product/stock-status";
import { getCart, type CartLine } from "@/lib/cart";
import { MAX_PER_LINE } from "@/lib/cart-cookie";
import { formatPrice, stockState, unsplash } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false },
};

const money = (cents: number) => formatPrice(cents / 100);

// The title is static; the bag reads the cart cookie, so it streams in.
export default function BagPage() {
  return (
    <main className="flex-1">
      <div className="container-page section-sm">
        <h1 className="display-sm">Shopping bag</h1>
        <Suspense fallback={<BagSkeleton />}>
          <BagContents />
        </Suspense>
      </div>
    </main>
  );
}

async function BagContents() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8 hairline-t py-16 text-center lg:mt-12">
        <CartChangeNotifier count={0} />
        <h2 className="heading">Your bag is empty</h2>
        <p className="mt-3 text-body-lg text-muted">Pieces you add will appear here.</p>
        <Link href="/" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  const soldOut = cart.lines.filter((line) => line.issue?.kind === "unavailable").length;

  return (
    // `group`: while any control is busy (aria-busy), the summary dims too.
    <div className="group mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
      <CartChangeNotifier count={cart.itemCount} />
      <section aria-label="Items in your bag" className="lg:col-span-8">
        <ul className="hairline-t">
          {cart.lines.map((line) => (
            <BagLine key={line.stockId} line={line} />
          ))}
        </ul>
      </section>

      <aside aria-labelledby="bag-summary" className="lg:col-span-4">
        <div className="bg-canvas p-6 md:p-8 lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
          <h2 id="bag-summary" className="label-caps">
            Summary
          </h2>
          <dl className="mt-6 flex justify-between gap-4 hairline-t pt-4 text-body-lg transition-opacity group-has-[[aria-busy=true]]:opacity-50">
            <dt>
              Subtotal{" "}
              <span className="text-body-sm text-muted">
                ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
              </span>
            </dt>
            <dd aria-live="polite" aria-atomic="true">
              <span className="sr-only">Subtotal </span>
              {money(cart.subtotalCents)}
            </dd>
          </dl>
          {soldOut > 0 && (
            <p className="mt-3 text-body-sm text-sale">
              {soldOut === 1
                ? "1 sold-out item isn’t included."
                : `${soldOut} sold-out items aren’t included.`}
            </p>
          )}
          <p className="mt-4 text-body-sm text-muted">
            Delivery and taxes are calculated at checkout. Checkout isn&rsquo;t available yet.
          </p>
          <Link href="/" className="btn btn-secondary mt-6 w-full">
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

function BagLine({ line }: { line: CartLine }) {
  const href = `/products/${line.slug}`;
  const label = line.size ? `${line.name}, size ${line.size}` : line.name;
  const unavailable = line.issue?.kind === "unavailable";
  const stock = stockState(line.available);
  // Why "+" stops: low stock is shown as a stock state; otherwise the per-order cap.
  const capped =
    line.quantity >= line.max && line.max === MAX_PER_LINE && line.available > MAX_PER_LINE;

  return (
    <li className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 hairline-b py-6 transition-opacity has-[[aria-busy=true]]:opacity-60 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="media-product block">
        <Image
          src={unsplash(line.image.id, 400)}
          alt=""
          fill
          sizes="8rem"
          style={{ objectPosition: line.image.position }}
          className={unavailable ? "opacity-50" : undefined}
        />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-muted">{line.category}</p>
            <h3 className="mt-1">
              <Link href={href} className="link-quiet">
                {line.name}
              </Link>
            </h3>
            <p className="mt-1 text-body-sm text-muted">
              {line.size && <>Size {line.size} · </>}
              {money(line.priceCents)}
              {line.quantity > 1 && !unavailable && " each"}
            </p>
          </div>
          <p className="shrink-0 text-right">
            {unavailable ? <span className="text-muted">—</span> : money(line.lineTotalCents)}
          </p>
        </div>

        {line.issue ? (
          <p className="mt-3 text-body-sm text-sale">
            {line.issue.kind === "unavailable"
              ? "No longer available. Remove it from your bag."
              : `Only ${line.issue.available} left, so we've reduced the quantity.`}
          </p>
        ) : stock.status === "low_stock" ? (
          <div className="mt-3">
            <StockStatus state={stock} />
          </div>
        ) : capped ? (
          <p className="mt-3 text-body-sm text-muted">Limit of {MAX_PER_LINE} per order.</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
          {unavailable ? (
            <span className="label-caps text-muted">Sold out</span>
          ) : (
            <QuantityStepper
              stockId={line.stockId}
              quantity={line.quantity}
              max={line.max}
              label={label}
            />
          )}
          <RemoveForm stockId={line.stockId} label={label} />
        </div>
      </div>
    </li>
  );
}

function BagSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your bag"
      className="mt-8 grid animate-pulse gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12"
    >
      <div className="space-y-6 lg:col-span-8">
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <div className="aspect-product bg-canvas" />
            <div className="space-y-3">
              <div className="h-4 w-1/2 bg-canvas" />
              <div className="h-4 w-1/3 bg-canvas" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 bg-canvas lg:col-span-4" />
    </div>
  );
}
