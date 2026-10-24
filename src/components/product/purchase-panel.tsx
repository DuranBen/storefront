"use client";

import { useState } from "react";
import { stockState, type Product } from "@/lib/catalog";
import { HeartIcon } from "../icons";
import { StockStatus } from "./stock-status";

/**
 * Size selection, stock state and the bag / wishlist actions.
 * Front-end only for now: nothing is persisted until the bag exists.
 */
export function PurchasePanel({
  name,
  sizes,
  stock = 0,
}: {
  name: string;
  sizes?: Product["sizes"];
  stock?: number;
}) {
  const [size, setSize] = useState<string>();
  const [needsSize, setNeedsSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [notify, setNotify] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = sizes?.find((s) => s.label === size);
  const totalUnits = sizes ? sizes.reduce((sum, s) => sum + s.stock, 0) : stock;
  const soldOut = totalUnits <= 0;
  const state = stockState(selected ? selected.stock : totalUnits);

  const addToBag = () => {
    if (sizes && !selected) {
      setNeedsSize(true);
      return;
    }
    setAdded(true);
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
                      setAdded(false);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 cursor-pointer items-center justify-center border border-line text-body-sm transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:text-subtle peer-disabled:line-through hover:border-ink peer-disabled:hover:border-line">
                    {s.label}
                  </span>
                  {unavailable && <span className="sr-only">(sold out)</span>}
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

      <StockStatus state={state} size={selected?.label} />

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
          <button type="button" onClick={addToBag} className="btn btn-primary w-full">
            {added ? "Added to bag" : "Add to bag"}
          </button>
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
        {added ? `${name}${selected ? `, size ${selected.label},` : ""} added to your bag.` : ""}
      </p>
    </div>
  );
}
