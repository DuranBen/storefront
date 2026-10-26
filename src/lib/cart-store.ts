// Reading and writing the cart cookie. A plain server module, not "use
// server": anything exported from an actions file becomes callable from the
// client, and these must only run behind validated actions.

import "server-only";
import { cookies, headers } from "next/headers";
import { buildCart, loadStockRows, type Cart } from "./cart";
import {
  CART_COOKIE,
  CART_COUNT_COOKIE,
  parseCart,
  serializeCart,
  type CartEntry,
} from "./cart-cookie";

export async function readEntries() {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

/**
 * Save the cart. Entries whose stock row no longer exists are dropped, and
 * the header count comes from buildCart, so it always matches the bag page
 * (sold-out lines aren't counted).
 */
export async function writeEntries(written: CartEntry[]) {
  const rows = await loadStockRows(written.map((entry) => entry.stockId));
  const entries = written.filter((entry) => rows.has(entry.stockId));
  const { itemCount } = buildCart(entries, rows);

  const store = await cookies();
  if (entries.length === 0) {
    store.delete(CART_COOKIE);
    store.delete(CART_COUNT_COOKIE);
    return;
  }
  const options = {
    sameSite: "lax" as const,
    // Secure whenever the request came over HTTPS (so local http still works).
    secure: (await headers()).get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  store.set(CART_COOKIE, serializeCart(entries), { ...options, httpOnly: true });
  // Count only, for the header badge, which reads it on the client.
  store.set(CART_COUNT_COOKIE, String(itemCount), { ...options, httpOnly: false });
}

/** Persist what the bag page shows: reduced quantities applied, sold-out lines dropped. */
export async function saveReconciled(cart: Cart) {
  await writeEntries(
    cart.lines
      .filter((line) => line.issue?.kind !== "unavailable")
      .map((line) => ({ stockId: line.stockId, quantity: line.quantity })),
  );
}

export async function clearCart() {
  await writeEntries([]);
}
