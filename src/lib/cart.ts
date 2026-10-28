// Server-side cart: the cookie supplies stock ids and quantities only; every
// price, name and stock level comes from Postgres, read live (no cache) so
// the bag always reflects current pricing and availability.
//
// Reading cookies() is request data: with Cache Components, render anything
// that calls getCart() inside <Suspense>.

import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { categories, products, stock } from "@/db/schema";
import type { Img } from "./catalog";
import { CART_COOKIE, MAX_PER_LINE, parseCart, type CartEntry } from "./cart-cookie";

/** A stock row with the product data the cart needs. */
export type StockRow = {
  stockId: number;
  productId: number;
  size: string | null;
  available: number;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  image: Img;
};

const stockRowColumns = {
  stockId: stock.id,
  productId: stock.productId,
  size: stock.size,
  available: stock.quantity,
  slug: products.slug,
  name: products.name,
  category: categories.name,
  priceCents: products.priceCents,
  image: products.image,
};

/** Live stock rows for the given ids, keyed by id. Unknown ids are absent. */
export async function loadStockRows(ids: number[]) {
  if (ids.length === 0) return new Map<number, StockRow>();
  const rows = await db
    .select(stockRowColumns)
    .from(stock)
    .innerJoin(products, eq(stock.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(stock.id, ids));
  return new Map(rows.map((row) => [row.stockId, row]));
}

/** All stock rows for one product (its sizes, or a single null-size row). */
export async function loadProductStock(slug: string) {
  return db
    .select(stockRowColumns)
    .from(stock)
    .innerJoin(products, eq(stock.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .orderBy(asc(stock.sortOrder));
}

/** Most of one line a shopper may hold: what's in stock, up to the per-line cap. */
export function maxFor(row: Pick<StockRow, "available">) {
  return Math.max(0, Math.min(row.available, MAX_PER_LINE));
}

export type CartIssue =
  | { kind: "reduced"; available: number } // stock fell below the saved quantity
  | { kind: "unavailable" }; // sold out since it was added

export type CartLine = StockRow & {
  quantity: number;
  max: number;
  lineTotalCents: number;
  issue?: CartIssue;
};

export type Cart = { lines: CartLine[]; subtotalCents: number; itemCount: number };

/** Build lines from entries against live rows, reconciling with current stock. */
export function buildCart(entries: CartEntry[], rows: Map<number, StockRow>): Cart {
  const lines: CartLine[] = [];
  for (const entry of entries) {
    const row = rows.get(entry.stockId);
    if (!row) continue; // product or size no longer exists

    const max = maxFor(row);
    let quantity = entry.quantity;
    let issue: CartIssue | undefined;
    if (max === 0) {
      issue = { kind: "unavailable" };
    } else if (quantity > max) {
      quantity = max;
      if (row.available < entry.quantity) issue = { kind: "reduced", available: row.available };
    }

    const counted = issue?.kind === "unavailable" ? 0 : quantity;
    lines.push({ ...row, quantity, max, lineTotalCents: row.priceCents * counted, issue });
  }

  const available = lines.filter((line) => line.issue?.kind !== "unavailable");
  return {
    lines,
    subtotalCents: available.reduce((sum, line) => sum + line.lineTotalCents, 0),
    itemCount: available.reduce((sum, line) => sum + line.quantity, 0),
  };
}

/** The cart cookie's entries (stock ids and quantities), parsed strictly. */
export async function readEntries() {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

/** The shopper's cart, priced and checked against current data. */
export async function getCart(): Promise<Cart> {
  const entries = await readEntries();
  const rows = await loadStockRows(entries.map((entry) => entry.stockId));
  return buildCart(entries, rows);
}
