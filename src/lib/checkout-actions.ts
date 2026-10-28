"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCart } from "./cart";
import { rememberCheckout, saveReconciled, settleCheckout } from "./cart-store";
import { unsplash } from "./catalog";
import {
  attachCheckoutSession,
  closeOpenOrder,
  getOpenOrders,
  releaseOrder,
  releaseOverdueReservations,
  reserveOrder,
} from "./orders";
import { findMyOrder } from "./my-orders";
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

  // Return reservations the expiry webhook missed. After the response, so the
  // shopper doesn't wait on its Stripe calls (the cart was checked above, so
  // it can't use them anyway). updateTag only works in the action itself.
  after(async () => {
    if (await releaseOverdueReservations()) revalidateTag("products", { expire: 0 });
  });

  // Every stock change below expires the cached catalogue straight away
  // (updateTag), so product pages never show stock that has moved.
  // A previous checkout left open (e.g. Back from Stripe) would hold its
  // stock and could still be paid: close it before starting a new one.
  for (const open of await getOpenOrders(user.id)) {
    let outcome;
    try {
      outcome = await closeOpenOrder(open);
      if (outcome === "released") updateTag("products");
    } catch (error) {
      // Stripe unreachable or the session still open: leave it to expire (its
      // stock is released then). The new reservation is then refused.
      console.error(`[checkout] Couldn't close earlier order ${open.id}`, error);
      continue;
    }
    if (outcome === "completed") redirect("/bag?checkout=pending");
  }

  const reserved = await reserveOrder(user, cart);
  if (!reserved.ok) {
    const notice = { changed: "changed", sold_out: "sold-out", in_progress: "in-progress" };
    redirect(`/bag?checkout=${notice[reserved.reason]}`);
  }
  updateTag("products");
  const { order } = reserved;

  let sessionUrl: string | null;
  let superseded = false;
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
    if (await attachCheckoutSession(order.id, session.id)) {
      sessionUrl = session.url;
    } else {
      // A checkout started meanwhile (another tab) closed this order and
      // returned its stock: never hand out a session for it.
      superseded = true;
      sessionUrl = null;
      await stripe()
        .checkout.sessions.expire(session.id)
        .catch((error) =>
          console.error(`[checkout] Couldn't expire session for closed order ${order.id}`, error),
        );
    }
  } catch (error) {
    console.error(`[checkout] Couldn't create a Stripe session for order ${order.id}`, error);
    sessionUrl = null;
  }

  if (superseded) redirect("/bag?checkout=in-progress");
  if (!sessionUrl) {
    if (await releaseOrder(order.id, "canceled")) updateTag("products");
    redirect("/bag?checkout=error");
  }
  await rememberCheckout(order.id);
  redirect(sessionUrl);
}

/**
 * Take the paid checkout's pieces out of the bag. Called from the
 * confirmation page and the bag; takes no input (the order comes from this
 * browser's checkout cookie and must belong to the signed-in customer).
 * Returns the bag's new item count when it changed.
 */
export async function settleBag() {
  return settleCheckout();
}

/**
 * Leave a checkout from Stripe's Back link: expire its session, so it can't be
 * paid later, return the reserved stock and go back to the bag. A POST from
 * the cancel page (a Server Action, so the origin is checked), never the GET
 * Stripe redirects with: a link alone can't cancel anyone's checkout.
 */
export async function cancelCheckout(formData: FormData) {
  const orderId = formData.get("orderId");
  // Only the owner's own open order; anything else just goes back to the bag.
  const order = typeof orderId === "string" ? await findMyOrder(orderId) : undefined;
  if (order?.status === "pending" && order.paymentStatus === "unpaid") {
    let outcome: Awaited<ReturnType<typeof closeOpenOrder>> | "unreachable";
    try {
      outcome = await closeOpenOrder(order);
      if (outcome === "released") updateTag("products");
    } catch (error) {
      // Stripe unreachable: leave the order open rather than release stock
      // for a session that might still be paid. Its expiry releases it.
      console.error(`[checkout] Couldn't cancel order ${order.id}`, error);
      outcome = "unreachable";
    }
    if (outcome === "completed" && order.stripeCheckoutSessionId) {
      // Paid in another tab before Back was pressed: show the order instead.
      redirect(`/checkout/success?session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}`);
    }
  }
  redirect("/bag?checkout=canceled");
}
