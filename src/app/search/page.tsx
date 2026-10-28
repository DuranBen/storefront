import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import { ListingSkeleton, ProductCount, ProductGrid } from "@/components/product-grid";
import { collections } from "@/lib/catalog";
import { searchProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

const MAX_QUERY = 100;

// The query is request data, so the form's current value and the results
// stream in; the heading is static.
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1">
      <div className="container-page pt-section-sm">
        <h1 className="display-sm">Search</h1>
      </div>
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, MAX_QUERY);
  const results = query ? await searchProducts(query) : [];

  return (
    <>
      <div className="container-page mt-6">
        <SearchForm query={query} />
      </div>
      <section aria-live="polite" className="container-page section-sm">
        {!query ? (
          <SearchSuggestions />
        ) : results.length === 0 ? (
          <div className="bg-canvas p-8 text-center md:p-12">
            <p className="text-body-lg">Nothing matches &ldquo;{query}&rdquo;.</p>
            <p className="mt-2 text-body-sm text-muted">
              Try a different word, or browse the collections below.
            </p>
            <div className="mt-8">
              <SearchSuggestions />
            </div>
          </div>
        ) : (
          <>
            <ProductCount count={results.length} />
            <ProductGrid products={results} label={`Results for ${query}`} />
          </>
        )}
      </section>
    </>
  );
}

function SearchForm({ query }: { query: string }) {
  return (
    <Form action="/search" role="search" className="flex max-w-xl gap-2">
      <label htmlFor="search-query" className="sr-only">
        Search products
      </label>
      <input
        id="search-query"
        name="q"
        type="search"
        defaultValue={query}
        maxLength={MAX_QUERY}
        placeholder="Search for coats, bags, jewellery…"
        // Arriving from the header's search icon: ready to type.
        autoFocus={!query}
        className="field"
      />
      <button type="submit" className="btn btn-primary shrink-0" aria-label="Search">
        <SearchIcon />
      </button>
    </Form>
  );
}

function SearchSuggestions() {
  return (
    <nav aria-label="Browse collections">
      <p className="label-caps text-muted">Browse</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
        {[{ slug: "new", title: "New in", href: "/new" }, ...collections].map((c) => (
          <li key={c.slug}>
            <Link
              href={"href" in c ? c.href : `/collections/${c.slug}`}
              className="btn btn-secondary btn-sm"
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchSkeleton() {
  return (
    <>
      <div className="container-page mt-6 animate-pulse">
        <div className="h-12 max-w-xl bg-canvas" />
      </div>
      <ListingSkeleton heading={false} />
    </>
  );
}
