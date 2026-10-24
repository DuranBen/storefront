import { newArrivalSlugs } from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/products";
import { ProductCard } from "../product-card";
import { ProductRail } from "../product-rail";
import { SectionHeading } from "./section-heading";

export async function NewArrivals() {
  const newArrivals = await getProductsBySlugs(newArrivalSlugs);

  return (
    <section className="section hairline-t container-page">
      <SectionHeading eyebrow="Just in" title="New arrivals" href="/new" />
      <ProductRail label="New arrivals">
        {newArrivals.map((product) => (
          <li key={product.slug}>
            <ProductCard
              product={product}
              sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 40vw, 72vw"
            />
          </li>
        ))}
      </ProductRail>
    </section>
  );
}
