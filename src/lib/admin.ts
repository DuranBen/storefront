// Admin-only reads. Each exported function authorizes the caller itself with
// requireAdmin(), so it's safe wherever it's called from. Uncached: admins
// should always see current data.

import "server-only";
import { and, asc, between, count, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, orderItems, orders, products, stock } from "@/db/schema";
import { LOW_STOCK_THRESHOLD } from "./catalog";
import { requireAdmin } from "./session";

export async function listAdminProducts() {
  await requireAdmin("/admin/products");
  return db.query.products.findMany({
    with: { category: true, stock: { orderBy: asc(stock.sortOrder) } },
    orderBy: asc(products.name),
  });
}

/**
 * Units of each stock row held by checkouts in progress: order lines of
 * pending orders whose stock hasn't been returned. These are already
 * subtracted from stock.quantity (which is what's available to sell).
 */
async function reservedByStock(stockIds: number[]) {
  if (stockIds.length === 0) return new Map<number, number>();
  const rows = await db
    .select({ stockId: orderItems.stockId, reserved: sql<number>`sum(${orderItems.quantity})::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        inArray(orderItems.stockId, stockIds),
        eq(orders.status, "pending"),
        isNull(orders.stockReleasedAt),
      ),
    )
    .groupBy(orderItems.stockId);
  return new Map(rows.map((row) => [row.stockId, row.reserved]));
}

/** One product with its category and stock rows (each with `reserved`); undefined for an unknown or malformed id. */
export async function getAdminProduct(id: string) {
  await requireAdmin(`/admin/products/${encodeURIComponent(id)}`);
  if (!/^\d{1,9}$/.test(id)) return undefined;
  const product = await db.query.products.findFirst({
    where: eq(products.id, Number(id)),
    with: { category: true, stock: { orderBy: asc(stock.sortOrder) } },
  });
  if (!product) return undefined;
  const reserved = await reservedByStock(product.stock.map((row) => row.id));
  return {
    ...product,
    stock: product.stock.map((row) => ({ ...row, reserved: reserved.get(row.id) ?? 0 })),
  };
}

export async function listCategoryOptions(returnTo = "/admin/products") {
  await requireAdmin(returnTo);
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
}

export const STOCK_VIEWS = ["all", "low", "out"] as const;
export type StockView = (typeof STOCK_VIEWS)[number];
export const STOCK_PAGE_SIZE = 100;

/** Low stock: 1 to LOW_STOCK_THRESHOLD units (0 is "sold out"), matching the storefront. */
const viewCondition = (view: StockView): SQL | undefined =>
  view === "out"
    ? eq(stock.quantity, 0)
    : view === "low"
      ? between(stock.quantity, 1, LOW_STOCK_THRESHOLD)
      : undefined;

/** Sort key of a stock row on the stock page; stock.id breaks every tie. */
const stockSortKey = sql`(${products.name}, ${products.id}, ${stock.sortOrder}, ${stock.id})`;

/** The same key for one stock row, as a scalar subquery (null for an unknown id). */
const sortKeyOf = (stockId: number) => sql`(
  select p2.name, p2.id, s2.sort_order, s2.id
  from stock s2 join products p2 on p2.id = s2.product_id
  where s2.id = ${stockId}
)`;

/**
 * Stock rows for the stock page, grouped by product (rows of a product are
 * consecutive), STOCK_PAGE_SIZE at a time. Pages continue from a row
 * (`after` / `before` a stock id) rather than an offset, so rows that change
 * filter while an admin works don't make the next page skip or repeat rows.
 * An unknown or exhausted cursor falls back to the first page. Filters are
 * validated by the caller.
 */
export async function listStock({
  view,
  categoryId,
  after = null,
  before = null,
}: {
  view: StockView;
  categoryId: number | null;
  after?: number | null;
  before?: number | null;
}) {
  await requireAdmin("/admin/stock");

  const inCategory = categoryId ? eq(products.categoryId, categoryId) : undefined;
  const filter = and(viewCondition(view), inCategory);

  // Counts for each view (within the category), for the filter links.
  const [counts] = await db
    .select({
      all: count(),
      low: sql<number>`count(*) filter (where ${between(stock.quantity, 1, LOW_STOCK_THRESHOLD)})::int`,
      out: sql<number>`count(*) filter (where ${eq(stock.quantity, 0)})::int`,
    })
    .from(stock)
    .innerJoin(products, eq(products.id, stock.productId))
    .where(inCategory);

  const fetchRows = (cursor: SQL | undefined, descending: boolean) =>
    db
      .select({
        stockId: stock.id,
        size: stock.size,
        quantity: stock.quantity,
        productId: products.id,
        productName: products.name,
        image: products.image,
        category: categories.name,
      })
      .from(stock)
      .innerJoin(products, eq(products.id, stock.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(filter, cursor))
      .orderBy(
        ...[products.name, products.id, stock.sortOrder, stock.id].map(descending ? desc : asc),
      )
      .limit(STOCK_PAGE_SIZE);

  let rows = after
    ? await fetchRows(sql`${stockSortKey} > ${sortKeyOf(after)}`, false)
    : before
      ? (await fetchRows(sql`${stockSortKey} < ${sortKeyOf(before)}`, true)).reverse()
      : await fetchRows(undefined, false);
  // Past the end, an unknown cursor, or a short page going back: start over.
  if ((after && rows.length === 0) || (before && rows.length < STOCK_PAGE_SIZE)) {
    rows = await fetchRows(undefined, false);
  }

  // Where this page starts within the filtered list.
  const [{ preceding }] = rows.length
    ? await db
        .select({ preceding: count() })
        .from(stock)
        .innerJoin(products, eq(products.id, stock.productId))
        .where(and(filter, sql`${stockSortKey} < ${sortKeyOf(rows[0].stockId)}`))
    : [{ preceding: 0 }];

  const total = counts[view];
  const reserved = await reservedByStock(rows.map((row) => row.stockId));
  return {
    rows: rows.map((row) => ({ ...row, reserved: reserved.get(row.stockId) ?? 0 })),
    counts,
    total,
    /** 1-based position of the first row. */
    start: preceding + 1,
    hasPrevious: preceding > 0,
    hasNext: preceding + rows.length < total,
  };
}
