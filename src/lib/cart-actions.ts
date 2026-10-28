"use server";

import { refresh } from "next/cache";
import { loadProductStock, loadStockRows, maxFor, readEntries } from "./cart";
import { MAX_LINES, MAX_PER_LINE, type CartEntry } from "./cart-cookie";
import { writeEntries } from "./cart-store";

// Every input here comes from the client and is validated. There is no
// price, name or total parameter: those are always read from the database.

// Strings must be plain digits: Number() would read "" as 0 (which removes
// the line) and accept forms like "0x5" or "1e1".
const toNumber = (value: unknown) =>
  typeof value === "string" ? (/^\d{1,9}$/.test(value) ? Number(value) : null) : value;

const toId = (value: unknown) => {
  const n = toNumber(value);
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : null;
};

const toQuantity = (value: unknown) => {
  const n = toNumber(value);
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
};

export type AddToCartResult =
  | { status: "added"; quantity: number }
  | { status: "limited"; quantity: number; max: number }
  | { status: "sold_out" }
  | { status: "invalid"; message: string };

/**
 * Add a product (in a size, when it has sizes) to the bag. The quantity is
 * capped at what's in stock, including what's already in the bag.
 */
export async function addToCart(input: {
  slug: unknown;
  size?: unknown;
  quantity?: unknown;
}): Promise<AddToCartResult> {
  const slug = typeof input.slug === "string" && input.slug.length <= 200 ? input.slug : null;
  // null/undefined = no size; otherwise a short string, or the input is rejected.
  const size =
    input.size === undefined || input.size === null
      ? null
      : typeof input.size === "string" && input.size.length <= 20
        ? input.size
        : undefined;
  const quantity = input.quantity === undefined ? 1 : toQuantity(input.quantity);
  if (!slug || size === undefined || !quantity) {
    return { status: "invalid", message: "Something went wrong. Please try again." };
  }
  const requested = Math.min(quantity, MAX_PER_LINE);

  const rows = await loadProductStock(slug);
  if (rows.length === 0) {
    return { status: "invalid", message: "This product is no longer available." };
  }
  const sized = rows.some((row) => row.size !== null);
  if (sized && size === null) return { status: "invalid", message: "Please select a size." };
  const row = sized ? rows.find((r) => r.size === size) : size === null ? rows[0] : undefined;
  if (!row) return { status: "invalid", message: "That size isn't available." };

  const max = maxFor(row);
  if (max === 0) return { status: "sold_out" };

  const entries = await readEntries();
  const existing = entries.find((entry) => entry.stockId === row.stockId);
  if (!existing && entries.length >= MAX_LINES) {
    return { status: "invalid", message: "Your bag is full. Remove something to add this." };
  }

  const current = existing?.quantity ?? 0;
  const next = Math.min(current + requested, max);
  const updated = existing
    ? entries.map((entry) => (entry === existing ? { ...entry, quantity: next } : entry))
    : [...entries, { stockId: row.stockId, quantity: next }];

  await writeEntries(updated);
  refresh();
  return next < current + requested
    ? { status: "limited", quantity: next, max }
    : { status: "added", quantity: next };
}

/** Set a line's quantity (form fields: stockId, quantity). 0 removes it; above stock is capped. */
export async function updateCartQuantity(formData: FormData) {
  const stockId = toId(formData.get("stockId"));
  const quantity = toQuantity(formData.get("quantity"));
  if (stockId === null || quantity === null) return;

  const entries = await readEntries();
  if (!entries.some((entry) => entry.stockId === stockId)) return;

  let updated: CartEntry[];
  if (quantity === 0) {
    updated = entries.filter((entry) => entry.stockId !== stockId);
  } else {
    const row = (await loadStockRows([stockId])).get(stockId);
    const max = row ? maxFor(row) : 0;
    // Gone or sold out: leave the line for the shopper to see and remove.
    if (max === 0) return;
    updated = entries.map((entry) =>
      entry.stockId === stockId ? { ...entry, quantity: Math.min(quantity, max) } : entry,
    );
  }

  await writeEntries(updated);
  refresh();
}

/** Remove a line (form field: stockId). */
export async function removeFromCart(formData: FormData) {
  const stockId = toId(formData.get("stockId"));
  if (stockId === null) return;

  const entries = await readEntries();
  const updated = entries.filter((entry) => entry.stockId !== stockId);
  if (updated.length === entries.length) return;

  await writeEntries(updated);
  refresh();
}
