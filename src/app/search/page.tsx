import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListingGrid, ListingGridSkeleton, ListingHeader } from "@/components/product-listing";
import { SearchForm } from "@/components/search-form";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog";
import { getLatestProducts, searchProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

type SearchParams = Pick<PageProps<"/search">, "searchParams">;

async function getQuery({ searchParams }: SearchParams) {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : q ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

// The title block is static; the query is only read inside Suspense, so the
// shell prerenders and the form value and results stream in.
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1">
      <ListingHeader title="Search" body="Find pieces by name, colour or category.">
        <Suspense fallback={<SearchForm />}>
          <QueryForm searchParams={searchParams} />
        </Suspense>
      </ListingHeader>

      <Suspense fallback={<ListingGridSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function QueryForm({ searchParams }: SearchParams) {
  const query = await getQuery({ searchParams });
  // Keyed so the input resets to the new query after each navigation.
  return <SearchForm key={query} defaultValue={query} autoFocus={!query} />;
}

async function SearchResults({ searchParams }: SearchParams) {
  const query = await getQuery({ searchParams });

  // Nothing searched yet: show what's new instead of an empty page.
  if (!query) {
    return <ListingGrid products={await getLatestProducts(8)} label="New arrivals" empty={null} />;
  }

  const results = await searchProducts(query);

  return (
    <ListingGrid
      products={results}
      label={
        <span role="status">
          {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </span>
      }
      empty={
        <>
          <p className="text-body-lg text-muted">
            Nothing matched your search. Try another word, or browse what&rsquo;s new.
          </p>
          <Link href="/new" className="btn btn-secondary mt-8">
            Shop new arrivals
          </Link>
        </>
      }
    />
  );
}
