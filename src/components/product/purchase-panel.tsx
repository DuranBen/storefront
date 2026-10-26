"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart, type AddToCartResult } from "@/lib/cart-actions";
import { notifyCartChange } from "@/lib/cart-cookie";
import { LOW_STOCK_THRESHOLD, stockState, type Product } from "@/lib/catalog";
import { HeartIcon } from "../icons";
import { StockStatus } from "./stock-status";

/**
 * Size selection, stock state and the bag / wishlist actions. Adding goes
 * through the addToCart Server Action, which checks live stock; the stock
 * shown here comes from the cached product and can be a few minutes old.
 * The wishlist is still front-end only.
 */
export function PurchasePanel({
  slug,
  name,
  sizes,
  stock = 0,
}: {
  slug: string;
  name: string;
  sizes?: Product["sizes"];
  stock?: number;
}) {
  const [size, setSize] = useState<string>();
  const [needsSize, setNeedsSize] = useState(false);
  const [result, setResult] = useState<AddToCartResult | null>(null);
  const [adding, startAdding] = useTransition();
  const [notify, setNotify] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = sizes?.find((s) => s.label === size);
  const totalUnits = sizes ? sizes.reduce((sum, s) => sum + s.stock, 0) : stock;
  const soldOut = totalUnits <= 0;
  const state = stockState(selected ? selected.stock : totalUnits);
  // Before a size is chosen, flag sizes running low (marked with a dot) even
  // when the product as a whole has plenty.
  const someSizesLow =
    !selected &&
    state.status === "in_stock" &&
    !!sizes?.some((s) => s.stock > 0 && s.stock <= LOW_STOCK_THRESHOLD);
  const added = result?.status === "added" || result?.status === "limited";
  const sizeLabel = selected ? `, size ${selected.label},` : "";

  const addToBag = () => {
    if (sizes && !selected) {
      setNeedsSize(true);
      return;
    }
    startAdding(async () => {
      let next: AddToCartResult;
      try {
        next = await addToCart({ slug, size: selected?.label ?? null });
      } catch {
        next = { status: "invalid", message: "We couldn't add this to your bag. Please try again." };
      }
      setResult(next);
      if (next.status === "added" || next.status === "limited") notifyCartChange();
    });
  };

  return (
    <div className="space-y-6">
      {sizes && !soldOut && (
        <fieldset>
          <legend className="label-caps">
            Size{size && <span className="ml-2 text-muted normal-case tracking-normal">{size}</span>}
          </legend>
          <div className="mt-3 grid grid-cols-5 gap-0.5 sm:grid-cols-6">
            {sizes.map((s) => {
              const unavailable = s.stock <= 0;
              const low = !unavailable && s.stock <= LOW_STOCK_THRESHOLD;
              return (
                <label key={s.label} className="relative">
                  <input
                    type="radio"
                    name="size"
                    value={s.label}
                    disabled={unavailable}
                    checked={size === s.label}
                    onChange={() => {
                      setSize(s.label);
                      setNeedsSize(false);
                      setResult(null);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 cursor-pointer items-center justify-center border border-line text-body-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:text-subtle peer-disabled:line-through hover:border-ink peer-disabled:hover:border-line">
                    {s.label}
                  </span>
                  {low && (
                    // Same red dot as "Only N left": this size is running low.
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1.5 right-1.5 size-1.5 rounded-full bg-sale peer-checked:bg-paper"
                    />
                  )}
                  {unavailable && <span className="sr-only">(sold out)</span>}
                  {low && <span className="sr-only">(only {s.stock} left)</span>}
                </label>
              );
            })}
          </div>
          {needsSize && (
            <p role="alert" className="mt-2 text-body-sm text-sale">
              Please select a size.
            </p>
          )}
        </fieldset>
      )}

      {someSizesLow ? (
        <StockStatus state={{ status: "low_stock", units: 0 }} label="Few left in some sizes" />
      ) : (
        <StockStatus state={state} size={selected?.label} />
      )}

      <div className="space-y-2">
        {soldOut ? (
          <>
            <button type="button" disabled className="btn btn-primary w-full">
              Sold out
            </button>
            {notify ? (
              <p role="status" className="py-3 text-center text-body-sm">
                We&rsquo;ll email you as soon as it&rsquo;s back.
              </p>
            ) : (
              <button type="button" onClick={() => setNotify(true)} className="btn btn-secondary w-full">
                Notify me when available
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={addToBag}
              disabled={adding}
              className="btn btn-primary w-full"
            >
              {adding ? "Adding…" : added ? "Added to bag" : "Add to bag"}
            </button>
            {result && !adding && <AddResultMessage result={result} />}
          </>
        )}

        <button
          type="button"
          aria-pressed={saved}
          onClick={() => setSaved((s) => !s)}
          className="btn btn-secondary w-full"
        >
          <HeartIcon width={16} height={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved to wishlist" : "Add to wishlist"}
        </button>
      </div>

      <p role="status" className="sr-only">
        {result?.status === "added" ? `${name}${sizeLabel} added to your bag.` : ""}
      </p>
    </div>
  );
}

function AddResultMessage({ result }: { result: AddToCartResult }) {
  switch (result.status) {
    case "added":
      return (
        <p className="py-1 text-center text-body-sm">
          <Link href="/bag" className="link">
            View bag
          </Link>
        </p>
      );
    case "limited":
      return (
        <p role="alert" className="py-1 text-center text-body-sm">
          {result.max === 1 ? "Only 1 available" : `Only ${result.max} available`}, and
          you have {result.quantity} in your bag.{" "}
          <Link href="/bag" className="link">
            View bag
          </Link>
        </p>
      );
    case "sold_out":
      return (
        <p role="alert" className="py-1 text-center text-body-sm text-sale">
          Sorry, this has just sold out.
        </p>
      );
    case "invalid":
      return (
        <p role="alert" className="py-1 text-center text-body-sm text-sale">
          {result.message}
        </p>
      );
  }
}
