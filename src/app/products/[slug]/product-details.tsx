import Link from "next/link";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product-card";
import { Disclosure } from "@/components/product/disclosure";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductRail } from "@/components/product-rail";
import { formatPrice, stockState, stockUnits, unsplash, type Product } from "@/lib/catalog";
import { getRelatedProducts } from "@/lib/products";

/** Breadcrumb, gallery, purchase panel and related products for one product. */
export function ProductDetails({ product }: { product: Product }) {
  const categoryHref = `/collections/${product.categorySlug}`;
  const available = stockState(stockUnits(product)).status !== "out_of_stock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: unsplash(product.image.id, 1200),
    category: product.category,
    color: product.colour,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so product text can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="container-page py-4 lg:py-6">
        <ol className="flex flex-wrap items-center gap-x-2 text-caption text-muted">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={categoryHref} className="link-quiet">
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="-mx-gutter lg:col-span-7 lg:mx-0">
          <ProductGallery key={product.slug} images={[product.image, ...(product.gallery ?? [])]} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:max-w-md">
            <Link href={categoryHref} className="eyebrow text-muted link-quiet">
              {product.category}
            </Link>
            <h1 className="heading mt-3">{product.name}</h1>
            <p className="mt-3 text-body-lg">{formatPrice(product.price)}</p>
            <p className="mt-1 text-body-sm text-muted">Colour: {product.colour}</p>

            <div className="mt-8">
              <PurchasePanel
                key={product.slug}
                slug={product.slug}
                name={product.name}
                sizes={product.sizes}
                stock={product.stock}
              />
            </div>

            <ul className="mt-8 space-y-1 text-body-sm text-muted">
              <li>Complimentary express delivery and returns</li>
              <li>Signature gift wrapping on every order</li>
            </ul>

            <div className="mt-8 hairline-t">
              <Disclosure title="Description" defaultOpen>
                <p>{product.description}</p>
              </Disclosure>
              <Disclosure title="Details & materials">
                <ul className="list-disc space-y-1 pl-4">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                  <li>Made in {product.madeIn}</li>
                </ul>
              </Disclosure>
              <Disclosure title="Delivery & returns">
                <p>
                  Complimentary express delivery in 2–4 working days. Returns are free within 30
                  days. Book a collection from your account and we&rsquo;ll pick it up from your
                  door.
                </p>
              </Disclosure>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
    </>
  );
}

async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product.slug, product.categorySlug);

  return (
    <section className="section container-page">
      <SectionHeading title="You may also like" />
      <ProductRail label="You may also like">
        {related.map((p) => (
          <li key={p.slug}>
            <ProductCard
              product={p}
              sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 40vw, 72vw"
            />
          </li>
        ))}
      </ProductRail>
    </section>
  );
}
