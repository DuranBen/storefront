import Image from "next/image";
import Link from "next/link";
import { leatherGoods, unsplash } from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/products";
import { ProductCard } from "../product-card";

/** One large editorial image beside a 2×2 product grid; stacks on mobile. */
export async function LeatherGoods() {
  const products = await getProductsBySlugs(leatherGoods.productSlugs);

  return (
    <section className="section hairline-t container-page">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-0.5">
        <div className="lg:sticky lg:top-header lg:self-start">
          <div className="relative aspect-portrait overflow-hidden bg-canvas md:max-lg:aspect-landscape">
            <Image
              src={unsplash(leatherGoods.image.id, 1800)}
              alt={leatherGoods.image.alt}
              fill
              sizes="(min-width: 64rem) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/75 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
              <p className="eyebrow">{leatherGoods.eyebrow}</p>
              <h2 className="display-sm mt-3">{leatherGoods.title}</h2>
              <p className="mt-3 max-w-sm text-white/85">{leatherGoods.body}</p>
              <Link href="/collections/handbags" className="btn btn-inverse mt-6">
                Shop leather goods
              </Link>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-0.5 gap-y-10 self-start">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} sizes="(min-width: 64rem) 25vw, 50vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
