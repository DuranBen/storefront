"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCart } from "./cart";
import { clearCart, saveReconciled } from "./cart-store";
import { unsplash } from "./catalog";
import {
  attachCheckoutSession,
  cancelOpenOrder,
  getOpenOrders,
  releaseOrder,
  releaseOverdueReservations,
  reserveOrder,
} from "./orders";
import { findMyOrderBySession } from "./my-orders";
import { getCurrentUser } from "./session";
import { siteUrl, stripe } from "./stripe";

/** Tags these sessions in the Stripe Dashboard (label + 8 random letters). */
const INTEGRATION_IDENTIFIER = "atelier_bag_checkout_kxqmvtrz";
/** Stripe's minimum session lifetime; the order's reservation outlives it. */
const SESSION_MINUTES = 30;

/**
 * Start checkout for the signed-in customer's bag. The client sends nothing
 * but the request: lines come from the cart cookie (ids and quantities) and
 * every price, total and stock level from the database.
 */
export async function startCheckout() {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/bag")}`);

  // Revalidate against live stock before anything is reserved.
  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/bag");
  if (cart.lines.some((line) => line.issue)) {
    // Save what the bag now shows (reduced quantities, sold-out lines
    // removed) so the shopper reviews it, then checks out again.
    await saveReconciled(cart);
    redirect("/bag?checkout=changed");
  }

  // Every stock change below expires the cached catalogue straight away
  // (updateTag), so product pages never show stock that has moved.
  if (await releaseOverdueReservations()) updateTag("products");
  // A previous checkout left open (e.g. Back from Stripe) would hold its
  // stock and could still be paid: close it before starting a new one.
  for (const open of await getOpenOrders(user.id)) {
    let outcome;
    try {
      outcome = await cancelOpenOrder(open);
      if (outcome === "canceled") updateTag("products");
    } catch (error) {
      // Stripe unreachable: leave it to expire (its stock is released then).
      console.error(`[checkout] Couldn't close earlier order ${open.id}`, error);
      continue;
    }
    if (outcome === "completed") redirect("/bag?checkout=pending");
  }

  const reserved = await reserveOrder(user, cart);
  if (!reserved.ok) {
    redirect(reserved.reason === "changed" ? "/bag?checkout=changed" : "/bag?checkout=sold-out");
  }
  updateTag("products");
  const { order } = reserved;

  let sessionUrl: string | null;
  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: cart.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "usd",
            unit_amount: line.priceCents,
            product_data: {
              name: line.size ? `${line.name} (size ${line.size})` : line.name,
              images: [unsplash(line.image.id, 800)],
            },
          },
        })),
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
        customer_email: user.email,
        shipping_address_collection: { allowed_countries: ["US"] },
        expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60 + 60,
        success_url: siteUrl("/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
        cancel_url: siteUrl(`/checkout/cancel?order=${order.id}`),
        integration_identifier: INTEGRATION_IDENTIFIER,
      },
      // A retried request returns the same session instead of a second one.
      { idempotencyKey: `checkout:${order.id}` },
    );
    await attachCheckoutSession(order.id, session.id);
    sessionUrl = session.url;
  } catch (error) {
    console.error(`[checkout] Couldn't create a Stripe session for order ${order.id}`, error);
    sessionUrl = null;
  }

  if (!sessionUrl) {
    if (await releaseOrder(order.id, "canceled")) updateTag("products");
    redirect("/bag?checkout=error");
  }
  redirect(sessionUrl);
}

/**
 * Empty the bag once its order is paid or its payment is processing. Called
 * from the success page; checks the order belongs to the signed-in customer.
 */
export async function clearCartForOrder(sessionId: string) {
  if (typeof sessionId !== "string") return;
  const order = await findMyOrderBySession(sessionId);
  if (order && (order.status === "confirmed" || order.paymentStatus === "processing")) {
    await clearCart();
  }
}
