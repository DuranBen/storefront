import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  CartChangeNotifier,
  QuantityStepper,
  RemoveForm,
} from "@/components/cart/cart-line-controls";
import { CheckoutButton, ConsumeCheckoutNotice } from "@/components/cart/checkout-button";
import { SettleBag } from "@/components/checkout/order-status-effects";
import { StockStatus } from "@/components/product/stock-status";
import { getCart, type CartLine } from "@/lib/cart";
import { MAX_PER_LINE } from "@/lib/cart-cookie";
import { formatPrice, stockState, unsplash } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/session";

/** Messages for where checkout sent the shopper back to the bag (?checkout=…). */
const checkoutNotices: Record<string, { title: string; message: string; tone: "info" | "alert" }> =
  {
    canceled: {
      title: "Checkout canceled",
      message: "You haven't been charged. Your bag is just as you left it.",
      tone: "info",
    },
    changed: {
      title: "Your bag has been updated",
      message:
        "Some pieces changed since you added them, so we've adjusted your bag to what's available. Please review it and check out again.",
      tone: "alert",
    },
    "sold-out": {
      title: "Something just sold out",
      message:
        "A piece in your bag sold out as you were checking out, so checkout didn't start and you haven't been charged. Please review your bag.",
      tone: "alert",
    },
    pending: {
      title: "You've already paid",
      message: "Your previous checkout went through. You'll receive a confirmation by email.",
      tone: "info",
    },
    "in-progress": {
      title: "Checkout is already open",
      message:
        "You started checking out in another tab or window. Finish there, or check out again here to start over.",
      tone: "info",
    },
    error: {
      title: "Checkout didn't start",
      message:
        "Something went wrong on our side and you haven't been charged. Please try again in a moment.",
      tone: "alert",
    },
  };

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false },
};

const money = (cents: number) => formatPrice(cents / 100);

// The title is static; the bag reads the cart cookie, session and ?checkout=
// notice, so it streams in.
export default function BagPage({ searchParams }: PageProps<"/bag">) {
  return (
    <main className="flex-1">
      <div className="container-page section-sm">
        <h1 className="display-sm">Shopping bag</h1>
        {/* A checkout paid without reaching the confirmation page leaves its
            pieces in the bag: this takes them out, then re-renders. */}
        <SettleBag refresh />
        <Suspense fallback={<BagSkeleton />}>
          <BagContents searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function BagContents({ searchParams }: Pick<PageProps<"/bag">, "searchParams">) {
  const [cart, user, { checkout }] = await Promise.all([getCart(), getCurrentUser(), searchParams]);
  const notice = typeof checkout === "string" ? checkoutNotices[checkout] : undefined;
  const noticeBanner = notice && (
    <div
      role={notice.tone === "alert" ? "alert" : "status"}
      className={`mt-8 border px-4 py-3 text-body-sm lg:mt-12 ${
        notice.tone === "alert" ? "border-sale" : "border-line bg-canvas"
      }`}
    >
      <ConsumeCheckoutNotice />
      <p className={`font-medium ${notice.tone === "alert" ? "text-sale" : ""}`}>{notice.title}</p>
      <p className="mt-1 text-muted">{notice.message}</p>
    </div>
  );

  if (cart.lines.length === 0) {
    return (
      <>
        {noticeBanner}
        <div className="mt-8 hairline-t py-16 text-center lg:mt-12">
          <CartChangeNotifier count={0} />
          <h2 className="heading">Your bag is empty</h2>
          <p className="mt-3 text-body-lg text-muted">Pieces you add will appear here.</p>
          <Link href="/" className="btn btn-primary mt-8">
            Continue shopping
          </Link>
        </div>
      </>
    );
  }

  const soldOut = cart.lines.filter((line) => line.issue?.kind === "unavailable").length;
  const needsReview = cart.lines.some((line) => line.issue);

  return (
    <>
      {noticeBanner}
      {/* `group`: while any control is busy (aria-busy), the summary dims too;
          while checkout is starting (data-checkout-pending), the lines freeze. */}
      <div className="group mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
        <CartChangeNotifier count={cart.itemCount} />
        <section
          aria-label="Items in your bag"
          className="transition-opacity group-has-[[data-checkout-pending]]:pointer-events-none group-has-[[data-checkout-pending]]:opacity-50 lg:col-span-8"
        >
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
            <dl className="mt-6 space-y-3 hairline-t pt-4 transition-opacity group-has-[[aria-busy=true]]:opacity-50">
              <div className="flex justify-between gap-4">
                <dt>
                  Subtotal{" "}
                  <span className="text-body-sm text-muted">
                    ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
                  </span>
                </dt>
                <dd>{money(cart.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-body-sm text-muted">
                <dt>Delivery</dt>
                <dd>Complimentary</dd>
              </div>
              {/* Live on the whole row, so a change is announced as "Total $1,440". */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="flex justify-between gap-4 hairline-t pt-3 text-body-lg"
              >
                <dt>Total</dt>
                <dd>{money(cart.subtotalCents)}</dd>
              </div>
            </dl>
            {soldOut > 0 && (
              <p className="mt-3 text-body-sm text-sale">
                {soldOut === 1
                  ? "1 sold-out item isn’t included."
                  : `${soldOut} sold-out items aren’t included.`}
              </p>
            )}
            <p className="mt-4 text-body-sm text-muted">
              {needsReview && user
                ? "We'll update your bag to what's available and ask you to confirm before payment."
                : "You'll pay securely with Stripe."}
            </p>
            {user ? (
              <CheckoutButton />
            ) : (
              <Link
                href={`/sign-in?next=${encodeURIComponent("/bag")}`}
                className="btn btn-primary mt-6 w-full"
              >
                Sign in to check out
              </Link>
            )}
            <Link href="/" className="btn btn-secondary mt-3 w-full">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </>
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
          <div
            key={i}
            className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]"
          >
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
