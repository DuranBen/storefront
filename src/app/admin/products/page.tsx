import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { StockStatus } from "@/components/product/stock-status";
import { listAdminProducts } from "@/lib/admin";
import { formatPrice, stockState, unsplash } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false },
};

// AdminSection and listAdminProducts each call requireAdmin(): the layout's
// check alone doesn't cover client-side navigation between admin pages.
export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminSection
        path="/admin/products"
        title="Products"
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            New product
          </Link>
        }
      >
        <ProductList />
      </AdminSection>
    </Suspense>
  );
}

async function ProductList() {
  const products = await listAdminProducts();

  if (products.length === 0) {
    return (
      <div className="mt-10 bg-canvas p-8 text-center md:p-12">
        <p className="text-body-lg">No products yet.</p>
        <Link href="/admin/products/new" className="btn btn-primary mt-6">
          Create the first product
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 text-body-sm text-muted">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      <ul className="mt-4 hairline-t">
        {products.map((product) => {
          const units = product.stock.reduce((sum, row) => sum + row.quantity, 0);
          const sizes = product.stock.filter((row) => row.size !== null).length;
          return (
            <li
              key={product.id}
              className="group relative grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 hairline-b py-4"
            >
              <div className="media-product" aria-hidden="true">
                <Image
                  src={unsplash(product.image.id, 160)}
                  alt=""
                  fill
                  sizes="3rem"
                  style={{ objectPosition: product.image.position }}
                />
              </div>
              <div className="min-w-0">
                <h3>
                  {/* Stretched link: the whole row opens the product. */}
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="link-quiet after:absolute after:inset-0"
                  >
                    {product.name}
                  </Link>
                  {product.badge && (
                    <span className="eyebrow ml-2 bg-canvas px-1.5 py-0.5 align-middle">
                      {product.badge}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-body-sm text-muted">
                  {product.category.name}
                  {sizes > 0 && <> · {sizes} sizes</>}
                </p>
                <div className="mt-1 text-body-sm">
                  <StockStatus state={stockState(units)} />
                </div>
              </div>
              <p className="text-right">{formatPrice(product.priceCents / 100)}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
