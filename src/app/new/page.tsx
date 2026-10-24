import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
import { getLatestProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest ready-to-wear, shoes, leather goods and jewellery, just in.",
};

export default async function NewArrivalsPage() {
  const products = await getLatestProducts();

  return (
    <main className="flex-1">
      <ProductListing
        eyebrow="Just in"
        title="New arrivals"
        body="The latest pieces to join the collection, from soft tailoring to fine jewellery."
        products={products}
      />
    </main>
  );
}
