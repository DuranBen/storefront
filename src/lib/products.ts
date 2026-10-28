// Catalogue reads from Postgres. Server-only: this module imports `db`.
// Every read is cached under the "products" tag; stock is shown on cards,
// so the lifetime is kept short. Revalidate the tag after stock changes.

import "server-only";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products, stock } from "@/db/schema";
import type { Product } from "./catalog";

const withCategoryAndStock = {
  category: true,
  stock: { orderBy: asc(stock.sortOrder) },
} as const;

type ProductRow = NonNullable<Awaited<ReturnType<typeof findProduct>>>;

function findProduct(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withCategoryAndStock,
  });
}

/** Map a database row to the storefront's `Product` shape. */
function toProduct(row: ProductRow): Product {
  const sized = row.stock.filter((s) => s.size !== null);

  return {
    slug: row.slug,
    name: row.name,
    category: row.category.name,
    categorySlug: row.category.slug,
    price: row.priceCents / 100,
    image: row.image,
    gallery: row.gallery,
    badge: row.badge ?? undefined,
    colour: row.colour,
    description: row.description,
    details: row.details,
    madeIn: row.madeIn,
    ...(sized.length > 0
      ? { sizes: sized.map((s) => ({ label: s.size!, stock: s.quantity })) }
      : { stock: row.stock[0]?.quantity ?? 0 }),
  };
}

export async function getProduct(slug: string) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const row = await findProduct(slug);
  return row ? toProduct(row) : undefined;
}

/** Look up products by slug, in the given order, skipping any that don't exist. */
export async function getProductsBySlugs(slugs: string[]) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: inArray(products.slug, slugs),
    with: withCategoryAndStock,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}

/** Same-category products first, then the rest of the catalogue. */
export async function getRelatedProducts(slug: string, categorySlug: string, limit = 8) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: ne(products.slug, slug),
    with: withCategoryAndStock,
    orderBy: (p, { asc }) => [
      sql`${p.categoryId} = (select ${categories.id} from ${categories} where ${categories.slug} = ${categorySlug}) desc`,
      asc(p.id),
    ],
    limit,
  });
  return rows.map(toProduct);
}

/** Every product, newest first. */
export async function getAllProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    with: withCategoryAndStock,
    orderBy: [desc(products.createdAt), desc(products.id)],
  });
  return rows.map(toProduct);
}

/** Products in any of the given categories, newest first. */
export async function getProductsByCategories(categorySlugs: string[]) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    where: inArray(
      products.categoryId,
      db.select({ id: categories.id }).from(categories).where(inArray(categories.slug, categorySlugs)),
    ),
    with: withCategoryAndStock,
    orderBy: [desc(products.createdAt), desc(products.id)],
  });
  return rows.map(toProduct);
}

export async function getCategory(slug: string) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const [row] = await db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row;
}

export async function getCategorySlugs() {
  const rows = await db.select({ slug: categories.slug }).from(categories);
  return rows.map((row) => row.slug);
}

/** Escape `\`, `%` and `_` so a search word matches literally in LIKE. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Products whose name, colour, category or description contain every word
 * of the query. Not cached: queries are open-ended. The caller bounds `query`.
 */
export async function searchProducts(query: string, limit = 48) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  if (words.length === 0) return [];
  const rows = await db.query.products.findMany({
    where: and(
      ...words.map((word) => {
        const pattern = `%${escapeLike(word)}%`;
        return or(
          ilike(products.name, pattern),
          ilike(products.colour, pattern),
          ilike(products.description, pattern),
          inArray(
            products.categoryId,
            db.select({ id: categories.id }).from(categories).where(ilike(categories.name, pattern)),
          ),
        );
      }),
    ),
    with: withCategoryAndStock,
    orderBy: [asc(products.name)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getProductSlugs() {
  const rows = await db.select({ slug: products.slug }).from(products).orderBy(asc(products.id));
  return rows.map((row) => row.slug);
}
