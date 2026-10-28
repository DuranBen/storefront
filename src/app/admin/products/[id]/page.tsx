import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminBackLink, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { AvailabilityPanel } from "@/components/admin/availability-panel";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, listCategoryOptions } from "@/lib/admin";
import type { ProductValues } from "@/lib/product-input";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false },
};

// The id is request data, so it's read inside Suspense; getAdminProduct()
// calls requireAdmin() itself, and everything here renders after it.
export default function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({
  params,
  searchParams,
}: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const categories = await listCategoryOptions();

  const initial: ProductValues = {
    name: product.name,
    slug: product.slug,
    categoryId: String(product.categoryId),
    price: String(product.priceCents / 100),
    badge: product.badge ?? "",
    colour: product.colour,
    description: product.description,
    details: product.details.join("\n"),
    madeIn: product.madeIn,
    imageId: product.image.id,
    imageAlt: product.image.alt,
    imagePosition: product.image.position ?? "",
    sizes: "",
  };

  return (
    <>
      <AdminBackLink href="/admin/products" label="All products" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="heading">{product.name}</h2>
        <Link href={`/products/${product.slug}`} className="label-caps link shrink-0">
          View on site
        </Link>
      </div>
      {created && (
        <p role="status" className="mt-6 border border-line bg-canvas px-4 py-3 text-body-sm">
          Product created. It&rsquo;s live but sold out until you add stock under Availability.
        </p>
      )}
      <ProductForm mode="edit" productId={product.id} initial={initial} categories={categories} />
      <AvailabilityPanel
        productId={product.id}
        rows={product.stock.map((row) => ({
          id: row.id,
          size: row.size,
          quantity: row.quantity,
          reserved: row.reserved,
        }))}
      />
    </>
  );
}
