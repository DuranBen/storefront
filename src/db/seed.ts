// Loads the sample catalogue into the database. Safe to re-run: categories
// and products are upserted by slug, and each product's stock is replaced.
//
//   npm run db:seed

import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products, stock } from "./schema";
import * as seed from "./seed-data";

async function main() {
  const categoryRows = await db
    .insert(categories)
    .values(seed.categories)
    .onConflictDoUpdate({ target: categories.slug, set: { name: sql`excluded.name` } })
    .returning({ id: categories.id, name: categories.name });
  const categoryIds = new Map(categoryRows.map((c) => [c.name, c.id]));

  for (const product of seed.products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Unknown category for ${product.slug}: ${product.category}`);

    const values = {
      slug: product.slug,
      name: product.name,
      categoryId,
      priceCents: product.price * 100,
      badge: product.badge ?? null,
      colour: product.colour,
      description: product.description,
      details: product.details,
      madeIn: product.madeIn,
      image: product.image,
      gallery: product.gallery ?? [],
    };

    const [{ id }] = await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({ target: products.slug, set: values })
      .returning({ id: products.id });

    const stockRows = product.sizes
      ? product.sizes.map((size, i) => ({
          productId: id,
          size: size.label,
          sortOrder: i,
          quantity: size.stock,
        }))
      : [{ productId: id, size: null, sortOrder: 0, quantity: product.stock ?? 0 }];

    await db.batch([
      db.delete(stock).where(eq(stock.productId, id)),
      db.insert(stock).values(stockRows),
    ]);
  }

  console.log(`Seeded ${categoryRows.length} categories and ${seed.products.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
