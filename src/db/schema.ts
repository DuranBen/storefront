// Drizzle table definitions live here.
//
// Better Auth's tables (user, session, account, verification, rate_limit) are
// generated into ./auth-schema.ts and re-exported below, so drizzle-kit, `db`
// and the Better Auth adapter all see them.

import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { Img } from "@/lib/catalog";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    priceCents: integer("price_cents").notNull(),
    badge: text("badge"),
    colour: text("colour").notNull(),
    description: text("description").notNull(),
    details: text("details").array().notNull().default(sql`'{}'::text[]`),
    madeIn: text("made_in").notNull(),
    image: jsonb("image").$type<Img>().notNull(),
    gallery: jsonb("gallery").$type<Img[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    check("products_price_cents_check", sql`${t.priceCents} >= 0`),
  ],
);

/**
 * Units on hand per product and size. `size` is null for one-size items.
 * Sizes are not variants: they have no price or SKU of their own.
 */
export const stock = pgTable(
  "stock",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size"),
    sortOrder: integer("sort_order").notNull().default(0),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("stock_product_id_size_unique").on(t.productId, t.size).nullsNotDistinct(),
    check("stock_quantity_check", sql`${t.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  stock: many(stock),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, { fields: [stock.productId], references: [products.id] }),
}));

export * from "./auth-schema";
