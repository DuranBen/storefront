// The signed-in customer's wishlist. Every function resolves the customer
// from the session itself, like ./my-orders.ts: no caller passes a user id.

import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getProductsBySlugs } from "./products";
import { requireUser } from "./session";

/** Slugs of the customer's saved products, most recently saved first. */
export async function wishlistSlugs(userId: string) {
  const rows = await db
    .select({ slug: products.slug })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));
  return rows.map((row) => row.slug);
}

/** The wishlist page's products. Redirects to sign-in when signed out. */
export async function getMyWishlist() {
  const user = await requireUser("/wishlist");
  return getProductsBySlugs(await wishlistSlugs(user.id));
}
