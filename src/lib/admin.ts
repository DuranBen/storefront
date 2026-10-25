// Admin-only reads. Each exported function authorizes the caller itself with
// requireAdmin(), so it's safe wherever it's called from.

import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, user } from "@/db/schema";
import { requireAdmin } from "./session";

export async function getAdminOverview() {
  const admin = await requireAdmin();

  const [[productCount], [categoryCount], [customerCount]] = await db.batch([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(user).where(eq(user.role, "customer")),
  ]);

  return {
    admin,
    stats: [
      { label: "Products", value: productCount.value },
      { label: "Categories", value: categoryCount.value },
      { label: "Customers", value: customerCount.value },
    ],
  };
}
