import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListing, ProductListingSkeleton } from "@/components/product-listing";
import { getCategory, getCategorySlugs } from "@/lib/products";

export async function generateStaticParams() {
  return (await getCategorySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};

  return {
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} at Atelier.`,
  };
}

// Same shape as the product page: the params read lives inside Suspense so
// the shell is shared, and unknown slugs get their 404 status in src/proxy.ts.
export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductListingSkeleton />}>
        <CollectionContent params={params} />
      </Suspense>
    </main>
  );
}

async function CollectionContent({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();

  return <ProductListing eyebrow="Collection" title={category.name} products={category.products} />;
}
