"use server";

// Admin Server Actions. EVERY action starts with `await requireAdmin()`,
// before reading any input: the proxy lets POSTs through, so each action is
// its own only check. Inputs are validated here, on the server.

import { and, eq, isNotNull, max, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products, stock } from "@/db/schema";
import { violatedConstraint } from "./db-errors";
import {
  parseProduct,
  parseQuantity,
  readProductValues,
  type ProductErrors,
  type ProductValues,
} from "./product-input";
import { requireAdmin } from "./session";

export type ProductFormState =
  | { status: "idle" }
  | { status: "saved"; values: ProductValues }
  | { status: "invalid"; values: ProductValues; errors: ProductErrors }
  | { status: "error"; values: ProductValues; message: string };

const toId = (value: FormDataEntryValue | null) => {
  const n = typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : 0;
  return n > 0 ? n : null;
};

async function categoryExists(id: number) {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id));
  return Boolean(row);
}

/** Create a product and its stock rows (one per size, or one-size), all at 0 units. */
export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products/new");

  const values = readProductValues(formData);
  const parsed = parseProduct(values, "create");
  if (!parsed.ok) return { status: "invalid", values, errors: parsed.errors };
  const input = parsed.input;
  if (!(await categoryExists(input.categoryId))) {
    return { status: "invalid", values, errors: { categoryId: "Choose a category." } };
  }

  const productIdBySlug = sql`(select ${products.id} from ${products} where ${products.slug} = ${input.slug})`;
  const sizes = input.sizes.length > 0 ? input.sizes : [null];
  try {
    // One transaction: the product and its stock rows exist together or not at all.
    await db.batch([
      db.insert(products).values({
        slug: input.slug,
        name: input.name,
        categoryId: input.categoryId,
        priceCents: input.priceCents,
        badge: input.badge,
        colour: input.colour,
        description: input.description,
        details: input.details,
        madeIn: input.madeIn,
        image: input.image,
      }),
      db
        .insert(stock)
        .values(
          sizes.map((size, i) => ({ productId: productIdBySlug, size, sortOrder: i, quantity: 0 })),
        ),
    ]);
  } catch (error) {
    if (violatedConstraint(error) === "products_slug_unique") {
      return {
        status: "invalid",
        values,
        errors: { slug: "Another product already uses this URL name." },
      };
    }
    throw error;
  }

  const [created] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, input.slug));
  updateTag("products");
  redirect(`/admin/products/${created.id}?created=1`);
}

/** Update a product's details, category and price. The slug and sizes are fixed. */
export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products");

  const values = readProductValues(formData);
  const id = toId(formData.get("id"));
  if (!id) return { status: "error", values, message: "This product couldn't be found." };
  const parsed = parseProduct(values, "edit");
  if (!parsed.ok) return { status: "invalid", values, errors: parsed.errors };
  const input = parsed.input;
  if (!(await categoryExists(input.categoryId))) {
    return { status: "invalid", values, errors: { categoryId: "Choose a category." } };
  }

  const [updated] = await db
    .update(products)
    .set({
      name: input.name,
      categoryId: input.categoryId,
      priceCents: input.priceCents,
      badge: input.badge,
      colour: input.colour,
      description: input.description,
      details: input.details,
      madeIn: input.madeIn,
      image: input.image,
    })
    .where(eq(products.id, id))
    .returning({ id: products.id });
  if (!updated) return { status: "error", values, message: "This product no longer exists." };

  // The storefront reads products through cached functions tagged "products".
  updateTag("products");
  return { status: "saved", values };
}

export type StockFormState =
  | { status: "idle" }
  | { status: "saved"; quantity: number }
  | { status: "conflict"; current: number }
  | { status: "invalid"; message: string };

/**
 * Set a size's quantity, only if it still holds what the admin saw
 * (`expected`): checkout reserves stock concurrently, and a blind overwrite
 * could undo or double-count a reservation.
 */
export async function setStock(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  await requireAdmin("/admin/products");

  const stockId = toId(formData.get("stockId"));
  const expected = parseQuantity(formData.get("expected"));
  const quantity = parseQuantity(formData.get("quantity"));
  if (!stockId || expected === null)
    return { status: "invalid", message: "Reload the page and try again." };
  if (quantity === null)
    return { status: "invalid", message: "Enter a whole number from 0 to 10,000." };

  const [row] = await db
    .update(stock)
    .set({ quantity })
    .where(and(eq(stock.id, stockId), eq(stock.quantity, expected)))
    .returning({ quantity: stock.quantity });
  if (!row) {
    const [current] = await db
      .select({ quantity: stock.quantity })
      .from(stock)
      .where(eq(stock.id, stockId));
    if (!current) return { status: "invalid", message: "This size no longer exists." };
    return { status: "conflict", current: current.quantity };
  }

  updateTag("products");
  return { status: "saved", quantity: row.quantity };
}

export type AddSizeState =
  { status: "idle" } | { status: "saved"; size: string } | { status: "invalid"; message: string };

/** Add a size (at 0 units) to a product that's sold in sizes. */
export async function addSize(_prev: AddSizeState, formData: FormData): Promise<AddSizeState> {
  await requireAdmin("/admin/products");

  const productId = toId(formData.get("productId"));
  const raw = formData.get("size");
  const size = typeof raw === "string" ? raw.trim() : "";
  if (!productId) return { status: "invalid", message: "Reload the page and try again." };
  if (!size || size.length > 10)
    return { status: "invalid", message: "Enter a size of up to 10 characters." };

  const [sized] = await db
    .select({ last: max(stock.sortOrder) })
    .from(stock)
    .where(and(eq(stock.productId, productId), isNotNull(stock.size)));
  // A one-size product has a single row without a size; mixing the two would
  // hide that row from the bag.
  if (sized?.last === null || sized?.last === undefined) {
    return { status: "invalid", message: "This product is one-size, so sizes can't be added." };
  }

  try {
    await db.insert(stock).values({ productId, size, sortOrder: sized.last + 1, quantity: 0 });
  } catch (error) {
    if (violatedConstraint(error) === "stock_product_id_size_unique") {
      return { status: "invalid", message: `Size ${size} already exists.` };
    }
    throw error;
  }

  updateTag("products");
  return { status: "saved", size };
}
