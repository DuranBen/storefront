import type { Metadata } from "next";
import { ListingHeader, ProductCount, ProductGrid } from "@/components/product-grid";
import { newArrivalSlugs } from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/products";

export const metadata: Metadata = {
  title: "New in",
  description: "The latest arrivals: knitwear, outerwear, shoes, sunglasses and fine jewellery.",
};

/** The homepage's "New arrivals" rail, in full (the same curated list). */
export default async function NewInPage() {
  const products = await getProductsBySlugs(newArrivalSlugs);

  return (
    <main className="flex-1">
      <ListingHeader
        eyebrow="Just in"
        title="New in"
        description="The latest arrivals, from knitwear and outerwear to shoes and fine jewellery."
      />
      <section className="container-page section-sm">
        <ProductCount count={products.length} />
        <ProductGrid products={products} label="New in" />
      </section>
    </main>
  );
}
