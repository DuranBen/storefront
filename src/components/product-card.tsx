import Image from "next/image";
import Link from "next/link";
import { formatPrice, stockState, stockUnits, unsplash, type Product } from "@/lib/catalog";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  sizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw",
}: {
  product: Product;
  sizes?: string;
}) {
  const soldOut = stockState(stockUnits(product)).status === "out_of_stock";
  const badge = soldOut ? "Sold out" : product.badge;

  return (
    <article className="group relative">
      <div className="media-product">
        <Image
          src={unsplash(product.image.id, 1200)}
          alt={product.image.alt}
          fill
          sizes={sizes}
          style={{ objectPosition: product.image.position }}
          className="transition-transform duration-700 ease-luxe group-hover:scale-[1.03]"
        />
        {badge && (
          <span className="eyebrow absolute top-3 left-3 bg-paper px-2 py-1">{badge}</span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2 px-2 md:px-0">
        <div className="min-w-0">
          <h3 className="text-body-sm">
            {/* Stretched link: the whole card is clickable, the heart stays separate. */}
            <Link
              href={`/products/${product.slug}`}
              className="link-quiet after:absolute after:inset-0"
            >
              {product.name}
            </Link>
          </h3>
          <p className="text-body-sm text-muted">{formatPrice(product.price)}</p>
        </div>
        <div className="relative z-10 -mt-3 -mr-2">
          <WishlistButton productName={product.name} />
        </div>
      </div>
    </article>
  );
}
