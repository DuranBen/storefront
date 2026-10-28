"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "./session";
import { wishlistSlugs } from "./wishlist";

// Every input here comes from the client and is validated; the customer is
// always the signed-in user, never a parameter.

/** The signed-in customer's saved product slugs, or null when signed out. */
export async function getWishlistSlugs(): Promise<string[] | null> {
  const user = await getCurrentUser();
  return user ? wishlistSlugs(user.id) : null;
}

export type SetWishlistedResult =
  | { status: "saved" | "removed" }
  | { status: "signed_out" }
  | { status: "invalid" };

/** Save or unsave a product. Idempotent: it sets the state rather than toggling it. */
export async function setWishlisted(slug: unknown, saved: unknown): Promise<SetWishlistedResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "signed_out" };
  if (typeof slug !== "string" || slug.length > 200 || typeof saved !== "boolean") {
    return { status: "invalid" };
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product) return { status: "invalid" };

  if (saved) {
    await db
      .insert(wishlistItems)
      .values({ userId: user.id, productId: product.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, product.id)));
  }
  // Re-render the current page (the wishlist page drops an unsaved piece).
  refresh();
  return { status: saved ? "saved" : "removed" };
}
