// Reading and writing the cart cookie. A plain server module, not "use
// server": anything exported from an actions file becomes callable from the
// client, and these must only run behind validated actions.

import "server-only";
import { cookies, headers } from "next/headers";
import { buildCart, loadStockRows, readEntries, type Cart } from "./cart";
import { CART_COOKIE, CART_COUNT_COOKIE, serializeCart, type CartEntry } from "./cart-cookie";
import { findMyOrder } from "./my-orders";
import { getCurrentUser } from "./session";

/** The order this browser's bag last went to checkout as (see settleCheckout). */
const CHECKOUT_COOKIE = "cart_checkout";

async function cookieOptions() {
  return {
    sameSite: "lax" as const,
    // Secure whenever the request came over HTTPS (so local http still works).
    secure: (await headers()).get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

/**
 * Save the cart. Entries whose stock row no longer exists are dropped, and
 * the header count comes from buildCart, so it always matches the bag page
 * (sold-out lines aren't counted). Returns that count.
 */
export async function writeEntries(written: CartEntry[]) {
  const rows = await loadStockRows(written.map((entry) => entry.stockId));
  const entries = written.filter((entry) => rows.has(entry.stockId));
  const { itemCount } = buildCart(entries, rows);

  const store = await cookies();
  if (entries.length === 0) {
    store.delete(CART_COOKIE);
    store.delete(CART_COUNT_COOKIE);
    return 0;
  }
  const options = await cookieOptions();
  store.set(CART_COOKIE, serializeCart(entries), { ...options, httpOnly: true });
  // Count only, for the header badge, which reads it on the client.
  store.set(CART_COUNT_COOKIE, String(itemCount), { ...options, httpOnly: false });
  return itemCount;
}

/** Persist what the bag page shows: reduced quantities applied, sold-out lines dropped. */
export async function saveReconciled(cart: Cart) {
  await writeEntries(
    cart.lines
      .filter((line) => line.issue?.kind !== "unavailable")
      .map((line) => ({ stockId: line.stockId, quantity: line.quantity })),
  );
}

/** Remember the order the bag is checking out as, so settleCheckout can find it. */
export async function rememberCheckout(orderId: string) {
  (await cookies()).set(CHECKOUT_COOKIE, orderId, { ...(await cookieOptions()), httpOnly: true });
}

/**
 * Once the bag's checkout is paid (or its payment is processing), take the
 * ordered pieces out of the bag, leaving anything added since. Runs from the
 * confirmation page and from the bag, so it also happens when the shopper
 * never reached the confirmation page. Once per order: the cookie is cleared.
 * Returns the bag's new item count when it changed.
 */
export async function settleCheckout() {
  const store = await cookies();
  const orderId = store.get(CHECKOUT_COOKIE)?.value;
  if (!orderId) return undefined;

  // Signed out: keep the cookie until the customer is back.
  if (!(await getCurrentUser())) return undefined;
  const order = await findMyOrder(orderId);

  const paid =
    order &&
    (order.status === "confirmed" ||
      order.paymentStatus === "paid" ||
      order.paymentStatus === "processing");
  if (order && !paid && order.status === "pending") return undefined; // still checking out

  store.delete(CHECKOUT_COOKIE);
  if (!paid) return undefined; // closed unpaid (or not theirs): the bag stays as it is

  const ordered = new Map(order.items.map((item) => [item.stockId, item.quantity]));
  const left = (await readEntries()).flatMap((entry) => {
    const quantity = entry.quantity - (ordered.get(entry.stockId) ?? 0);
    return quantity > 0 ? [{ ...entry, quantity }] : [];
  });
  return writeEntries(left);
}
