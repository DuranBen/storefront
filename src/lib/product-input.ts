// Server-side validation for the admin product form. Pure functions, so the
// same rules apply to create and edit; the client form only mirrors a few
// of them as hints.

import type { Img } from "./catalog";

export const PRODUCT_FIELDS = [
  "name",
  "slug",
  "categoryId",
  "price",
  "badge",
  "colour",
  "description",
  "details",
  "madeIn",
  "imageId",
  "imageAlt",
  "imagePosition",
  "sizes",
] as const;
export type ProductField = (typeof PRODUCT_FIELDS)[number];
export type ProductValues = Record<ProductField, string>;
export type ProductErrors = Partial<Record<ProductField, string>>;

export type ProductInput = {
  name: string;
  slug: string;
  categoryId: number;
  priceCents: number;
  badge: string | null;
  colour: string;
  description: string;
  details: string[];
  madeIn: string;
  image: Img;
  /** Create only: size labels, or empty for a one-size product. */
  sizes: string[];
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSPLASH_ID = /^\d{10,13}-[0-9a-f]{12}$/;
const POSITION = /^\d{1,3}% \d{1,3}%$/;
const MAX_PRICE_DOLLARS = 1_000_000;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Every form field as a trimmed string, for redisplaying what was typed. */
export function readProductValues(formData: FormData): ProductValues {
  const values = {} as ProductValues;
  for (const field of PRODUCT_FIELDS) {
    const raw = formData.get(field);
    values[field] = typeof raw === "string" ? raw.trim() : "";
  }
  return values;
}

/**
 * Validate the form. `mode: "edit"` ignores slug and sizes (both fixed after
 * creation). Category existence and slug uniqueness are checked against the
 * database by the action.
 */
export function parseProduct(
  values: ProductValues,
  mode: "create" | "edit",
): { ok: true; input: ProductInput } | { ok: false; errors: ProductErrors } {
  const errors: ProductErrors = {};
  const required = (field: ProductField, label: string, max: number) => {
    const value = values[field];
    if (!value) errors[field] = `Enter ${label}.`;
    else if (value.length > max) errors[field] = `Use at most ${max} characters.`;
    return value;
  };

  const name = required("name", "a name", 120);
  const colour = required("colour", "a colour", 40);
  const description = required("description", "a description", 2000);
  const madeIn = required("madeIn", "where it's made", 60);
  const imageAlt = required("imageAlt", "a description of the image", 200);

  let slug = "";
  if (mode === "create") {
    slug = values.slug;
    if (!slug) errors.slug = "Enter a URL name.";
    else if (slug.length > 100 || !SLUG.test(slug)) {
      errors.slug = "Use lowercase letters, numbers and single hyphens, like silk-scarf.";
    }
  }

  const categoryId = Number(values.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0)
    errors.categoryId = "Choose a category.";

  // Whole dollars: the storefront shows prices without cents.
  let priceCents = 0;
  if (!values.price) errors.price = "Enter a price.";
  else if (!/^\d+$/.test(values.price.replace(/,/g, ""))) {
    errors.price = "Enter a whole-dollar amount, like 790.";
  } else {
    const dollars = Number(values.price.replace(/,/g, ""));
    if (dollars > MAX_PRICE_DOLLARS) errors.price = "That price is too high.";
    else priceCents = dollars * 100;
  }

  const badge = values.badge || null;
  if (badge && badge.length > 30) errors.badge = "Use at most 30 characters.";

  const details = values.details
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (details.length > 12) errors.details = "Use at most 12 lines.";
  else if (details.some((line) => line.length > 200))
    errors.details = "Keep each line under 200 characters.";

  if (!values.imageId) errors.imageId = "Enter an Unsplash photo id.";
  else if (!UNSPLASH_ID.test(values.imageId)) {
    errors.imageId = "Use the photo id from the image URL, like 1560343090-f0409e92791a.";
  }
  if (values.imagePosition && !POSITION.test(values.imagePosition)) {
    errors.imagePosition = "Use two percentages, like 50% 30%.";
  }

  let sizes: string[] = [];
  if (mode === "create" && values.sizes) {
    sizes = values.sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);
    if (sizes.length > 12) errors.sizes = "Use at most 12 sizes.";
    else if (sizes.some((size) => size.length > 10))
      errors.sizes = "Keep each size under 10 characters.";
    else if (new Set(sizes.map((s) => s.toLowerCase())).size !== sizes.length) {
      errors.sizes = "Each size can only appear once.";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: {
      name,
      slug,
      categoryId,
      priceCents,
      badge,
      colour,
      description,
      details,
      madeIn,
      image: {
        id: values.imageId,
        alt: imageAlt,
        ...(values.imagePosition ? { position: values.imagePosition } : {}),
      },
      sizes,
    },
  };
}

/** A stock quantity from a form: a whole number from 0 to 10,000. */
export function parseQuantity(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) return null;
  const quantity = Number(raw.trim());
  return quantity <= 10_000 ? quantity : null;
}
