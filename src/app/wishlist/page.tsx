import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListingSkeleton, ProductCount, ProductGrid } from "@/components/product-grid";
import { getMyWishlist } from "@/lib/wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

// Signed-out visitors are redirected by src/proxy.ts; getMyWishlist() is the
// real check (requireUser), inside Suspense as Cache Components needs.
export default function WishlistPage() {
  return (
    <main className="flex-1">
      <div className="container-page pt-section-sm">
        <h1 className="display-sm">Wishlist</h1>
      </div>
      <Suspense fallback={<ListingSkeleton heading={false} />}>
        <SavedProducts />
      </Suspense>
    </main>
  );
}

async function SavedProducts() {
  const products = await getMyWishlist();

  return (
    <section className="container-page section-sm">
      {products.length === 0 ? (
        <div className="hairline-t py-16 text-center">
          <h2 className="heading">Nothing saved yet</h2>
          <p className="mt-3 text-body-lg text-muted">
            Tap the heart on any piece to keep it here.
          </p>
          <Link href="/new" className="btn btn-primary mt-8">
            See what&rsquo;s new
          </Link>
        </div>
      ) : (
        <>
          <ProductCount count={products.length} />
          <ProductGrid products={products} label="Saved pieces" />
        </>
      )}
    </section>
  );
}
