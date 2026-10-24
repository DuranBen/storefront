import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { unsplash } from "@/lib/catalog";
import { getProduct, getProductSlugs } from "@/lib/products";
import { ProductDetails } from "./product-details";
import { ProductSkeleton } from "./product-skeleton";

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: unsplash(product.image.id, 1200), alt: product.image.alt }],
    },
  };
}

// The shell is shared by every product link (Partial Prefetching), so the
// params read lives inside Suspense. Unknown slugs get their 404 status in
// src/proxy.ts; notFound() here is the fallback.
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProductContent({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  return <ProductDetails product={product} />;
}
