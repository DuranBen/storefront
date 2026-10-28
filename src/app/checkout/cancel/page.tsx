import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cancelCheckout } from "@/lib/checkout-actions";
import { getMyOrder } from "@/lib/my-orders";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

/**
 * Where Stripe's Back link lands (its cancel_url). Viewing it changes
 * nothing: the checkout is closed only when the shopper presses the button,
 * a POST, so a link alone can't cancel anyone's checkout. Left open, it
 * expires on its own, or closes when they next check out.
 */
export default function CheckoutCancelPage({ searchParams }: PageProps<"/checkout/cancel">) {
  return (
    <main className="flex-1">
      <div className="container-text section-sm text-center">
        <Suspense fallback={<CancelSkeleton />}>
          <CancelPrompt searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function CancelPrompt({ searchParams }: Pick<PageProps<"/checkout/cancel">, "searchParams">) {
  const { order: orderParam } = await searchParams;
  const orderId = typeof orderParam === "string" ? orderParam : "";
  // Signs the shopper in if needed; only their own order is found.
  const order = await getMyOrder(orderId);
  if (!order || order.status !== "pending" || order.paymentStatus !== "unpaid") {
    redirect("/bag");
  }

  return (
    <>
      <h1 className="display-sm">Leave checkout?</h1>
      <p className="mt-5 text-body-lg text-muted">
        You haven&rsquo;t been charged. Your pieces stay in your bag either way.
      </p>
      <form action={cancelCheckout} className="mt-8 flex flex-col items-center gap-4">
        <input type="hidden" name="orderId" value={order.id} />
        <button type="submit" className="btn btn-primary">
          Return to bag
        </button>
      </form>
      <p className="mt-6 text-body-sm text-muted">
        Changed your mind? Use your browser&rsquo;s back button to return to the payment page.{" "}
        <Link href="/" className="link">
          Continue shopping
        </Link>
      </p>
    </>
  );
}

function CancelSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <div className="mx-auto h-10 w-64 max-w-full bg-canvas" />
      <div className="mx-auto mt-5 h-5 w-80 max-w-full bg-canvas" />
      <div className="mx-auto mt-8 h-12 w-48 bg-canvas" />
    </div>
  );
}
