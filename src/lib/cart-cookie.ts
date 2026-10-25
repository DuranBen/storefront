// The cart lives in a cookie as stock row ids and quantities only. Prices,
// names and stock levels are always read from the database (src/lib/cart.ts),
// so the cookie is untrusted input: parse it strictly and drop anything odd.
// Client-safe: no `db` imports (the header reads the count cookie).

export const CART_COOKIE = "cart";
/** Item count only, readable by the header so storefront pages stay static. */
export const CART_COUNT_COOKIE = "cart_count";

export const MAX_LINES = 30;
export const MAX_PER_LINE = 10;

export type CartEntry = { stockId: number; quantity: number };

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

/** Parse the cookie value; malformed input yields an empty or partial cart, never an error. */
export function parseCart(raw: string | undefined): CartEntry[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const entries = new Map<number, number>();
  for (const item of data) {
    if (entries.size >= MAX_LINES) break;
    if (typeof item !== "object" || item === null) continue;
    const { s, q } = item as { s?: unknown; q?: unknown };
    if (!isId(s) || !isId(q) || entries.has(s)) continue;
    entries.set(s, Math.min(q, MAX_PER_LINE));
  }
  return [...entries].map(([stockId, quantity]) => ({ stockId, quantity }));
}

export function serializeCart(entries: CartEntry[]): string {
  return JSON.stringify(entries.map(({ stockId, quantity }) => ({ s: stockId, q: quantity })));
}

/** Fired on the client after the cart changes, so the header re-reads its count. */
export const CART_CHANGE_EVENT = "cart:change";

export function notifyCartChange() {
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

/**
 * Overwrite the header's count with the bag page's authoritative one. The
 * bag reconciles with live stock on every render, but a Server Component
 * can't write cookies, so without this the badge would lag behind a stock
 * change until the next cart action.
 */
export function syncCartCount(count: number) {
  const age = count > 0 ? 60 * 60 * 24 * 30 : 0;
  document.cookie = `${CART_COUNT_COOKIE}=${count}; path=/; max-age=${age}; samesite=lax`;
  notifyCartChange();
}

/** The header's item count; 0 for a missing or malformed cookie. */
export function parseCount(raw: string | undefined) {
  const count = Number(raw);
  return Number.isSafeInteger(count) && count > 0 ? Math.min(count, MAX_LINES * MAX_PER_LINE) : 0;
}
