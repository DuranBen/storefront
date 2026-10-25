import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./product-card";

/** Listing page body: breadcrumb, centred title block, item count and product grid. */
export function ProductListing({
  eyebrow,
  title,
  body,
  products,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  products: Product[];
}) {
  return (
    <>
      <ListingHeader eyebrow={eyebrow} title={title} body={body} />
      <ListingGrid
        products={products}
        empty={
          <>
            <p className="text-body-lg text-muted">Nothing here just yet. Check back soon.</p>
            <Link href="/" className="btn btn-secondary mt-8">
              Back to home
            </Link>
          </>
        }
      />
    </>
  );
}

/** Breadcrumb and centred title block; `children` sits beneath the copy. */
export function ListingHeader({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="container-page py-4 lg:py-6">
        <ol className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {title}
          </li>
        </ol>
      </nav>

      <div className="container-text pt-6 pb-12 text-center md:pt-10 md:pb-16">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h1 className="display-sm mt-3">{title}</h1>
        {body && <p className="mt-5 text-body-lg text-muted">{body}</p>}
        {children}
      </div>
    </>
  );
}

/** Item count over a product grid, or `empty` when there are no products. */
export function ListingGrid({
  products,
  label,
  empty,
}: {
  products: Product[];
  /** Replaces the default "N pieces" count line. */
  label?: ReactNode;
  empty: ReactNode;
}) {
  return (
    <section aria-labelledby="listing-count" className="container-page pb-section">
      <p id="listing-count" className="label-caps mb-6 hairline-b pb-4 text-muted">
        {label ?? `${products.length} ${products.length === 1 ? "piece" : "pieces"}`}
      </p>

      {products.length > 0 ? (
        <ul className="grid-products">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-16 text-center">{empty}</div>
      )}
    </section>
  );
}

/** Placeholder with the listing layout while URL-specific content streams in. */
export function ProductListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products" className="animate-pulse">
      <div className="container-page py-4 lg:py-6">
        <div className="h-4 w-32 bg-canvas" />
      </div>
      <div className="container-text flex flex-col items-center pt-6 pb-12 md:pt-10 md:pb-16">
        <div className="h-3 w-20 bg-canvas" />
        <div className="mt-3 h-10 w-56 bg-canvas" />
      </div>
      <ListingGridSkeleton />
    </div>
  );
}

/** Count line and product tiles only, for pages whose header is already static. */
export function ListingGridSkeleton() {
  return (
    <div className="container-page pb-section">
      <div className="mb-6 h-4 w-20 bg-canvas" />
      <div className="grid-products">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-product bg-canvas" />
        ))}
      </div>
    </div>
  );
}
