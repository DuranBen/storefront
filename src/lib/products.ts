// Catalogue reads from Postgres. Server-only: this module imports `db`.
// Every read is cached under the "products" tag; stock is shown on cards,
// so the lifetime is kept short. Revalidate the tag after stock changes.

import { and, asc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products, stock } from "@/db/schema";
import { MAX_SEARCH_LENGTH, type Product } from "./catalog";

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

/** Most recently added products first. */
export async function getLatestProducts(limit = 24) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db.query.products.findMany({
    with: withCategoryAndStock,
    orderBy: (p, { desc }) => [desc(p.createdAt), desc(p.id)],
    limit,
  });
  return rows.map(toProduct);
}

/** A category and its products, or undefined if the slug doesn't exist. */
export async function getCategory(slug: string) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) return undefined;

  const rows = await db.query.products.findMany({
    where: eq(products.categoryId, category.id),
    with: withCategoryAndStock,
    orderBy: (p, { asc }) => [asc(p.id)],
  });
  return { slug: category.slug, name: category.name, products: rows.map(toProduct) };
}

/**
 * Products matching every word of `query` in their name, colour, category or
 * description. Name matches rank first.
 */
export async function searchProducts(query: string, limit = 48) {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const terms = query.slice(0, MAX_SEARCH_LENGTH).trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  // Escape LIKE wildcards so "%" and "_" in the query match literally.
  const pattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

  const rows = await db.query.products.findMany({
    where: and(
      ...terms.map((term) =>
        or(
          ilike(products.name, pattern(term)),
          ilike(products.colour, pattern(term)),
          ilike(products.description, pattern(term)),
          inArray(
            products.categoryId,
            db
              .select({ id: categories.id })
              .from(categories)
              .where(ilike(categories.name, pattern(term))),
          ),
        ),
      ),
    ),
    with: withCategoryAndStock,
    orderBy: (p, { asc }) => [
      sql`${and(...terms.map((term) => ilike(p.name, pattern(term))))} desc`,
      asc(p.id),
    ],
    limit,
  });
  return rows.map(toProduct);
}

export async function getCategorySlugs() {
  const rows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.id));
  return rows.map((row) => row.slug);
}

export async function getProductSlugs() {
  const rows = await db.select({ slug: products.slug }).from(products).orderBy(asc(products.id));
  return rows.map((row) => row.slug);
}
