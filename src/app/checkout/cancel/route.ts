import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { findMyOrder } from "@/lib/my-orders";
import { cancelOpenOrder } from "@/lib/orders";

/**
 * Stripe's cancel_url ("Back" on the payment page). Expires the session so
 * it can't be paid later, returns the reserved stock, and goes back to the
 * bag, which still holds everything. Only the order's owner can cancel it,
 * and only while it's unpaid.
 */
export async function GET(request: NextRequest) {
  const bag = (status: string) =>
    NextResponse.redirect(new URL(`/bag?checkout=${status}`, request.url));

  const order = await findMyOrder(request.nextUrl.searchParams.get("order") ?? "");
  if (!order) return bag("canceled");

  if (order.status === "pending" && order.paymentStatus === "unpaid") {
    let outcome: Awaited<ReturnType<typeof cancelOpenOrder>> | "unreachable";
    try {
      outcome = await cancelOpenOrder(order);
      if (outcome === "canceled") revalidateTag("products", { expire: 0 });
    } catch (error) {
      // Stripe unreachable: leave the order open rather than release stock
      // for a session that might still be paid. Its expiry releases it.
      console.error(`[checkout] Couldn't cancel order ${order.id}`, error);
      outcome = "unreachable";
    }
    if (outcome === "completed" && order.stripeCheckoutSessionId) {
      // Paid in another tab before Back was pressed: show the order instead.
      return NextResponse.redirect(
        new URL(`/checkout/success?session_id=${order.stripeCheckoutSessionId}`, request.url),
      );
    }
  }
  return bag("canceled");
}
