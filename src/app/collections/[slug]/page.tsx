import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ListingHeader,
  ListingSkeleton,
  ProductCount,
  ProductGrid,
} from "@/components/product-grid";
import { collectionPages, unsplash } from "@/lib/catalog";
import {
  getAllProducts,
  getCategory,
  getCategorySlugs,
  getProductsByCategories,
  getProductsBySlugs,
} from "@/lib/products";

export async function generateStaticParams() {
  const slugs = new Set([...collectionPages.map((c) => c.slug), ...(await getCategorySlugs())]);
  return [...slugs].map((slug) => ({ slug }));
}

/** An editorial collection (src/lib/catalog.ts), else a category's page; undefined if neither. */
async function resolveCollection(slug: string) {
  const page = collectionPages.find((c) => c.slug === slug);
  if (page) {
    const products =
      "productSlugs" in page
        ? await getProductsBySlugs(page.productSlugs)
        : "categorySlugs" in page
          ? await getProductsByCategories(page.categorySlugs)
          : await getAllProducts();
    return { ...page, products };
  }
  const category = await getCategory(slug);
  if (!category) return undefined;
  return {
    eyebrow: "Category",
    title: category.name,
    description: undefined,
    image: undefined,
    products: await getProductsByCategories([category.slug]),
  };
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const collection = await resolveCollection((await params).slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description,
    openGraph: collection.image
      ? { images: [{ url: unsplash(collection.image.id, 1200), alt: collection.image.alt }] }
      : undefined,
  };
}

// The shell is shared by every collection link (Partial Prefetching), so the
// params read lives inside Suspense. Unknown slugs get their 404 status in
// src/proxy.ts; notFound() here is the fallback.
export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ListingSkeleton />}>
        <CollectionContent params={params} />
      </Suspense>
    </main>
  );
}

async function CollectionContent({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const collection = await resolveCollection((await params).slug);
  if (!collection) notFound();

  return (
    <>
      <ListingHeader
        eyebrow={collection.eyebrow}
        title={collection.title}
        description={collection.description}
        image={collection.image}
      />
      <section className="container-page section-sm">
        {collection.products.length === 0 ? (
          <div className="bg-canvas p-8 text-center md:p-12">
            <p className="text-body-lg">Nothing here just yet.</p>
            <Link href="/new" className="btn btn-primary mt-6">
              See what&rsquo;s new
            </Link>
          </div>
        ) : (
          <>
            <ProductCount count={collection.products.length} />
            <ProductGrid products={collection.products} label={collection.title} />
          </>
        )}
      </section>
    </>
  );
}
