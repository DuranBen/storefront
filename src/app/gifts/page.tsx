import type { Metadata } from "next";
import { SectionHeading } from "@/components/home/section-heading";
import { ListingHeader, ProductGrid } from "@/components/product-grid";
import type { Product } from "@/lib/catalog";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gifts",
  description: "Gift ideas from Atelier, every one wrapped and ready to give.",
};

/** Under this price, a piece is in "Gifts under $1,000". */
const GIFT_PRICE_LIMIT = 1000;

const sections: { title: string; href?: string; pick: (product: Product) => boolean }[] = [
  { title: "Gifts under $1,000", pick: (p) => p.price < GIFT_PRICE_LIMIT },
  {
    title: "Fine jewellery",
    href: "/collections/jewellery",
    pick: (p) => p.categorySlug === "jewellery",
  },
  {
    title: "Leather goods",
    href: "/collections/handbags",
    pick: (p) => p.categorySlug === "handbags" || p.categorySlug === "bags",
  },
];

/** A gift guide built from the live catalogue: each section filters every product. */
export default async function GiftsPage() {
  const products = await getAllProducts();

  return (
    <main className="flex-1">
      <ListingHeader
        eyebrow="Gifts"
        title="The gift guide"
        description="Every order arrives in our signature gift wrapping, ready to give."
      />
      {sections.map((section) => {
        const picks = products.filter(section.pick);
        if (picks.length === 0) return null;
        return (
          <section key={section.title} className="container-page section-sm">
            <SectionHeading title={section.title} href={section.href} linkLabel="Shop all" />
            <ProductGrid products={picks} label={section.title} />
          </section>
        );
      })}
    </main>
  );
}
