import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSection, AdminSectionSkeleton } from "@/components/admin/admin-shell";
import { StockList } from "@/components/admin/stock-list";
import { listCategoryOptions, listStock, STOCK_VIEWS, type StockView } from "@/lib/admin";
import { LOW_STOCK_THRESHOLD, unsplash } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Stock",
  robots: { index: false },
};

const viewLabels: Record<StockView, string> = {
  all: "All",
  low: "Low stock",
  out: "Sold out",
};

const emptyMessages: Record<StockView, string> = {
  all: "No stock rows yet. Products get them when they're created.",
  low: `Nothing is running low (${LOW_STOCK_THRESHOLD} or fewer available).`,
  out: "Nothing is sold out.",
};

// For rows saved out of the current filter, kept until the view changes.
const leftNotes: Record<StockView, string> = {
  all: "",
  low: "No longer low on stock. It leaves this list when you change view or reload.",
  out: "No longer sold out. It leaves this list when you change view or reload.",
};

// AdminSection and listStock each call requireAdmin(); the filters are
// request data, so they're read inside Suspense.
export default function AdminStockPage({ searchParams }: PageProps<"/admin/stock">) {
  return (
    <Suspense fallback={<AdminSectionSkeleton />}>
      <AdminSection path="/admin/stock" title="Stock">
        <StockSection searchParams={searchParams} />
      </AdminSection>
    </Suspense>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** A stock row id from the URL (a page cursor), or null if it isn't one. */
const cursorParam = (value: string | undefined) =>
  value && /^\d{1,9}$/.test(value) && Number(value) > 0 ? Number(value) : null;

async function StockSection({ searchParams }: Pick<PageProps<"/admin/stock">, "searchParams">) {
  const params = await searchParams;
  const categories = await listCategoryOptions("/admin/stock");

  // Filters come from the URL: accept only known values.
  const viewParam = one(params.view);
  const view: StockView = STOCK_VIEWS.find((v) => v === viewParam) ?? "all";
  const categoryParam = Number(one(params.category));
  const categoryId = categories.some((c) => c.id === categoryParam) ? categoryParam : null;
  const after = cursorParam(one(params.after));
  const before = after ? null : cursorParam(one(params.before));

  const { rows, counts, total, start, hasPrevious, hasNext } = await listStock({
    view,
    categoryId,
    after,
    before,
  });

  const href = (next: { view?: StockView; after?: number; before?: number }) => {
    const query = new URLSearchParams();
    const v = next.view ?? view;
    if (v !== "all") query.set("view", v);
    if (categoryId) query.set("category", String(categoryId));
    if (next.after) query.set("after", String(next.after));
    if (next.before) query.set("before", String(next.before));
    const qs = query.toString();
    return `/admin/stock${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <p className="mt-3 max-w-xl text-body-sm text-muted">
        Units available to sell. Units reserved by checkouts in progress are already subtracted,
        and return automatically if those checkouts aren&rsquo;t paid.
      </p>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 hairline-b pb-4">
        <nav aria-label="Filter stock">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {STOCK_VIEWS.map((v) => (
              <li key={v}>
                <Link
                  href={href({ view: v })}
                  aria-current={v === view ? "page" : undefined}
                  className={`label-caps ${v === view ? "text-ink underline underline-offset-[0.4em]" : "text-muted hover:text-ink"}`}
                >
                  {viewLabels[v]} <span className="tabular-nums">({counts[v]})</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Form action="/admin/stock" className="flex items-center gap-2">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <label htmlFor="stock-category" className="sr-only">
            Category
          </label>
          <select
            id="stock-category"
            name="category"
            defaultValue={categoryId ?? ""}
            className="field w-auto py-2"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary btn-sm">
            Apply
          </button>
        </Form>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 bg-canvas p-8 text-center text-body-lg md:p-12">{emptyMessages[view]}</p>
      ) : (
        <>
          <p className="mt-4 text-body-sm text-muted">
            {!hasPrevious && !hasNext
              ? `${total} ${total === 1 ? "size" : "sizes"}`
              : `Showing ${start}–${start + rows.length - 1} of ${total} sizes`}
          </p>
          <StockList
            // A new view or page starts a fresh list (see StockList).
            key={`${view}:${categoryId ?? ""}:${after ?? ""}:${before ?? ""}`}
            leftNote={leftNotes[view]}
            rows={rows.map((row) => ({
              stockId: row.stockId,
              size: row.size,
              quantity: row.quantity,
              reserved: row.reserved,
              productId: row.productId,
              productName: row.productName,
              category: row.category,
              imageSrc: unsplash(row.image.id, 120),
              imagePosition: row.image.position,
            }))}
          />

          {(hasPrevious || hasNext) && (
            <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-4">
              {hasPrevious ? (
                <Link href={href({ before: rows[0].stockId })} className="label-caps link">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {hasNext ? (
                <Link href={href({ after: rows.at(-1)!.stockId })} className="label-caps link">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
