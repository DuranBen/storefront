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
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Img } from "@/lib/catalog";
import { user } from "./auth-schema";

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
 * Units available to sell per product and size: checkout reservations are
 * already subtracted, and return if the order isn't paid. `size` is null for
 * one-size items.
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

/** The order's lifecycle. `pending`: stock is reserved while payment is awaited. */
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "canceled", "expired"]);

/**
 * What Stripe reports about the payment, kept apart from the order's
 * lifecycle: an order can be pending while a delayed payment is processing,
 * or canceled after a payment failed.
 */
export const paymentStatus = pgEnum("payment_status", ["unpaid", "processing", "paid", "failed"]);

/** A customer's order. Totals are computed server-side from database prices. */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // Snapshot at order time; the account's email may change later.
    email: text("email").notNull(),
    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    shipping: jsonb("shipping"),
    // When the stock reservation lapses if payment hasn't completed.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    // Set when reserved stock is returned, so it's only ever returned once.
    stockReleasedAt: timestamp("stock_released_at", { withTimezone: true }),
    // From Stripe's refund and dispute events (the Dashboard is where they're made).
    amountRefundedCents: integer("amount_refunded_cents").notNull().default(0),
    disputeStatus: text("dispute_status"),
    // `created` of the dispute event last applied, so an older one can't overwrite it.
    disputeUpdatedAt: timestamp("dispute_updated_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_status_expires_at_idx").on(t.status, t.expiresAt),
    // One open checkout per customer, so concurrent checkouts (two tabs)
    // can't each reserve stock and each be paid.
    uniqueIndex("orders_one_open_checkout_per_user_idx")
      .on(t.userId)
      .where(sql`${t.status} = 'pending' AND ${t.paymentStatus} = 'unpaid'`),
    check("orders_currency_check", sql`${t.currency} ~ '^[a-z]{3}$'`),
    check("orders_subtotal_cents_check", sql`${t.subtotalCents} >= 0`),
    check("orders_total_cents_check", sql`${t.totalCents} >= 0`),
    check("orders_confirmed_paid_check", sql`${t.status} <> 'confirmed' OR ${t.paymentStatus} = 'paid'`),
    check("orders_paid_at_check", sql`(${t.paymentStatus} = 'paid') = (${t.paidAt} IS NOT NULL)`),
    check(
      "orders_amount_refunded_cents_check",
      sql`${t.amountRefundedCents} BETWEEN 0 AND ${t.totalCents}`,
    ),
    // Admin order list: newest first.
    index("orders_created_at_idx").on(t.createdAt, t.id),
  ],
);

/**
 * One line per reserved stock row. Name, size, image and price are
 * snapshots, so later catalogue changes never rewrite an order.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    stockId: integer("stock_id")
      .notNull()
      .references(() => stock.id, { onDelete: "restrict" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    size: text("size"),
    image: jsonb("image").$type<Img>().notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [
    // Its index leads with order_id, so it also serves "items for an order".
    unique("order_items_order_id_stock_id_unique").on(t.orderId, t.stockId),
    check("order_items_unit_price_cents_check", sql`${t.unitPriceCents} >= 0`),
    check("order_items_quantity_check", sql`${t.quantity} > 0`),
    check(
      "order_items_line_total_check",
      sql`${t.lineTotalCents} = ${t.unitPriceCents} * ${t.quantity}`,
    ),
  ],
);

/** Products a signed-in customer has saved. */
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/** Newsletter sign-ups, by lowercased email. */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  createdAt: createdAt(),
});

/** Stripe webhook events already seen, so a redelivered event is processed once. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  stock: one(stock, { fields: [orderItems.stockId], references: [stock.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// Kept here rather than in the generated auth-schema.ts, which is regenerated.
export const userOrdersRelations = relations(user, ({ many }) => ({
  orders: many(orders),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export * from "./auth-schema";
