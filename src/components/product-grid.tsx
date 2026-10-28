import Image from "next/image";
import { unsplash, type Img, type Product } from "@/lib/catalog";
import { ProductCard } from "./product-card";

/** A listing of products: 2 → 3 → 4 columns (the grid-products utility). */
export function ProductGrid({ products, label }: { products: Product[]; label: string }) {
  return (
    <ul aria-label={label} className="grid-products">
      {products.map((product) => (
        <li key={product.slug}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

/** "12 pieces" above a listing. */
export function ProductCount({ count }: { count: number }) {
  return (
    <p className="mb-6 text-body-sm text-muted">
      {count} {count === 1 ? "piece" : "pieces"}
    </p>
  );
}

/**
 * The title block of a listing page: a campaign image with the copy over it
 * when there is one, otherwise a plain heading.
 */
export function ListingHeader({
  eyebrow,
  title,
  description,
  image,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: Img;
}) {
  if (image) {
    return (
      <section className="media-hero max-h-[60svh] text-white">
        <Image
          src={unsplash(image.id)}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          style={{ objectPosition: image.position }}
        />
        {/* Scrim keeps the copy legible over bright areas. */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 pb-10 md:pb-14">
          <div className="container-page">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="display mt-3 max-w-3xl">{title}</h1>
            {description && (
              <p className="mt-4 max-w-md text-body-lg text-white/85">{description}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="container-page pt-section-sm">
      {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
      <h1 className="display-sm mt-3">{title}</h1>
      {description && <p className="mt-4 max-w-text text-body-lg text-muted">{description}</p>}
    </div>
  );
}

/** Placeholder for a listing page while it streams in. */
export function ListingSkeleton({ heading = true }: { heading?: boolean }) {
  return (
    <div aria-busy="true" className="animate-pulse">
      {heading && (
        <div className="container-page pt-section-sm">
          <div className="h-3 w-24 bg-canvas" />
          <div className="mt-3 h-10 w-72 max-w-full bg-canvas" />
        </div>
      )}
      <div className="container-page section-sm grid-products">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="media-product" />
            <div className="mt-3 h-4 w-2/3 bg-canvas" />
          </div>
        ))}
      </div>
    </div>
  );
}
