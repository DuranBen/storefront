"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StockRowForm } from "./stock-row-form";

export type StockListRow = {
  stockId: number;
  size: string | null;
  quantity: number;
  reserved: number;
  productId: number;
  productName: string;
  category: string;
  imageSrc: string;
  imagePosition?: string;
};

type ShownRow = StockListRow & { left?: boolean };

/**
 * The stock page's rows, grouped by product. A save refreshes the page, and
 * under a filter (Low stock, Sold out) the saved row may no longer match:
 * rather than vanish, taking its "Saved" message and the keyboard focus with
 * it, such rows stay until the view changes (the parent keys this list by
 * the view), marked as having left the filter.
 */
export function StockList({ rows, leftNote }: { rows: StockListRow[]; leftNote: string }) {
  const [shown, setShown] = useState<ShownRow[]>(rows);
  const [seenRows, setSeenRows] = useState(rows);
  if (rows !== seenRows) {
    setSeenRows(rows);
    setShown(keepLeftRows(shown, rows));
  }

  const groups = new Map<number, ShownRow[]>();
  for (const row of shown) groups.set(row.productId, [...(groups.get(row.productId) ?? []), row]);

  return (
    <div className="mt-2">
      {[...groups].map(([productId, productRows]) => {
        const product = productRows[0];
        return (
          <section key={productId} aria-labelledby={`stock-product-${productId}`} className="mt-6">
            <div className="flex items-center gap-3">
              <div className="media-product w-10 shrink-0" aria-hidden="true">
                <Image
                  src={product.imageSrc}
                  alt=""
                  fill
                  sizes="2.5rem"
                  style={{ objectPosition: product.imagePosition }}
                />
              </div>
              <div className="min-w-0">
                <h3 id={`stock-product-${productId}`}>
                  <Link href={`/admin/products/${productId}`} className="link-quiet">
                    {product.productName}
                  </Link>
                </h3>
                <p className="text-body-sm text-muted">{product.category}</p>
              </div>
            </div>
            <ul className="mt-2 hairline-t">
              {productRows.map((row) => (
                <StockRowForm
                  key={row.stockId}
                  stockId={row.stockId}
                  quantity={row.quantity}
                  reserved={row.reserved}
                  label={row.size ? `Size ${row.size}` : "One size"}
                  note={row.left ? leftNote : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Fresh rows in their previous order; rows that dropped out are kept and marked. */
function keepLeftRows(previous: ShownRow[], next: StockListRow[]): ShownRow[] {
  const fresh = new Map(next.map((row) => [row.stockId, row]));
  const merged: ShownRow[] = previous.map((row) => fresh.get(row.stockId) ?? { ...row, left: true });
  const known = new Set(previous.map((row) => row.stockId));
  for (const row of next) if (!known.has(row.stockId)) merged.push(row);
  return merged;
}
